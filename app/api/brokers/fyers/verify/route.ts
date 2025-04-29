import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as fyersClient from '@/fyers_api_client';

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

    // Extract the access token
    const { 'Access Token': accessToken } = broker.credentials;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 400 }
      );
    }

    // Verify the token by making a request to the Fyers API
    try {
      // Fetching the user profile to verify the token
      const profileResponse = await fyersClient.getUserProfile(accessToken);
      
      // If we get here, the token is valid
      if (profileResponse && profileResponse.code === 200) {
        return NextResponse.json({
          success: true,
          message: 'Fyers broker verified successfully'
        });
      } else {
        // Token validation failed for some reason
        return NextResponse.json(
          { 
            success: false, 
            error: profileResponse.message || 'Failed to validate token',
            code: profileResponse.code
          },
          { status: 401 }
        );
      }
    } catch (apiError: any) {
      // Likely an expired token or API error
      // Note: Fyers doesn't provide refresh tokens in the standard OAuth flow
      // So we need to re-authenticate the user via the frontend
      
      // Check if the token is expired based on the API error
      const errorMessage = apiError.response?.data?.message || apiError.message;
      const errorCode = apiError.response?.data?.code;
      
      if (errorCode === 401 || /expired|invalid token|unauthorized/i.test(errorMessage)) {
        // Token is expired, mark the broker as inactive
        const { error: updateError } = await supabase
          .from('broker_credentials')
          .update({ 
            is_active: false,
            access_token: null,
            credentials: {
              ...broker.credentials,
              'Access Token': null,
            }
          })
          .eq('id', broker_id);
          
        if (updateError) {
          console.error('Error updating broker status:', updateError);
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Token expired. Please re-authenticate.',
            code: 401,
            requires_reauth: true
          },
          { status: 401 }
        );
      }
      
      // Other API error
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to verify with Fyers API', 
          details: errorMessage || 'Unknown error',
          code: errorCode
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to verify Fyers broker' },
      { status: 500 }
    );
  }
} 