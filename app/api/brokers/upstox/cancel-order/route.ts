import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as upstoxClient from '@/upstox_api_client';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Parse the request body
    const { order_id } = await request.json();
    
    // Validate required fields
    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing order_id parameter' },
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

    // Cancel the order
    try {
      const cancelResponse = await upstoxClient.cancelOrder(
        accessToken,
        order_id
      );
      
      // Return the cancel response
      return NextResponse.json(cancelResponse);
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
          error: 'Failed to cancel order with Upstox API',
          details: apiError.response?.data || apiError.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
} 