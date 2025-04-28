import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as upstoxClient from '@/upstox_api_client';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Parse the request body
    const { 
      instrumentKey,
      quantity,
      price,
      trigger_price,
      transaction_type,
      order_type,
      product_type
    } = await request.json();
    
    // Validate required fields
    if (!instrumentKey || !quantity || !transaction_type || !order_type || !product_type) {
      return NextResponse.json(
        { error: 'Missing required order parameters' },
        { status: 400 }
      );
    }
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the active Upstox broker for this user
    const { data: broker, error: brokerError } = await supabase
      .from('broker_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker_name', 'Upstox')
      .eq('is_active', true)
      .single();

    if (brokerError || !broker) {
      return NextResponse.json(
        { error: 'No active Upstox broker found' },
        { status: 404 }
      );
    }

    // Extract the access token
    const { 'Access Token': accessToken } = broker.credentials;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 400 }
      );
    }

    // Place the order based on the order type
    try {
      let orderResponse;
      
      switch (order_type.toUpperCase()) {
        case 'MARKET':
          orderResponse = await upstoxClient.placeMarketOrder(
            accessToken,
            instrumentKey,
            quantity,
            transaction_type,
            product_type
          );
          break;
          
        case 'LIMIT':
          if (!price) {
            return NextResponse.json(
              { error: 'Price is required for LIMIT orders' },
              { status: 400 }
            );
          }
          
          orderResponse = await upstoxClient.placeLimitOrder(
            accessToken,
            instrumentKey,
            quantity,
            price,
            transaction_type,
            product_type
          );
          break;
          
        case 'SL':
          if (!price || !trigger_price) {
            return NextResponse.json(
              { error: 'Price and trigger_price are required for SL orders' },
              { status: 400 }
            );
          }
          
          orderResponse = await upstoxClient.placeStopLossLimitOrder(
            accessToken,
            instrumentKey,
            quantity,
            price,
            trigger_price,
            transaction_type,
            product_type
          );
          break;
          
        case 'SL-M':
          if (!trigger_price) {
            return NextResponse.json(
              { error: 'Trigger price is required for SL-M orders' },
              { status: 400 }
            );
          }
          
          orderResponse = await upstoxClient.placeStopLossMarketOrder(
            accessToken,
            instrumentKey,
            quantity,
            trigger_price,
            transaction_type,
            product_type
          );
          break;
          
        default:
          return NextResponse.json(
            { error: `Unsupported order type: ${order_type}` },
            { status: 400 }
          );
      }
      
      // Return the order response
      return NextResponse.json(orderResponse);
    } catch (apiError: any) {
      // Check if the error is due to an expired token
      if (apiError.response && (apiError.response.status === 401 || apiError.response.data?.error === 'invalid_token')) {
        return NextResponse.json(
          { error: 'Token expired. Please reactivate your Upstox broker.' },
          { status: 401 }
        );
      }
      
      // Handle other API errors
      return NextResponse.json(
        { 
          error: 'Failed to place order with Upstox API',
          details: apiError.response?.data || apiError.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to place order' },
      { status: 500 }
    );
  }
} 