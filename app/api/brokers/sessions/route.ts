import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Create or update session status directly in broker_credentials
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get request data
    const requestData = await request.json();
    const { broker_id, active } = requestData;
    
    if (!broker_id) {
      return NextResponse.json(
        { error: 'broker_id is required' },
        { status: 400 }
      );
    }
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // First, verify if the broker exists and check its active status
    const { data: brokerData, error: brokerError } = await supabase
      .from('broker_credentials')
      .select('is_active')
      .eq('id', broker_id)
      .eq('user_id', user.id)
      .single();
    
    if (brokerError || !brokerData) {
      return NextResponse.json(
        { error: 'Broker not found or access denied' },
        { status: 404 }
      );
    }
    
    // Check if the broker is active in the database
    const isActive = brokerData.is_active;
    
    // If broker is not active in the database, force session to be inactive
    // regardless of what was requested
    const sessionActive = isActive ? active : false;
    
    if (sessionActive && !isActive) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot activate session for inactive broker',
        active: false 
      }, { status: 400 });
    }
    
    // Update the session_active field in broker_credentials
    const { error: updateError } = await supabase
      .from('broker_credentials')
      .update({
        session_active: sessionActive,
        last_activity: new Date().toISOString()
      })
      .eq('id', broker_id)
      .eq('user_id', user.id);
    
    if (updateError) {
      throw updateError;
    }
    
    return NextResponse.json({ 
      success: true, 
      active: sessionActive
    });
  } catch (error: any) {
    console.error('Session management error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to manage broker session' },
      { status: 500 }
    );
  }
}

// Get session status for all brokers
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get all broker credentials with session status
    const { data: brokers, error: brokersError } = await supabase
      .from('broker_credentials')
      .select(`
        id,
        broker_name,
        is_active,
        session_active,
        last_activity,
        created_at
      `)
      .eq('user_id', user.id);
    
    if (brokersError) {
      throw brokersError;
    }
    
    return NextResponse.json(brokers || []);
  } catch (error: any) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch broker sessions' },
      { status: 500 }
    );
  }
} 