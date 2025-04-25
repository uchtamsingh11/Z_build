import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

// Cashfree API constants
const CASHFREE_API_VERSION = '2023-08-01';
// Determine environment
const isSandbox = process.env.NODE_ENV !== 'production';
const CASHFREE_BASE_URL = isSandbox 
  ? 'https://sandbox.cashfree.com/pg'
  : 'https://api.cashfree.com/pg';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Get the request data
    const requestData = await request.json();
    const { amount, coins, currency = 'INR' } = requestData;
    
    if (!amount || !coins || amount <= 0 || coins <= 0) {
      return NextResponse.json({ error: 'Valid amount and coins are required' }, { status: 400 });
    }
    
    // Create a unique order ID
    const orderId = `order_${randomUUID()}`;
    
    // The absolute URL for return
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
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
        return_url: `${appUrl}/payment/status?order_id={order_id}`,
        notify_url: `${appUrl}/api/payment/webhook`
      },
      order_note: `Purchase of ${coins} coins`
    };
    
    console.log('Sending order payload to Cashfree:', JSON.stringify(orderPayload, null, 2));
    console.log('Using Cashfree URL:', CASHFREE_BASE_URL, 'Environment:', isSandbox ? 'Sandbox' : 'Production');
    
    const cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': process.env.CASHFREE_APP_ID!,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!
      },
      body: JSON.stringify(orderPayload)
    });
    
    const cashfreeData = await cashfreeResponse.json();
    
    // Log the complete response for debugging
    console.log('Cashfree API response:', JSON.stringify(cashfreeData, null, 2));
    console.log('Cashfree API credentials used:', {
      appId: process.env.CASHFREE_APP_ID?.substring(0, 5) + '...',
      secretKeyLength: process.env.CASHFREE_SECRET_KEY?.length
    });
    
    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', cashfreeData);
      return NextResponse.json({ 
        error: cashfreeData.message || 'Failed to create payment order',
        details: cashfreeData,
        environment: isSandbox ? 'sandbox' : 'production'
      }, { status: 500 });
    }
    
    // Store the order in our database
    const { error: insertError } = await supabase
      .from('coin_orders')
      .insert({
        user_id: user.id,
        order_id: orderId,
        amount: amount,
        coins: coins,
        status: 'PENDING',
      });
    
    if (insertError) {
      console.error('DB error:', insertError);
      return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 });
    }
    
    // Return the exact response format expected by the client
    return NextResponse.json({
      order_id: orderId,
      payment_session_id: cashfreeData.payment_session_id,
      payment_link: cashfreeData.payment_link
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 