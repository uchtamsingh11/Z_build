import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Default redirect URI as fallback
const DEFAULT_REDIRECT_URI = process.env.DHAN_REDIRECT_URI || 'https://www.algoz.tech/api/brokers/dhan/callback';
// Dhan OAuth URL
const DHAN_AUTH_URL = process.env.DHAN_AUTH_URL || 'https://api.dhan.co/oauth2/authorize';

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

    // Ensure this is a Dhan broker
    if (broker.broker_name !== 'Dhan') {
      return NextResponse.json(
        { error: 'Not a Dhan broker' },
        { status: 400 }
      );
    }

    // Extract required credentials
    const { 'Client ID': clientId } = broker.credentials;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required Dhan credentials (Client ID)' },
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

    const redirectUrl = `${DHAN_AUTH_URL}?${queryParams.toString()}`;

    // Return the URL for the frontend to redirect to
    return NextResponse.json({
      success: true,
      redirect_url: redirectUrl
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Dhan OAuth flow' },
      { status: 500 }
    );
  }
} 