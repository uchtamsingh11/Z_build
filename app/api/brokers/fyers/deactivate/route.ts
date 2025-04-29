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

    // Update the broker to be inactive and remove tokens
    const updatedCredentials = {
      ...broker.credentials,
      'Access Token': null,
      'Refresh Token': null
    };
    
    const { error: updateError } = await supabase
      .from('broker_credentials')
      .update({
        credentials: updatedCredentials,
        access_token: null,
        token_expiry: null,
        is_active: false
      })
      .eq('id', broker_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Fyers broker deactivated successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate Fyers broker' },
      { status: 500 }
    );
  }
} 