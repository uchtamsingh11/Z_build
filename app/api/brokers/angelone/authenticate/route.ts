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

    // Ensure this is an AngelOne broker
    if (broker.broker_name !== 'Angel One') {
      return NextResponse.json(
        { error: 'Not an Angel One broker' },
        { status: 400 }
      );
    }

    // Extract required credentials
    const { 'API Key': apiKey, 'Client ID': clientId } = broker.credentials;
    
    if (!apiKey || !clientId) {
      return NextResponse.json(
        { error: 'Missing required Angel One credentials (API Key or Client ID)' },
        { status: 400 }
      );
    }

    // Generate session by calling Angel One login API
    try {
      // Make authentication request to Angel One API
      const response = await fetch('https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PrivateKey': apiKey,
        },
        body: JSON.stringify({
          clientcode: clientId,
        })
      });

      // If authentication fails
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = {
            message: 'Could not parse error response from Angel One API',
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
            endpoint: 'apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword'
          },
          { status: 401 }
        );
      }

      // Parse the response to get tokens
      const authData = await response.json();
      
      // Update the broker credentials with the tokens
      const credentials = {
        ...broker.credentials,
        'Access Token': authData.data?.jwtToken || '',
        'Feed Token': authData.data?.feedToken || '',
        'Refresh Token': authData.data?.refreshToken || '',
      };

      // Save the updated credentials
      const { error: updateCredError } = await supabase
        .from('broker_credentials')
        .update({ credentials })
        .eq('id', broker_id);

      if (updateCredError) {
        throw updateCredError;
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
        message: 'Angel One broker authenticated successfully'
      });
    } catch (apiError: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to authenticate with Angel One API', 
          details: apiError.message || 'Unknown error' 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to authenticate Angel One broker' },
      { status: 500 }
    );
  }
} 