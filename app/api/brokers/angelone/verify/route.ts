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
    
    // Extract the access token from the credentials
    const { credentials } = broker;
    const apiKey = credentials['API Key'];
    const accessToken = credentials['Access Token'];
    
    if (!apiKey || !accessToken) {
      return NextResponse.json(
        { error: 'Required credentials not found' },
        { status: 400 }
      );
    }
    
    // Call AngelOne's Get Profile API to verify the token
    const profileResponse = await fetch('https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile', {
      method: 'GET',
      headers: {
        'X-PrivateKey': apiKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Check if the profile was fetched successfully
    if (!profileResponse.ok) {
      // Token expired, try to generate a new token if we have refresh token
      if (profileResponse.status === 401 && credentials['Refresh Token']) {
        try {
          // Call token refresh endpoint
          const refreshResponse = await fetch('https://apiconnect.angelone.in/rest/auth/angelbroking/jwt/v1/generateTokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-PrivateKey': apiKey,
            },
            body: JSON.stringify({
              refreshToken: credentials['Refresh Token']
            })
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            
            // Update the credentials with new tokens
            const updatedCredentials = {
              ...credentials,
              'Access Token': refreshData.data?.jwtToken || credentials['Access Token'],
              'Refresh Token': refreshData.data?.refreshToken || credentials['Refresh Token'],
              'Feed Token': refreshData.data?.feedToken || credentials['Feed Token']
            };
            
            // Save the updated credentials
            const { error: updateError } = await supabase
              .from('broker_credentials')
              .update({ 
                credentials: updatedCredentials,
                is_active: true 
              })
              .eq('id', broker_id)
              .eq('user_id', user.id);
            
            if (updateError) {
              throw updateError;
            }
            
            return NextResponse.json({ 
              success: true, 
              message: 'AngelOne tokens refreshed and verified successfully'
            });
          } else {
            // If refresh fails too, return error
            return NextResponse.json(
              { error: 'Failed to refresh token. Please re-authenticate.' },
              { status: 401 }
            );
          }
        } catch (refreshError: any) {
          return NextResponse.json(
            { error: 'Failed to refresh token: ' + refreshError.message },
            { status: 401 }
          );
        }
      }
      
      // If token refresh not attempted or failed
      return NextResponse.json(
        { error: 'Token verification failed. Please re-authenticate.' },
        { status: 401 }
      );
    }
    
    // Profile was fetched successfully, update the broker's active status
    const { error: updateError } = await supabase
      .from('broker_credentials')
      .update({ is_active: true })
      .eq('id', broker_id)
      .eq('user_id', user.id);
    
    if (updateError) {
      throw updateError;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'AngelOne authentication success'
    });
    
  } catch (error: any) {
    console.error('AngelOne verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify AngelOne token' },
      { status: 500 }
    );
  }
} 