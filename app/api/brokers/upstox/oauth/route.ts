import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Environment variables (would normally be in .env)
const UPSTOX_API_URL = process.env.UPSTOX_API_URL || 'https://api.upstox.com/v2';
const UPSTOX_LOGIN_URL = process.env.UPSTOX_LOGIN_URL || 'https://api.upstox.com/v2/login/authorization/dialog';
// Default redirect URI as fallback
const DEFAULT_REDIRECT_URI = process.env.UPSTOX_REDIRECT_URI || 'https://www.algoz.tech/api/brokers/upstox/callback';

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

    // Ensure this is an Upstox broker
    if (broker.broker_name !== 'Upstox') {
      return NextResponse.json(
        { error: 'Not an Upstox broker' },
        { status: 400 }
      );
    }

    // Extract required credentials
    const { 'API Key': apiKey, 'Secret Key': secretKey } = broker.credentials;
    
    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: 'Missing required Upstox credentials (API Key or Secret Key)' },
        { status: 400 }
      );
    }

    // Generate a random state to prevent CSRF attacks
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
      client_id: apiKey,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state
    });

    const redirectUrl = `${UPSTOX_LOGIN_URL}?${queryParams.toString()}`;

    // Return the URL for the frontend to redirect to
    return NextResponse.json({
      success: true,
      redirect_url: redirectUrl
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Upstox OAuth flow' },
      { status: 500 }
    );
  }
} 