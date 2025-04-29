import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as fyersClient from '@/fyers_api_client';

// Environment variables (would normally be in .env)
const FYERS_API_URL = process.env.FYERS_API_URL || 'https://api.fyers.in/api/v2';
const FYERS_REDIRECT_URI = process.env.FYERS_REDIRECT_URI || 'https://www.algoz.tech/api/brokers/fyers/callback';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // Fyers may provide the code as 'auth_code', 'code', or in another parameter
    const code = url.searchParams.get('auth_code') || url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_msg') || url.searchParams.get('error_description');
    
    console.log('Callback received with params:', {
      code: code ? 'PRESENT' : 'MISSING',
      state: state ? 'PRESENT' : 'MISSING',
      error: error || 'NONE',
      params: Object.fromEntries(url.searchParams.entries())
    });
    
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
              error: 'Missing code or state parameter. Received params: ${JSON.stringify(Object.fromEntries(url.searchParams.entries()))}'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>Missing code or state parameter.</p>
          <p>Received parameters: ${JSON.stringify(Object.fromEntries(url.searchParams.entries()))}</p>
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
      console.error('Broker not found with state:', state, brokerError);
      
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fyers Authentication Failed</title>
          <script>
            window.opener.postMessage({
              type: 'FYERS_AUTH_FAILURE',
              error: 'Invalid state parameter or session expired'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>Invalid state parameter or your authentication session has expired. Please try again.</p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Extract required credentials
    const { 'client_id': clientId, 'secret_key': secretKey } = broker.credentials;
    
    // Exchange the authorization code for an access token
    try {
      console.log('Exchanging auth code for token with:', { 
        clientId, 
        code: code?.substring(0, 5) + '...',
        redirect_uri: FYERS_REDIRECT_URI
      });
      
      const tokenData = await fyersClient.generateAccessToken(code, clientId, secretKey, FYERS_REDIRECT_URI);
      
      // Log token data for debugging (remove in production)
      console.log('Token response object keys:', Object.keys(tokenData));
      
      // Extract access token - handle different response formats
      let accessToken;
      if (tokenData.access_token) {
        accessToken = tokenData.access_token;
      } else if (tokenData.data && tokenData.data.access_token) {
        accessToken = tokenData.data.access_token;
      } else {
        console.error('Token response data:', JSON.stringify(tokenData));
        throw new Error('No access token found in Fyers response');
      }
      
      console.log('Token received:', accessToken ? 'Token received successfully' : 'No token received');
      
      if (!accessToken) {
        console.error('Token response data:', JSON.stringify(tokenData));
        throw new Error('No access token received from Fyers');
      }
      
      // Update the broker credentials with the tokens
      const updatedCredentials = {
        ...broker.credentials,
        'Access Token': accessToken,
        'Token Type': tokenData.token_type || 'bearer',
        'Expires In': tokenData.expires_in || '86400', // Default to 1 day if not provided
      };
      
      console.log('Updating broker record with token, id:', broker.id);
      
      // Save the updated credentials and mark the broker as active
      const { error: updateError } = await supabase
        .from('broker_credentials')
        .update({
          credentials: updatedCredentials,
          access_token: accessToken, // Store in dedicated column
          is_active: true,
          is_pending_auth: false,
          auth_state: null,
          updated_at: new Date().toISOString() // Ensure updated_at is set
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
          <p>Fyers authentication completed successfully. You can close this window and return to the application.</p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } catch (tokenError: any) {
      console.error('Error exchanging code for token:', tokenError);
      
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
              error: '${tokenError.message || 'Token exchange failed'}'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>${tokenError.message || 'Failed to exchange code for access token'}</p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
  } catch (error: any) {
    console.error('Callback general error:', error);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fyers Authentication Failed</title>
        <script>
          window.opener.postMessage({
            type: 'FYERS_AUTH_FAILURE',
            error: '${error.message || 'Unknown error'}'
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