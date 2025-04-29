import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as fyersClient from '@/fyers_api_client';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Parse the request body
    const { 
      symbol,
      quantity,
      price,
      trigger_price,
      transaction_type,
      order_type,
      product_type
    } = await request.json();
    
    // Validate required fields
    if (!symbol || !quantity || !transaction_type || !order_type || !product_type) {
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

    // Find the active Fyers broker for this user
    const { data: broker, error: brokerError } = await supabase
      .from('broker_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker_name', 'Fyers')
      .eq('is_active', true)
      .single();

    if (brokerError || !broker) {
      return NextResponse.json(
        { error: 'No active Fyers broker found' },
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

    // Map transaction type to Fyers format
    const fyersTransactionType = transaction_type.toUpperCase() === 'BUY' ? '1' : '2';

    // Place the order based on the order type
    try {
      let orderResponse;
      
      switch (order_type.toUpperCase()) {
        case 'MARKET':
          orderResponse = await fyersClient.placeMarketOrder(
            accessToken,
            symbol,
            quantity,
            fyersTransactionType,
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
          
          orderResponse = await fyersClient.placeLimitOrder(
            accessToken,
            symbol,
            quantity,
            price,
            fyersTransactionType,
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
          
          orderResponse = await fyersClient.placeStopLossLimitOrder(
            accessToken,
            symbol,
            quantity,
            price,
            trigger_price,
            fyersTransactionType,
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
          
          orderResponse = await fyersClient.placeStopLossMarketOrder(
            accessToken,
            symbol,
            quantity,
            trigger_price,
            fyersTransactionType,
            product_type
          );
          break;
          
        default:
          return NextResponse.json(
            { error: `Unsupported order type: ${order_type}` },
            { status: 400 }
          );
      }
      
      // Check if the order was successful
      if (orderResponse && orderResponse.code === 200) {
        // Return the order response
        return NextResponse.json({
          success: true,
          order_id: orderResponse.data?.id || null,
          message: orderResponse.message || 'Order placed successfully',
          data: orderResponse.data
        });
      } else {
        // Order failed
        return NextResponse.json(
          { 
            success: false,
            error: orderResponse.message || 'Failed to place order',
            code: orderResponse.code
          },
          { status: 400 }
        );
      }
    } catch (apiError: any) {
      // Check if the error is due to an expired token
      const errorMessage = apiError.response?.data?.message || apiError.message;
      const errorCode = apiError.response?.data?.code;
      
      if (errorCode === 401 || /expired|invalid token|unauthorized/i.test(errorMessage)) {
        // Mark the broker as inactive due to token expiration
        const { error: updateError } = await supabase
          .from('broker_credentials')
          .update({ 
            is_active: false,
            access_token: null,
            credentials: {
              ...broker.credentials,
              'Access Token': null
            }
          })
          .eq('id', broker.id);
          
        if (updateError) {
          console.error('Error updating broker status:', updateError);
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: 'Token expired. Please re-authenticate your Fyers broker.',
            requires_reauth: true
          },
          { status: 401 }
        );
      }
      
      // Handle other API errors
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to place order with Fyers API',
          details: errorMessage || 'Unknown error',
          code: errorCode
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to place order'
      },
      { status: 500 }
    );
  }
} 