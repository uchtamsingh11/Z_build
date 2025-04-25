import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { broker_id } = await request.json();
    
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

    // Ensure this is a Dhan broker
    if (broker.broker_name !== 'Dhan') {
      return NextResponse.json(
        { error: 'Not a Dhan broker' },
        { status: 400 }
      );
    }

    // Extract required credentials
    const { 'Client ID': clientId, 'Access Token': accessToken } = broker.credentials;
    
    if (!clientId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required Dhan credentials (Client ID or Access Token)' },
        { status: 400 }
      );
    }

    // Make authentication request to Dhan API
    try {
      // Try to authenticate with Dhan API using user profile endpoint
      const response = await fetch('https://api.dhan.co/v2/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'client-id': clientId,
          'access-token': accessToken
        }
      });

      // If authentication fails
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = {
            message: 'Could not parse error response from Dhan API',
            rawResponse: await response.text()
          };
        }

        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication failed', 
            details: errorData,
            status: response.status,
            statusText: response.statusText,
            endpoint: 'api.dhan.co/v2/profile'
          },
          { status: 401 }
        );
      }

      // Authentication succeeded, update broker status to active
      const { error: updateError } = await supabase
        .from('broker_credentials')
        .update({ is_active: true })
        .eq('id', broker_id);

      if (updateError) {
        throw updateError;
      }

      // Return success
      return NextResponse.json({
        success: true,
        message: 'Dhan broker authenticated successfully'
      });
    } catch (apiError: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to authenticate with Dhan API', 
          details: apiError.message || 'Unknown error' 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to authenticate Dhan broker' },
      { status: 500 }
    );
  }
} 