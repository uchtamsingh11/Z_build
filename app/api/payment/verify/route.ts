import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cashfree API constants
const CASHFREE_API_VERSION = '2023-08-01';
// Force production URL since we're using production credentials
const CASHFREE_BASE_URL = 'https://api.cashfree.com/pg';

export async function GET(request: Request) {
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
    
    // Get the order from our database first
    const { data: orderData, error: orderError } = await supabase
      .from('coin_orders')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single();
    
    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // If the order is already completed or failed, return the status
    if (orderData.status === 'COMPLETED' || orderData.status === 'FAILED') {
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
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!
      }
    });
    
    const cashfreeData = await cashfreeResponse.json();
    
    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', cashfreeData);
      return NextResponse.json({ error: 'Failed to verify payment status' }, { status: 500 });
    }
    
    // Map Cashfree order status to our status
    let newStatus = orderData.status;
    if (cashfreeData.order_status === 'PAID') {
      newStatus = 'COMPLETED';
    } else if (cashfreeData.order_status === 'EXPIRED' || cashfreeData.order_status === 'CANCELLED') {
      newStatus = 'FAILED';
    }
    
    // Update the order status if it changed
    if (newStatus !== orderData.status) {
      const { error: updateError } = await supabase
        .from('coin_orders')
        .update({ status: newStatus })
        .eq('order_id', orderId)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Failed to update order status:', updateError);
        return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
      }
      
      // If the payment was successful, add the coins to user's balance
      if (newStatus === 'COMPLETED') {
        const { error: transactionError } = await supabase
          .from('coin_transactions')
          .insert({
            user_id: user.id,
            amount: orderData.coins,
            transaction_type: 'recharge',
            description: `Payment completed for order ${orderId}`
          });
        
        if (transactionError) {
          console.error('Failed to create transaction:', transactionError);
          return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }
      }
    }
    
    // Return the order status and details
    return NextResponse.json({
      status: newStatus,
      order: {
        ...orderData,
        status: newStatus
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 