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

    // Ensure this is an Upstox broker
    if (broker.broker_name !== 'Upstox') {
      return NextResponse.json(
        { error: 'Not an Upstox broker' },
        { status: 400 }
      );
    }

    // Update the broker status to inactive
    const { error: updateError } = await supabase
      .from('broker_credentials')
      .update({ 
        is_active: false,
        auth_state: null,
        is_pending_auth: false
      })
      .eq('id', broker_id);

    if (updateError) {
      throw updateError;
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Upstox broker deactivated successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate Upstox broker' },
      { status: 500 }
    );
  }
} 