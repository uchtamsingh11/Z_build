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
    
    // Call AngelOne's get funds API
    const fundsResponse = await fetch('https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS', {
      method: 'GET',
      headers: {
        'X-PrivateKey': apiKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Check the response status
    if (!fundsResponse.ok) {
      let errorData;
      try {
        errorData = await fundsResponse.json();
      } catch (e) {
        errorData = {
          message: 'Could not parse error response from AngelOne API',
          rawResponse: await fundsResponse.text()
        };
      }
      
      // Token might be expired, let's try to refresh and retry
      if (fundsResponse.status === 401 && credentials['Refresh Token']) {
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
              .update({ credentials: updatedCredentials })
              .eq('id', broker_id)
              .eq('user_id', user.id);
            
            if (updateError) {
              throw updateError;
            }
            
            // Retry with the new token
            const retryResponse = await fetch('https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS', {
              method: 'GET',
              headers: {
                'X-PrivateKey': apiKey,
                'Authorization': `Bearer ${updatedCredentials['Access Token']}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
            
            if (!retryResponse.ok) {
              return NextResponse.json(
                { success: false, error: 'Failed to get funds after token refresh', details: await retryResponse.json() },
                { status: retryResponse.status }
              );
            }
            
            // Parse and return the retry response
            const fundsData = await retryResponse.json();
            
            return NextResponse.json({
              success: true,
              data: fundsData.data
            });
          }
        } catch (refreshError: any) {
          return NextResponse.json(
            { error: 'Failed to refresh token: ' + refreshError.message },
            { status: 401 }
          );
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to get funds', details: errorData },
        { status: fundsResponse.status }
      );
    }
    
    // Parse the response
    const fundsData = await fundsResponse.json();
    
    // Return the funds data
    return NextResponse.json({
      success: true,
      data: fundsData.data
    });
    
  } catch (error: any) {
    console.error('AngelOne get funds error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get funds from AngelOne' },
      { status: 500 }
    );
  }
} 