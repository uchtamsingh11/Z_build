import { createClient } from '@/lib/supabase/server';

// Environment variables (would normally be in .env)
const FYERS_TOKEN_URL = process.env.FYERS_TOKEN_URL || 'https://api.fyers.in/api/v2/token';
const FYERS_REDIRECT_URI = process.env.FYERS_REDIRECT_URI || 'https://www.algoz.tech/api/brokers/fyers/callback';

export async function GET(request: Request) {
  try {
    console.log("Fyers callback received");
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    console.log("Fyers callback params:", { code, state, error, errorDescription });
    
    // If there's an error, close the window with an error message
    if (error) {
      console.error("Fyers auth error:", error, errorDescription);
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
      console.error("Missing code or state parameter:", { code, state });
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
      console.error("Invalid state parameter or broker not found:", brokerError);
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
      console.error("Missing required credentials");
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
    
    // Use redirect_url from broker record if available, otherwise use default
    const redirectUri = broker.redirect_url || FYERS_REDIRECT_URI;
    
    // Exchange the authorization code for an access token
    console.log("Exchanging code for token with params:", { grant_type: 'authorization_code', code, client_id: clientId, redirect_uri: redirectUri });
    
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
        redirect_uri: redirectUri,
      }),
    });
    
    console.log("Token exchange response status:", tokenResponse.status);
    
    if (!tokenResponse.ok) {
      let errorMessage = 'Failed to exchange code for token';
      let errorDetails;
      
      try {
        const errorData = await tokenResponse.json();
        console.error("Token exchange error response:", errorData);
        errorMessage = errorData.message || errorData.error_description || errorData.error || errorMessage;
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        console.error("Error parsing token response:", e);
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
              error: '${errorMessage} - ${errorDetails || "No details available"}'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>${errorMessage}</p>
          <p>Details: ${errorDetails || "No details available"}</p>
          <p>This error typically occurs when:</p>
          <ul>
            <li>The App ID is invalid or not active</li>
            <li>The redirect URI does not match what's registered in Fyers</li>
            <li>The authorization code has expired or is invalid</li>
          </ul>
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
    console.log("Token exchange successful, data:", tokenData);
    
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
    
    console.log("Fyers authentication successful");
    
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
        <p>You have successfully authenticated with Fyers. This window will close automatically.</p>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Fyers callback error:', error);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fyers Authentication Failed</title>
        <script>
          window.opener.postMessage({
            type: 'FYERS_AUTH_FAILURE',
            error: 'An unexpected error occurred'
          }, window.location.origin);
          window.close();
        </script>
      </head>
      <body>
        <h1>Authentication Failed</h1>
        <p>An unexpected error occurred: ${error.message || 'Unknown error'}</p>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
} 