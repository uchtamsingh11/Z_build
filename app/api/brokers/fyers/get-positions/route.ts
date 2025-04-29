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

    // Get positions information
    try {
      const positionsResponse = await fyersClient.getPositions(accessToken);
      
      // Get holdings information as well
      const holdingsResponse = await fyersClient.getHoldings(accessToken);
      
      // Check if both requests were successful
      if (positionsResponse && positionsResponse.code === 200) {
        // Combine positions and holdings
        let allPositions = [];
        
        if (positionsResponse.data) {
          allPositions = positionsResponse.data;
        }
        
        // Add holdings data if available and successful
        if (holdingsResponse && holdingsResponse.code === 200 && holdingsResponse.data) {
          // Map holdings data to match the positions format if needed
          const holdingsData = holdingsResponse.data;
          
          // Return the combined data
          return NextResponse.json({
            success: true,
            positions: allPositions,
            holdings: holdingsData,
            message: 'Positions and holdings retrieved successfully'
          });
        }
        
        // Only positions data available
        return NextResponse.json({
          success: true,
          positions: allPositions,
          message: 'Positions retrieved successfully'
        });
      } else {
        // Request failed
        return NextResponse.json(
          { 
            success: false,
            error: positionsResponse?.message || 'Failed to retrieve positions',
            code: positionsResponse?.code
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
          error: 'Failed to retrieve positions from Fyers API',
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
        error: error.message || 'Failed to retrieve positions'
      },
      { status: 500 }
    );
  }
} 