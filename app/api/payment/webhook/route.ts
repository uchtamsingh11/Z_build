import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the webhook payload
    const payload = await request.json();
    
    // Get the cashfree signature from headers
    const cashfreeSignature = request.headers.get('x-webhook-signature');
    
    if (!cashfreeSignature) {
      console.error('Missing Cashfree signature');
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    // Verify the signature
    const isValid = verifySignature(
      JSON.stringify(payload),
      cashfreeSignature,
      process.env.CASHFREE_WEBHOOK_SECRET || ''
    );
    
    if (!isValid) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    // Extract order information from the payload
    const { orderId, orderStatus, orderAmount } = payload.data || {};
    
    if (!orderId) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }
    
    console.log('Webhook received for order:', orderId, 'Status:', orderStatus);
    
    // Fetch the order from our database
    const { data: orderData, error: orderError } = await supabase
      .from('payment_orders')
      .select('user_id, status')
      .eq('order_id', orderId)
      .single();
    
    if (orderError) {
      console.error('Order not found:', orderId);
      // If order is not found, create it
      const { error: insertError } = await supabase
        .from('payment_orders')
        .insert({
          order_id: orderId,
          amount: orderAmount || 1,
          status: orderStatus === 'PAID' ? 'COMPLETED' : 
                  (orderStatus === 'FAILED' || orderStatus === 'CANCELLED') ? 'FAILED' : 'PENDING',
          // We don't have user_id in webhook, will be updated later
        });
        
      if (insertError) {
        console.error('Failed to create order:', insertError);
      }
      
      return NextResponse.json({ message: 'Webhook processed' });
    }
    
    // Check if the order is already processed
    if (orderData.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Order already processed' });
    }
    
    // Update the order status in our database
    if (orderStatus === 'PAID') {
      // Update order status to COMPLETED
      const { error: updateError } = await supabase
        .from('payment_orders')
        .update({ status: 'COMPLETED' })
        .eq('order_id', orderId);
      
      if (updateError) {
        console.error('Failed to update order status:', updateError);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
      }
      
      return NextResponse.json({ message: 'Payment processed successfully' });
    } else if (orderStatus === 'FAILED' || orderStatus === 'CANCELLED') {
      // Update order status to FAILED
      const { error: updateError } = await supabase
        .from('payment_orders')
        .update({ status: 'FAILED' })
        .eq('order_id', orderId);
      
      if (updateError) {
        console.error('Failed to update order status:', updateError);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
      }
      
      return NextResponse.json({ message: 'Payment failed or cancelled' });
    }
    
    // For other statuses, just acknowledge receipt
    return NextResponse.json({ message: 'Webhook received' });
    
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Function to verify the Cashfree webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
} 