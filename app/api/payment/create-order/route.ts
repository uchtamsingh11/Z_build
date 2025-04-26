import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

// Cashfree API constants
const CASHFREE_API_VERSION = '2023-08-01';
const CASHFREE_BASE_URL = 'https://api.cashfree.com/pg';
// Maximum retry attempts for order creation
const MAX_RETRIES = 2;

export async function POST(request: Request) {
  let retryCount = 0;
  
  async function attemptOrderCreation() {
    try {
      const supabase = await createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
      
      // Get the request data
      const requestData = await request.json();
      const { amount = 1, currency = 'INR' } = requestData;
      
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
      }
      
      // Create a unique order ID with timestamp to help with debugging
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const orderId = `order_${timestamp}_${randomUUID().slice(0, 8)}`;
      
      // The absolute URL for return with comprehensive parameters
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const returnUrl = `${appUrl}/payment/status?orderId=${orderId}&amount=${amount}&ts=${Date.now()}`;
      
      // Create order in Cashfree - follow exact API structure
      const orderPayload = {
        order_id: orderId,
        order_amount: amount,
        order_currency: currency,
        customer_details: {
          customer_id: user.id,
          customer_email: user.email || 'customer@example.com',
          customer_phone: '9999999999',
          customer_name: user.user_metadata?.full_name || 'Customer'
        },
        order_meta: {
          return_url: returnUrl,
          notify_url: `${appUrl}/api/payment/webhook`,
          payment_methods: "" // Empty string allows all payment methods
        },
        order_expiry_time: getExpiryTime(), // Set expiry time to 25 mins instead of default 30
        order_note: `Simple payment of Rs. ${amount}`
      };
      
      console.log(`[Attempt ${retryCount + 1}] Sending order payload to Cashfree:`, JSON.stringify(orderPayload, null, 2));
      
      // Add timestamp header to avoid time synchronization issues
      const cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-version': CASHFREE_API_VERSION,
          'x-client-id': process.env.CASHFREE_APP_ID!,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
          'x-request-timestamp': new Date().toISOString() // Add timestamp for clock synchronization
        },
        body: JSON.stringify(orderPayload)
      });
      
      const cashfreeData = await cashfreeResponse.json();
      
      // Log the complete response for debugging
      console.log(`[Attempt ${retryCount + 1}] Cashfree API response:`, JSON.stringify(cashfreeData, null, 2));
      
      if (!cashfreeResponse.ok) {
        console.error(`[Attempt ${retryCount + 1}] Cashfree API error:`, cashfreeData);
        
        // Check if we should retry based on error type
        if (retryCount < MAX_RETRIES && isRetriableError(cashfreeData)) {
          retryCount++;
          console.log(`Retrying order creation, attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
          return await attemptOrderCreation();
        }
        
        return NextResponse.json({ 
          error: cashfreeData.message || 'Failed to create payment order',
          details: cashfreeData
        }, { status: 500 });
      }
      
      // Validate response data to ensure we have what we need
      if (!cashfreeData.payment_session_id && !cashfreeData.payment_link) {
        console.error('Invalid Cashfree response - missing required payment data');
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying due to invalid response, attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
          return await attemptOrderCreation();
        }
        
        return NextResponse.json({ 
          error: 'Payment gateway error: Required payment data missing',
        }, { status: 500 });
      }
      
      // Store the order in our database
      const { error: insertError } = await supabase
        .from('payment_orders')
        .insert({
          user_id: user.id,
          order_id: orderId,
          amount: amount,
          status: 'PENDING',
          payment_session_id: cashfreeData.payment_session_id || null,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('DB error:', insertError);
        // Continue even if DB insert fails, as the payment can still be processed
      }
      
      // Return the exact response format expected by the client
      return NextResponse.json({
        order_id: orderId,
        payment_session_id: cashfreeData.payment_session_id,
        payment_link: cashfreeData.payment_link
      });
      
    } catch (error) {
      console.error(`[Attempt ${retryCount + 1}] API Error:`, error);
      
      // Retry on network or unexpected errors
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retrying due to unexpected error, attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
        return await attemptOrderCreation();
      }
      
      return NextResponse.json({ error: 'Server error, please try again' }, { status: 500 });
    }
  }
  
  return attemptOrderCreation();
}

// Helper to get expiry time 25 minutes from now (to avoid 30-min limit issues)
function getExpiryTime(): string {
  const expiryDate = new Date(Date.now() + 25 * 60 * 1000); // 25 mins from now
  return expiryDate.toISOString();
}

// Helper to identify errors that can be retried
function isRetriableError(errorResponse: any): boolean {
  // Retry on rate limiting, temporary server errors, or network issues
  if (!errorResponse || !errorResponse.code) return true;
  
  const retriableCodes = [
    'RATE_LIMIT_EXCEEDED',
    'SERVER_ERROR',
    'GATEWAY_ERROR',
    'SERVICE_UNAVAILABLE'
  ];
  
  // If we have a specific code, check if it's retriable
  if (errorResponse.code && typeof errorResponse.code === 'string') {
    return retriableCodes.includes(errorResponse.code);
  }
  
  // If there's a message about timeouts or connection issues
  if (errorResponse.message && typeof errorResponse.message === 'string') {
    const message = errorResponse.message.toLowerCase();
    return message.includes('timeout') || 
           message.includes('connection') ||
           message.includes('try again');
  }
  
  return false;
} 