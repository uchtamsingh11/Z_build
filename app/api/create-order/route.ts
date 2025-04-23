import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Cashfree } from 'cashfree-pg';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Extract request data
    const requestData = await req.json();
    const { userId, coinAmount, price, customerPhone, customerEmail } = requestData;

    if (!userId || !coinAmount || !price) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a unique order ID
    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Configure Cashfree
    // Using the correct API syntax for Cashfree v2
    const cashfreeEnv = process.env.CASHFREE_ENVIRONMENT === 'sandbox' ? 'TEST' : 'PROD';
    
    // Store order information in Supabase for later verification
    try {
      const { error: insertError } = await supabase
        .from('coin_orders')
        .insert({
          order_id: orderId,
          user_id: userId,
          amount: price,
          coins: coinAmount,
          status: 'PENDING',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error storing order:', insertError);
        return NextResponse.json(
          { success: false, message: 'Failed to create order: ' + insertError.message },
          { status: 500 }
        );
      }
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database error: ' + dbError.message },
        { status: 500 }
      );
    }

    // Get base URL for callback
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    // Set default values for missing phone and email
    // Cashfree requires a 10-digit phone number (as per their documentation)
    const defaultPhone = '9898989898'; // Compliant test phone number from Cashfree docs
    const defaultEmail = 'customer@example.com'; // Default email when missing

    // Configure order request
    const request = {
      order_id: orderId,
      order_amount: price,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_phone: customerPhone || defaultPhone, // Using valid Cashfree format
        customer_email: customerEmail || defaultEmail
      },
      order_meta: {
        return_url: `${baseUrl}/payment-status?order_id={order_id}&order_token={order_token}`,
        notify_url: `${baseUrl}/api/webhook` // Webhook URL
      }
    };

    console.log('Creating Cashfree order with request:', JSON.stringify(request));

    // Create an order with Cashfree
    try {
      // Using fetch directly to make the Cashfree API call
      const response = await fetch('https://api.cashfree.com/pg/orders', {
        method: 'POST',
        headers: {
          'x-api-version': '2022-09-01',
          'x-client-id': process.env.CASHFREE_APP_ID!,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      const responseData = await response.json();
      console.log('Cashfree response:', responseData);
      
      if (response.ok && responseData) {
        // Store the cashfree_order_id if available
        if (responseData.cf_order_id) {
          await supabase
            .from('coin_orders')
            .update({ 
              cashfree_order_id: responseData.cf_order_id,
              payment_session_id: responseData.payment_session_id
            })
            .eq('order_id', orderId);
        }
        
        return NextResponse.json({
          success: true,
          message: 'Order created successfully!',
          data: responseData
        });
      } else {
        // Update order status to FAILED in Supabase
        await supabase
          .from('coin_orders')
          .update({ status: 'FAILED' })
          .eq('order_id', orderId);

        return NextResponse.json(
          {
            success: false,
            message: 'Failed to create order with payment provider',
            details: responseData
          },
          { status: 500 }
        );
      }
    } catch (cashfreeError: any) {
      console.error('Cashfree API error:', cashfreeError);
      
      // Update order status to FAILED in Supabase
      await supabase
        .from('coin_orders')
        .update({ status: 'FAILED' })
        .eq('order_id', orderId);
        
      return NextResponse.json(
        {
          success: false,
          message: 'Cashfree API error: ' + (cashfreeError.message || 'Unknown error')
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in order creation:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error processing the request'
      },
      { status: 500 }
    );
  }
} 