import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

// Cashfree API constants
const CASHFREE_API_VERSION = '2023-08-01';
// Force production URL since we're using production credentials
const CASHFREE_BASE_URL = 'https://api.cashfree.com/pg';

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
    
    // Create order in Cashfree
    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: user.id,
        customer_email: user.email,
        customer_phone: '9999999999' // Default phone number as required by Cashfree
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/status?orderId={order_id}`,
      }
    };
    
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
    
    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', cashfreeData);
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }
    
    // Ensure the payment_link exists, or construct a web checkout URL
    if (!cashfreeData.payment_link) {
      console.warn('Payment link not found in Cashfree response, constructing fallback URL');
      if (cashfreeData.payment_session_id) {
        cashfreeData.payment_link = `https://payments.cashfree.com/order/#${cashfreeData.payment_session_id}`;
      } else {
        return NextResponse.json({ error: 'Invalid payment response from gateway' }, { status: 500 });
      }
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
    
    // Return the payment link
    return NextResponse.json({
      order_id: orderId,
      payment_link: cashfreeData.payment_link,
      payment_sessions: cashfreeData.payment_sessions
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 