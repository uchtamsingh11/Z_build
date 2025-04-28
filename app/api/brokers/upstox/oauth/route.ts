import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This endpoint initiates the OAuth flow by redirecting to Upstox login
export async function GET(request: Request) {
  try {
    // Get client ID from environment variables
    const clientId = process.env.UPSTOX_CLIENT_ID;
    if (!clientId) {
      throw new Error('Missing Upstox client ID in environment variables');
    }

    // Get the URL from the request
    const url = new URL(request.url);
    
    // The redirect URI should be the callback endpoint in your application
    const redirectUri = `${url.origin}/api/brokers/upstox/callback`;
    
    // Create state parameter to verify the callback
    const state = crypto.randomUUID();
    
    // Store state in cookies for validation during callback
    const cookieStore = await cookies();
    cookieStore.set('upstox_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
    
    // Construct the authorization URL
    const authUrl = new URL('https://api.upstox.com/v2/login/authorization/dialog');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);
    
    // Redirect to the Upstox authorization URL
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Upstox OAuth error:', error);
    // Redirect to an error page
    return NextResponse.redirect('/broker-auth?error=' + encodeURIComponent(error.message || 'Failed to initiate Upstox OAuth'));
  }
} 