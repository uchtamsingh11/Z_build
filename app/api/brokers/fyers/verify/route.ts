import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Environment variables (would normally be in .env)
const FYERS_API_URL = process.env.FYERS_API_URL || 'https://api-t1.fyers.in/api/v3';
const FYERS_TOKEN_URL = process.env.FYERS_TOKEN_URL || 'https://api.fyers.in/api/v2/token';

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
    
    // Extract API Key and Secret Key for possible token refresh
    const { 'App ID': clientId, 'Secret Key': secretKey } = broker.credentials;
    
    // Make a request to Fyers API to check if the token is valid
    try {
      const profileResponse = await fetch(`${FYERS_API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      // If the request succeeds, the token is valid
      if (profileResponse.ok) {
        // Mark the broker as active
        const { error: updateError } = await supabase
          .from('broker_credentials')
          .update({ is_active: true })
          .eq('id', broker_id);

        if (updateError) {
          throw updateError;
        }
        
        return NextResponse.json({
          success: true,
          message: 'Fyers broker verified successfully'
        });
      }
      
      // If we get here, the token is invalid or expired
      const errorData = await profileResponse.json();
      
      // If token is expired and we have refresh token, try to refresh it
      if (profileResponse.status === 401 && broker.credentials['Refresh Token']) {
        // Try to refresh the token
        const refreshResponse = await fetch(FYERS_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: broker.credentials['Refresh Token'],
            client_id: clientId,
            client_secret: secretKey,
          }),
        });
        
        if (refreshResponse.ok) {
          // Token refresh successful
          const refreshData = await refreshResponse.json();
          
          // Update the credentials with new tokens
          const updatedCredentials = {
            ...broker.credentials,
            'Access Token': refreshData.access_token,
            'Refresh Token': refreshData.refresh_token || broker.credentials['Refresh Token'],
            'Expires In': refreshData.expires_in || 86400,
          };
          
          // Calculate expiry timestamp (current time + expires_in seconds)
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + (refreshData.expires_in || 86400));
          
          // Save the updated credentials
          const { error: updateError } = await supabase
            .from('broker_credentials')
            .update({ 
              credentials: updatedCredentials,
              access_token: refreshData.access_token,
              token_expiry: expiresAt.toISOString()
            })
            .eq('id', broker_id);

          if (updateError) {
            throw updateError;
          }
          
          // Try the profile request again with the new token
          const newProfileResponse = await fetch(`${FYERS_API_URL}/profile`, {
            headers: {
              'Authorization': `Bearer ${refreshData.access_token}`,
            },
          });

          if (!newProfileResponse.ok) {
            // Still failing, return error
            return NextResponse.json(
              { error: 'Failed to authenticate with Fyers API after token refresh' },
              { status: 401 }
            );
          }
        } else {
          // No refresh token available
          return NextResponse.json(
            { error: 'Access token expired and no refresh token available' },
            { status: 401 }
          );
        }
      } else {
        // Other API error
        return NextResponse.json(
          { error: `Fyers API error: ${errorData.message || 'Unknown error'}` },
          { status: 500 }
        );
      }

      // Verification successful
      return NextResponse.json({
        success: true,
        message: 'Fyers broker verified successfully'
      });
    } catch (apiError: any) {
      return NextResponse.json(
        { 
          error: 'Failed to verify Fyers token',
          details: apiError.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to verify Fyers credentials' },
      { status: 500 }
    );
  }
} 