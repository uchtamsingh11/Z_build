import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the URL and params from the request
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    // Check if there's an error
    if (error) {
      throw new Error(`Upstox OAuth error: ${error}`);
    }
    
    // Check if code and state are present
    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }
    
    // Validate state parameter with the one stored in cookies
    const cookieStore = cookies();
    const storedState = cookieStore.get('upstox_oauth_state')?.value;
    
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter');
    }
    
    // Clean up the state cookie
    cookieStore.delete('upstox_oauth_state');
    
    // Exchange the authorization code for an access token
    const clientId = process.env.UPSTOX_CLIENT_ID;
    const clientSecret = process.env.UPSTOX_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Missing Upstox client credentials');
    }
    
    const tokenUrl = 'https://api.upstox.com/v2/login/authorization/token';
    const redirectUri = `${url.origin}/api/brokers/upstox/callback`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Failed to exchange code for token: ${JSON.stringify(errorData)}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.redirect('/auth/signin?error=authentication_required');
    }
    
    // Verify the token by calling Upstox's user profile API
    const profileResponse = await fetch('https://api.upstox.com/v2/user/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!profileResponse.ok) {
      throw new Error('Failed to verify the access token');
    }
    
    const profileData = await profileResponse.json();
    
    // Check if the broker is already saved
    const { data: existingBroker, error: queryError } = await supabase
      .from('broker_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker_name', 'Upstox')
      .maybeSingle();
    
    if (queryError) {
      throw queryError;
    }
    
    // Prepare broker credential object
    const credentials = {
      'Access Token': accessToken,
      ...tokenData.refresh_token ? { 'Refresh Token': tokenData.refresh_token } : {},
      ...tokenData.expires_in ? { 'Expires In': tokenData.expires_in } : {},
    };
    
    if (existingBroker) {
      // Update existing broker
      const { error: updateError } = await supabase
        .from('broker_credentials')
        .update({
          credentials,
          is_active: true,
        })
        .eq('id', existingBroker.id);
      
      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new broker
      const { error: insertError } = await supabase
        .from('broker_credentials')
        .insert({
          user_id: user.id,
          broker_name: 'Upstox',
          credentials,
          is_active: true,
        });
      
      if (insertError) {
        throw insertError;
      }
    }
    
    // Redirect to broker auth page with success message
    return NextResponse.redirect('/broker-auth?success=upstox_connected');
  } catch (error: any) {
    console.error('Upstox callback error:', error);
    // Redirect to broker auth page with error message
    return NextResponse.redirect('/broker-auth?error=' + encodeURIComponent(error.message || 'Failed to connect Upstox'));
  }
} 