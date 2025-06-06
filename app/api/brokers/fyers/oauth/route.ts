import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Environment variables (would normally be in .env)
const FYERS_AUTH_URL = process.env.FYERS_AUTH_URL || 'https://api.fyers.in/api/v2/generate-authcode';
// Default redirect URI as fallback
const DEFAULT_REDIRECT_URI = process.env.FYERS_REDIRECT_URI || 'https://www.algoz.tech/api/brokers/fyers/callback';

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

    // Ensure this is a Fyers broker
    if (broker.broker_name !== 'Fyers') {
      return NextResponse.json(
        { error: 'Not a Fyers broker' },
        { status: 400 }
      );
    }

    // Extract required credentials
    const { 'App ID': clientId } = broker.credentials;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required Fyers credentials (App ID)' },
        { status: 400 }
      );
    }

    // Generate a random state for CSRF protection
    const state = uuidv4();
    
    // Store the state in the broker record for verification later
    const { error: updateError } = await supabase
      .from('broker_credentials')
      .update({ 
        auth_state: state,
        is_pending_auth: true
      })
      .eq('id', broker_id);

    if (updateError) {
      throw updateError;
    }

    // Use redirect_url from broker record if available, otherwise use default
    const redirectUri = broker.redirect_url || DEFAULT_REDIRECT_URI;

    // Generate the OAuth URL
    const queryParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state
    });

    const redirectUrl = `${FYERS_AUTH_URL}?${queryParams.toString()}`;

    // Return the URL for the frontend to redirect to
    return NextResponse.json({
      success: true,
      redirect_url: redirectUrl
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Fyers OAuth flow' },
      { status: 500 }
    );
  }
} 