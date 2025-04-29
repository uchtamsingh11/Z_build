import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Environment variables (would normally be in .env)
const FYERS_API_URL = process.env.FYERS_API_URL || 'https://api-t1.fyers.in/api/v3';
const FYERS_TOKEN_URL = process.env.FYERS_TOKEN_URL || 'https://api.fyers.in/api/v2/token';
const FYERS_REDIRECT_URI = process.env.FYERS_REDIRECT_URI || 'https://www.algoz.tech/api/brokers/fyers/callback';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    // If there's an error, close the window with an error message
    if (error) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fyers Authentication Failed</title>
          <script>
            window.opener.postMessage({
              type: 'FYERS_AUTH_FAILURE',
              error: '${errorDescription || error}'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>${errorDescription || error}</p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Check if code and state are present
    if (!code || !state) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fyers Authentication Failed</title>
          <script>
            window.opener.postMessage({
              type: 'FYERS_AUTH_FAILURE',
              error: 'Missing code or state parameter'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>Missing code or state parameter.</p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Get the supabase client
    const supabase = await createClient();
    
    // Find the broker with the matching state
    const { data: broker, error: brokerError } = await supabase
      .from('broker_credentials')
      .select('*')
      .eq('auth_state', state)
      .eq('is_pending_auth', true)
      .single();
    
    if (brokerError || !broker) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fyers Authentication Failed</title>
          <script>
            window.opener.postMessage({
              type: 'FYERS_AUTH_FAILURE',
              error: 'Invalid state parameter'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>Invalid state parameter. Please try again.</p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Extract required credentials
    const { 'App ID': clientId, 'Secret Key': secretKey } = broker.credentials;
    
    if (!clientId || !secretKey) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fyers Authentication Failed</title>
          <script>
            window.opener.postMessage({
              type: 'FYERS_AUTH_FAILURE',
              error: 'Missing required credentials'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>Missing required credentials. Please add your App ID and Secret Key.</p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(FYERS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: secretKey,
        redirect_uri: FYERS_REDIRECT_URI,
      }),
    });
    
    if (!tokenResponse.ok) {
      let errorMessage = 'Failed to exchange code for token';
      try {
        const errorData = await tokenResponse.json();
        errorMessage = errorData.message || errorData.error_description || errorData.error || errorMessage;
      } catch (e) {
        // Ignore parse errors
      }
      
      // Clear the pending auth state
      await supabase
        .from('broker_credentials')
        .update({
          is_pending_auth: false,
          auth_state: null,
        })
        .eq('id', broker.id);
      
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fyers Authentication Failed</title>
          <script>
            window.opener.postMessage({
              type: 'FYERS_AUTH_FAILURE',
              error: '${errorMessage}'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>${errorMessage}</p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Parse the token response
    const tokenData = await tokenResponse.json();
    
    // Log token data for debugging (remove in production)
    console.log('Token received:', tokenData.access_token ? 'Token received successfully' : 'No token received');
    
    // Update the broker credentials with the tokens
    const updatedCredentials = {
      ...broker.credentials,
      'Access Token': tokenData.access_token,
      'Refresh Token': tokenData.refresh_token || null,
      'Token Type': tokenData.token_type || 'Bearer',
      'Expires In': tokenData.expires_in || 86400, // Default to 24 hours if not provided
    };
    
    // Calculate expiry timestamp (current time + expires_in seconds)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 86400));
    
    // Save the updated credentials and mark the broker as active
    const { error: updateError } = await supabase
      .from('broker_credentials')
      .update({
        credentials: updatedCredentials,
        access_token: tokenData.access_token, // Store in dedicated column
        token_expiry: expiresAt.toISOString(),
        is_active: true,
        is_pending_auth: false,
        auth_state: null,
      })
      .eq('id', broker.id);
      
    // Log any update errors
    if (updateError) {
      console.error('Error updating broker credentials:', updateError);
      
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fyers Authentication Failed</title>
          <script>
            window.opener.postMessage({
              type: 'FYERS_AUTH_FAILURE',
              error: 'Failed to save authentication tokens'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>Failed to save authentication tokens. Error: ${updateError.message || 'Unknown error'}</p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Verify the token was saved properly
    const { data: verifyBroker, error: verifyError } = await supabase
      .from('broker_credentials')
      .select('credentials, access_token')
      .eq('id', broker.id)
      .single();
      
    console.log('Verification check:', {
      hasTokenInCredentials: verifyBroker?.credentials?.['Access Token'] ? 'Yes' : 'No',
      hasTokenInColumn: verifyBroker?.access_token ? 'Yes' : 'No',
    });
    
    // Return a success page that closes itself and notifies the parent window
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fyers Authentication Successful</title>
        <script>
          window.opener.postMessage({
            type: 'FYERS_AUTH_SUCCESS'
          }, window.location.origin);
          window.close();
        </script>
      </head>
      <body>
        <h1>Authentication Successful</h1>
        <p>You have successfully authenticated with Fyers. You can close this window now.</p>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error: any) {
    console.error('Callback error:', error);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fyers Authentication Failed</title>
        <script>
          window.opener.postMessage({
            type: 'FYERS_AUTH_FAILURE',
            error: 'Server error: ${error.message || 'Unknown error'}'
          }, window.location.origin);
          window.close();
        </script>
      </head>
      <body>
        <h1>Authentication Failed</h1>
        <p>Server error: ${error.message || 'Unknown error'}</p>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
} 