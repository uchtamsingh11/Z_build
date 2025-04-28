import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Environment variables (would normally be in .env)
const UPSTOX_API_URL = process.env.UPSTOX_API_URL || 'https://api.upstox.com/v2';
const UPSTOX_TOKEN_URL = process.env.UPSTOX_TOKEN_URL || 'https://api.upstox.com/v2/login/authorization/token';

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
    const { 'API Key': apiKey, 'Secret Key': secretKey } = broker.credentials;

    // Verify the token by making a request to the Upstox API
    try {
      // For example, fetching the user profile
      const profileResponse = await fetch(`${UPSTOX_API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        // Check if the token has expired
        const errorData = await profileResponse.json();
        
        if (errorData.error === 'invalid_token' || errorData.error === 'unauthorized') {
          // Token has expired, try to refresh it
          const { 'Refresh Token': refreshToken } = broker.credentials;
          
          if (refreshToken) {
            // Attempt to refresh the token
            const refreshResponse = await fetch(UPSTOX_TOKEN_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: apiKey,
                client_secret: secretKey,
              }).toString(),
            });

            if (!refreshResponse.ok) {
              // Token refresh failed, return error
              return NextResponse.json(
                { error: 'Failed to refresh token' },
                { status: 401 }
              );
            }

            // Parse the refresh response
            const refreshData = await refreshResponse.json();
            
            // Update the broker credentials with the new tokens
            const updatedCredentials = {
              ...broker.credentials,
              'Access Token': refreshData.access_token,
              'Refresh Token': refreshData.refresh_token,
              'Token Type': refreshData.token_type,
              'Expires In': refreshData.expires_in,
            };
            
            // Save the updated credentials
            const { error: updateError } = await supabase
              .from('broker_credentials')
              .update({ credentials: updatedCredentials })
              .eq('id', broker_id);

            if (updateError) {
              throw updateError;
            }
            
            // Try the profile request again with the new token
            const newProfileResponse = await fetch(`${UPSTOX_API_URL}/user/profile`, {
              headers: {
                'Authorization': `Bearer ${refreshData.access_token}`,
              },
            });

            if (!newProfileResponse.ok) {
              // Still failing, return error
              return NextResponse.json(
                { error: 'Failed to authenticate with Upstox API after token refresh' },
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
            { error: `Upstox API error: ${errorData.error || 'Unknown error'}` },
            { status: 500 }
          );
        }
      }

      // Verification successful
      return NextResponse.json({
        success: true,
        message: 'Upstox broker verified successfully'
      });
    } catch (apiError: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to verify with Upstox API', 
          details: apiError.message || 'Unknown error' 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to verify Upstox broker' },
      { status: 500 }
    );
  }
} 