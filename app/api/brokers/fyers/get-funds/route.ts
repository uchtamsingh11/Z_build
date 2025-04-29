import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as fyersClient from '@/fyers_api_client';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
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

    // Get funds information
    try {
      const fundsResponse = await fyersClient.getFundDetails(accessToken);
      
      // Check if the request was successful
      if (fundsResponse && fundsResponse.code === 200) {
        // Return the funds data
        return NextResponse.json({
          success: true,
          funds: fundsResponse.data || {},
          message: fundsResponse.message || 'Funds retrieved successfully'
        });
      } else {
        // Request failed
        return NextResponse.json(
          { 
            success: false,
            error: fundsResponse.message || 'Failed to retrieve funds',
            code: fundsResponse.code
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
          error: 'Failed to retrieve funds from Fyers API',
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
        error: error.message || 'Failed to retrieve funds'
      },
      { status: 500 }
    );
  }
} 