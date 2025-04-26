import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cashfree API constants
const CASHFREE_API_VERSION = '2023-08-01';
const CASHFREE_BASE_URL = 'https://api.cashfree.com/pg';
const MAX_RETRIES = 2;

export async function GET(request: Request) {
  let retryCount = 0;
  
  async function attemptVerification() {
    try {
      const supabase = await createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
      
      // Get order ID from query params
      const { searchParams } = new URL(request.url);
      const orderId = searchParams.get('orderId');
      
      if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
      }
      
      // Log the verification attempt
      console.log(`[Attempt ${retryCount + 1}] Verifying payment for order: ${orderId}`);
      
      // Get the order from our database first
      const { data: orderData, error: orderError } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('order_id', orderId)
        .eq('user_id', user.id)
        .single();
      
      if (orderError) {
        console.error('Order query error:', orderError);
        // Continue even if we can't find the order in our database
      }
      
      // If we found the order and it's already completed or failed, return the status
      if (orderData && (orderData.status === 'COMPLETED' || orderData.status === 'FAILED')) {
        console.log(`Order ${orderId} already has final status: ${orderData.status}`);
        return NextResponse.json({
          status: orderData.status,
          order: orderData
        });
      }
      
      // Verify payment status with Cashfree
      const cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-version': CASHFREE_API_VERSION,
          'x-client-id': process.env.CASHFREE_APP_ID!,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
          'x-request-timestamp': new Date().toISOString() // Add timestamp for clock synchronization
        }
      });
      
      const cashfreeData = await cashfreeResponse.json();
      
      // Log the Cashfree response for debugging
      console.log(`[Attempt ${retryCount + 1}] Cashfree verification response:`, JSON.stringify(cashfreeData, null, 2));
      
      if (!cashfreeResponse.ok) {
        console.error(`[Attempt ${retryCount + 1}] Cashfree API error:`, cashfreeData);
        
        // Retry for retriable errors
        if (retryCount < MAX_RETRIES && isRetriableError(cashfreeData)) {
          retryCount++;
          console.log(`Retrying verification, attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
          // Add a small delay before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await attemptVerification();
        }
        
        // If it's a 404, the order might not exist in Cashfree yet
        if (cashfreeResponse.status === 404) {
          // Return pending for non-existent orders
          return NextResponse.json({ 
            status: 'PENDING',
            message: 'Order not found in payment gateway',
            order: orderData || { order_id: orderId }
          });
        }
        
        return NextResponse.json({ error: 'Failed to verify payment status' }, { status: 500 });
      }
      
      // Map Cashfree order status to our status
      let newStatus = orderData?.status || 'PENDING';
      if (cashfreeData.order_status === 'PAID') {
        newStatus = 'COMPLETED';
      } else if (['EXPIRED', 'CANCELLED', 'FAILED'].includes(cashfreeData.order_status)) {
        newStatus = 'FAILED';
      }
      
      console.log(`Mapped Cashfree status ${cashfreeData.order_status} to ${newStatus}`);
      
      // Update or create the order status in our database
      if (orderData) {
        // Update if order exists
        if (newStatus !== orderData.status) {
          const { error: updateError } = await supabase
            .from('payment_orders')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId)
            .eq('user_id', user.id);
          
          if (updateError) {
            console.error('Failed to update order status:', updateError);
          } else {
            console.log(`Updated order ${orderId} status to ${newStatus}`);
          }
        }
      } else {
        // Create order record if it doesn't exist
        const { error: insertError } = await supabase
          .from('payment_orders')
          .insert({
            user_id: user.id,
            order_id: orderId,
            amount: cashfreeData.order_amount || 1,
            status: newStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Failed to create order record:', insertError);
        } else {
          console.log(`Created new order record for ${orderId} with status ${newStatus}`);
        }
      }
      
      // Return the order status and details
      return NextResponse.json({
        status: newStatus,
        order: {
          ...cashfreeData,
          status: newStatus
        }
      });
      
    } catch (error) {
      console.error(`[Attempt ${retryCount + 1}] Verification error:`, error);
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retrying due to error, attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
        // Add a small delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await attemptVerification();
      }
      
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }
  
  return attemptVerification();
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