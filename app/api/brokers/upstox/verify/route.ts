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
    
    // Fetch the broker credentials for the user
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
    
    // Extract the access token from the credentials
    const { credentials } = broker;
    const accessToken = credentials['Access Token'];
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found in broker credentials' },
        { status: 400 }
      );
    }
    
    // Call Upstox's Get Profile API to verify the token
    const profileResponse = await fetch('https://api.upstox.com/v2/user/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    // Check if the profile was fetched successfully
    if (!profileResponse.ok) {
      // If the token is invalid or expired, return an error
      return NextResponse.json(
        { error: 'No profile found. Token might be invalid or expired.' },
        { status: 401 }
      );
    }
    
    // Profile was fetched successfully, update the broker's active status
    const { error: updateError } = await supabase
      .from('broker_credentials')
      .update({ is_active: true })
      .eq('id', broker_id)
      .eq('user_id', user.id);
    
    if (updateError) {
      throw updateError;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Upstox authentication success'
    });
    
  } catch (error: any) {
    console.error('Upstox verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify Upstox token' },
      { status: 500 }
    );
  }
} 