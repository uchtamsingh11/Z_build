import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Get webhook payload
    const payload = await req.json();
    const { order } = payload;
    
    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');
    
    if (!signature || !timestamp || !verifySignature(payload, signature, timestamp)) {
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Check if order exists and is still pending
    const { data: orderData, error: orderError } = await supabase
      .from('coin_orders')
      .select('*')
      .eq('order_id', order.order_id)
      .single();
      
    if (orderError || !orderData) {
      console.error('Order not found:', order.order_id);
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }
    
    // If order is already processed, avoid duplicate processing
    if (orderData.status !== 'PENDING') {
      return NextResponse.json(
        { success: true, message: 'Order already processed' }
      );
    }
    
    // Process the payment based on the order status
    if (order.order_status === 'PAID') {
      // Transaction was successful
      
      // 1. Update the order status
      const { error: updateError } = await supabase
        .from('coin_orders')
        .update({ status: 'COMPLETED' })
        .eq('order_id', order.order_id);
        
      if (updateError) {
        console.error('Error updating order status:', updateError);
        return NextResponse.json(
          { success: false, message: 'Failed to update order status' },
          { status: 500 }
        );
      }
      
      // 2. Add coins to user account through a transaction
      const { error: transactionError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: orderData.user_id,
          amount: orderData.coins,
          transaction_type: 'purchase',
          description: `Purchased ${orderData.coins} coins`
        });
        
      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        return NextResponse.json(
          { success: false, message: 'Failed to create transaction' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully'
      });
    } else if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(order.order_status)) {
      // Update order status for failed payments
      await supabase
        .from('coin_orders')
        .update({ status: 'FAILED' })
        .eq('order_id', order.order_id);
        
      return NextResponse.json({
        success: true,
        message: 'Failed payment recorded'
      });
    }
    
    // For other statuses, just acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Webhook received'
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error processing webhook'
      },
      { status: 500 }
    );
  }
}

// Function to verify webhook signature using HMAC-SHA256
function verifySignature(payload: any, signature: string, timestamp: string): boolean {
  try {
    const secretKey = process.env.CASHFREE_SECRET_KEY!;
    const data = timestamp + payload.toString();
    const computedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('base64');
      
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
} 