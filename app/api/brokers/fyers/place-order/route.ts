import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Environment variables (would normally be in .env)
const FYERS_API_URL = process.env.FYERS_API_URL || 'https://api-t1.fyers.in/api/v3';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { 
      broker_id, 
      symbol, 
      quantity, 
      price, 
      transactionType, 
      productType,
      orderType,
      triggerPrice = 0
    } = await request.json();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if broker exists and belongs to the user
    const { data: broker, error: brokerError } = await supabase
      .from('broker_credentials')
      .select('*')
      .eq('id', broker_id)
      .eq('user_id', user.id)
      .single();

    if (brokerError || !broker) {
      return NextResponse.json(
        { error: 'Broker not found' },
        { status: 404 }
      );
    }

    // Ensure this is a Fyers broker
    if (broker.broker_name !== 'Fyers') {
      return NextResponse.json(
        { error: 'Not a Fyers broker' },
        { status: 400 }
      );
    }

    // Extract the access token
    const accessToken = broker.access_token || broker.credentials['Access Token'];
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 400 }
      );
    }

    // Validate required parameters
    if (!symbol || !quantity || !transactionType || !productType || !orderType) {
      return NextResponse.json(
        { error: 'Missing required order parameters' },
        { status: 400 }
      );
    }

    // Prepare order data based on order type
    const orderData: any = {
      symbol: symbol,
      qty: parseInt(quantity),
      type: productType,
      side: transactionType,
      order_type: orderType,
      validity: "DAY",
      disc_qty: 0,
      offline_order: false
    };

    // Add price for LIMIT orders
    if (orderType === 'LIMIT' && price) {
      orderData.price = parseFloat(price);
    }

    // Add trigger price for SL or SL-M orders
    if ((orderType === 'SL' || orderType === 'SL-M') && triggerPrice) {
      orderData.stop_price = parseFloat(triggerPrice);
      
      // SL orders also need a limit price
      if (orderType === 'SL' && price) {
        orderData.price = parseFloat(price);
      }
    }

    // Place the order with Fyers API
    const orderResponse = await fetch(`${FYERS_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      // Check if it's a token-related error
      if (orderResponse.status === 401 || orderResponse.status === 403) {
        // Token might be expired or invalid
        await supabase
          .from('broker_credentials')
          .update({ is_active: false })
          .eq('id', broker_id);
          
        return NextResponse.json(
          { error: 'Authentication failed with Fyers API. Please reactivate your broker.' },
          { status: 401 }
        );
      }
      
      // Other API error
      const errorData = await orderResponse.json();
      return NextResponse.json(
        { error: `Fyers API error: ${errorData.message || 'Unknown error'}` },
        { status: orderResponse.status || 500 }
      );
    }

    // Parse the order response
    const orderResponseData = await orderResponse.json();
    
    // Return the order response
    return NextResponse.json({
      success: true,
      data: orderResponseData
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to place order with Fyers' },
      { status: 500 }
    );
  }
} 