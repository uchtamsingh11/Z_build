import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Cashfree API constants
const CASHFREE_API_VERSION = '2023-08-01';
const CASHFREE_BASE_URL = 'https://api.cashfree.com/pg';
const MAX_RETRIES = 2;

export async function GET(request: Request) {
  try {
    let retryCount = 0;
    
    // Get query parameters early to validate them
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const coins = searchParams.get('coins');
    const timestamp = searchParams.get('ts');
    
    // Validate required parameters
    if (!orderId) {
      console.log('Missing orderId parameter');
      return NextResponse.json({ 
        success: false, 
        message: "Payment verification failed. Missing order information." 
      }, { status: 400 });
    }
    
    // Log the verification request
    console.log(`Payment verification request: orderId=${orderId}, amount=${amount}, coins=${coins}, ts=${timestamp}`);
    
    async function attemptVerification() {
      try {
        const supabase = await createClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log('User authentication failed:', userError);
          return NextResponse.json({ 
            success: false, 
            message: "Authentication required. Please log in to verify your payment." 
          }, { status: 401 });
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
        
        // If we found the order and it's already completed, check if coins were already credited
        if (orderData && orderData.status === 'COMPLETED') {
          console.log(`Order ${orderId} already completed`);
          
          // Check if a coin transaction has been created for this order
          const { data: coinTransaction, error: coinError } = await supabase
            .from('coin_transactions')
            .select('*')
            .eq('order_id', orderId)
            .single();
            
          if (coinTransaction) {
            console.log(`Coins already credited for order ${orderId}`);
            return NextResponse.json({
              success: true,
              message: "Payment verified successfully.",
              coinsAdded: coinTransaction.amount || orderData.coins || 0,
              status: 'COMPLETED'
            });
          }
          
          // If completed but no coins added, add coins now
          const coinsToAdd = orderData.coins || (coins ? parseInt(coins) : 0) || 0;
          if (coinsToAdd > 0) {
            try {
              await addCoinsToUserBalance(supabase, user.id, coinsToAdd, orderId as string);
              return NextResponse.json({
                success: true,
                message: "Payment verified successfully.",
                coinsAdded: coinsToAdd,
                status: 'COMPLETED'
              });
            } catch (coinError) {
              console.error('Failed to add coins:', coinError);
              return NextResponse.json({
                success: false,
                message: "Payment was successful, but we couldn't add coins to your account. Please contact support.",
                status: 'COMPLETED'
              });
            }
          }
          
          return NextResponse.json({
            success: true,
            message: "Payment verified successfully.",
            coinsAdded: 0,
            status: orderData.status
          });
        }
        
        // If payment already failed, return the status
        if (orderData && orderData.status === 'FAILED') {
          console.log(`Order ${orderId} already marked as failed`);
          return NextResponse.json({
            success: false,
            message: "Payment verification failed. Your payment was not successful.",
            status: orderData.status
          });
        }
        
        // Verify payment status with Cashfree
        let cashfreeData;
        let cashfreeResponse;
        
        try {
          cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'x-api-version': CASHFREE_API_VERSION,
              'x-client-id': process.env.CASHFREE_APP_ID!,
              'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
              'x-request-timestamp': new Date().toISOString() // Add timestamp for clock synchronization
            }
          });
          
          cashfreeData = await cashfreeResponse.json();
          
          // Log the Cashfree response for debugging
          console.log(`[Attempt ${retryCount + 1}] Cashfree verification response:`, JSON.stringify(cashfreeData, null, 2));
        } catch (apiError) {
          console.error(`[Attempt ${retryCount + 1}] Cashfree API connection error:`, apiError);
          
          // Retry for connection errors
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying verification due to connection error, attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
            // Add a small delay before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await attemptVerification();
          }
          
          return NextResponse.json({
            success: false,
            message: "Payment verification service is currently unavailable. Please try again later.",
          }, { status: 503 });
        }
        
        if (!cashfreeResponse?.ok) {
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
          if (cashfreeResponse?.status === 404) {
            // Return pending for non-existent orders
            return NextResponse.json({ 
              success: false,
              message: "Payment information not found. Please try again in a few minutes.",
              status: 'PENDING'
            });
          }
          
          return NextResponse.json({ 
            success: false, 
            message: "Payment verification failed. Please try again or contact support."
          }, { status: 400 });
        }
        
        // Extract coins amount from order note or custom fields
        const orderNote = cashfreeData?.order_note || '';
        let coinsAmount = 0;
        
        // Try to extract coins amount from the order JSON
        try {
          if (orderData && orderData.coins) {
            coinsAmount = parseInt(orderData.coins.toString());
          } else if (coins) {
            coinsAmount = parseInt(coins);
          } else if (cashfreeData?.order_meta && cashfreeData.order_meta.coins) {
            coinsAmount = parseInt(cashfreeData.order_meta.coins.toString());
          } else {
            // Try to extract from order note (format: "Purchase of X coins" or similar)
            const coinMatch = orderNote.match(/(\d+)\s*coins/i);
            if (coinMatch && coinMatch[1]) {
              coinsAmount = parseInt(coinMatch[1]);
            } else {
              // Default to 1:1 ratio with amount as fallback
              coinsAmount = Math.floor(parseFloat(cashfreeData?.order_amount || amount || '0'));
            }
          }
        } catch (error) {
          console.error('Error extracting coins amount:', error);
          // Default to amount as fallback
          coinsAmount = Math.floor(parseFloat(cashfreeData?.order_amount || amount || '0'));
        }
        
        // Map Cashfree order status to our status
        let newStatus = orderData?.status || 'PENDING';
        let coinsAdded = false;
        
        if (cashfreeData?.order_status === 'PAID') {
          newStatus = 'COMPLETED';
          
          // Add coins to user balance only if payment is successful
          if (coinsAmount > 0) {
            try {
              await addCoinsToUserBalance(supabase, user.id, coinsAmount, orderId as string);
              coinsAdded = true;
            } catch (coinError) {
              console.error('Failed to add coins:', coinError);
              // Continue with verification, we'll at least update the order status
            }
          }
        } else if (['EXPIRED', 'CANCELLED', 'FAILED'].includes(cashfreeData?.order_status || '')) {
          newStatus = 'FAILED';
        }
        
        console.log(`Mapped Cashfree status ${cashfreeData?.order_status || 'UNKNOWN'} to ${newStatus}`);
        
        // Update or create the order status in our database
        try {
          if (orderData) {
            // Update if order exists
            if (newStatus !== orderData.status || !orderData.coins) {
              const { error: updateError } = await supabase
                .from('payment_orders')
                .update({ 
                  status: newStatus,
                  coins: coinsAmount,
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
                amount: cashfreeData?.order_amount || parseFloat(amount || '0') || 0,
                coins: coinsAmount,
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
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          // Continue with the response, even if DB update failed
        }
        
        // Return the order status and details in the format requested
        if (newStatus === 'COMPLETED') {
          return NextResponse.json({
            success: true,
            message: "Payment verified successfully.",
            coinsAdded: coinsAmount,
            status: newStatus
          });
        } else if (newStatus === 'FAILED') {
          return NextResponse.json({
            success: false,
            message: "Payment verification failed. Your payment was not successful.",
            status: newStatus
          });
        } else {
          return NextResponse.json({
            success: false,
            message: "Payment is still being processed. Please check again in a few minutes.",
            status: newStatus
          });
        }
        
      } catch (error) {
        console.error(`[Attempt ${retryCount + 1}] Verification error:`, error);
        
        // Retry on unknown errors
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying due to error, attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
          // Add a small delay before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await attemptVerification();
        }
        
        return NextResponse.json({ 
          success: false, 
          message: "Payment verification failed. Please try again or contact support."
        }, { status: 400 });
      }
    }
    
    return attemptVerification();
  } catch (error) {
    console.error('Unhandled exception in payment verification:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Payment verification failed. Please try again or contact support."
    }, { status: 400 });
  }
}

// Helper function to add coins to user balance
async function addCoinsToUserBalance(supabase: SupabaseClient, userId: string, coinsAmount: number, orderId: string) {
  try {
    console.log(`Adding ${coinsAmount} coins to user ${userId} for order ${orderId}`);
    
    // First check if a transaction already exists for this order to prevent duplicates
    const { data: existingTransaction } = await supabase
      .from('coin_transactions')
      .select('id')
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .eq('transaction_type', 'recharge')
      .single();
      
    if (existingTransaction) {
      console.log(`Transaction already exists for order ${orderId}, skipping`);
      return;
    }
    
    // Begin a transaction to ensure atomicity
    const { data, error } = await supabase.rpc('add_coins_to_balance', {
      user_id_param: userId,
      coins_amount: coinsAmount,
      order_id_param: orderId,
      description_param: `Payment completed for order ${orderId}`
    });
    
    if (error) {
      console.error('Failed to add coins to user balance:', error);
      throw error;
    }
    
    console.log(`Successfully added ${coinsAmount} coins to user ${userId}`);
    return data;
  } catch (error) {
    console.error('Error adding coins to user balance:', error);
    throw error;
  }
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