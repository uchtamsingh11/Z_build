import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { broker_id, order_id, variety } = await request.json();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch the broker credentials for the user
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
    
    // Ensure this is an AngelOne broker and is active
    if (broker.broker_name !== 'Angel One' || !broker.is_active) {
      return NextResponse.json(
        { error: 'AngelOne broker not active or not found' },
        { status: 400 }
      );
    }
    
    // Extract the credentials
    const { credentials } = broker;
    const apiKey = credentials['API Key'];
    const accessToken = credentials['Access Token'];
    
    if (!apiKey || !accessToken) {
      return NextResponse.json(
        { error: 'Required credentials not found' },
        { status: 400 }
      );
    }
    
    // Format cancel order request according to AngelOne API requirements
    const cancelOrderRequest = {
      variety: variety || "NORMAL",
      orderid: order_id,
    };
    
    // Call AngelOne's Cancel Order API
    const orderResponse = await fetch('https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder', {
      method: 'POST',
      headers: {
        'X-PrivateKey': apiKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(cancelOrderRequest)
    });
    
    // Check the response status
    if (!orderResponse.ok) {
      let errorData;
      try {
        errorData = await orderResponse.json();
      } catch (e) {
        errorData = {
          message: 'Could not parse error response from AngelOne API',
          rawResponse: await orderResponse.text()
        };
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to cancel order', details: errorData },
        { status: orderResponse.status }
      );
    }
    
    // Parse the response
    const orderData = await orderResponse.json();
    
    // Return the result
    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: orderData.data
    });
    
  } catch (error: any) {
    console.error('AngelOne cancel order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order with AngelOne' },
      { status: 500 }
    );
  }
} 