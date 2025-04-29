import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as fyersClient from '@/fyers_api_client';

// Environment variables (would normally be in .env)
const FYERS_API_URL = process.env.FYERS_API_URL || 'https://api.fyers.in/api/v2';
const FYERS_REDIRECT_URI = process.env.FYERS_REDIRECT_URI || 'https://www.algoz.tech/api/brokers/fyers/callback';

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
    const { 'client_id': clientId, 'secret_key': secretKey } = broker.credentials;
    
    if (!clientId || !secretKey) {
      return NextResponse.json(
        { error: 'Missing required Fyers credentials (client_id or secret_key)' },
        { status: 400 }
      );
    }

    // Generate a random state to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2);
    
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

    // Generate the OAuth URL - Fyers uses appType of "100" for API applications
    const redirectUrl = fyersClient.generateAuthCodeURL(clientId, "100", FYERS_REDIRECT_URI);

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