import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Environment variables (would normally be in .env)
const DHAN_API_URL = process.env.DHAN_API_URL || 'https://api.dhan.co';

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

    // Extract the access token
    const { 'Access Token': accessToken } = broker.credentials;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 400 }
      );
    }
    
    // Make a request to Dhan API to check if the token is valid
    try {
      const profileResponse = await fetch(`${DHAN_API_URL}/v1/user/account`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      // If the request succeeds, the token is valid
      if (profileResponse.ok) {
        // Mark the broker as active
        const { error: updateError } = await supabase
          .from('broker_credentials')
          .update({ is_active: true })
          .eq('id', broker_id);

        if (updateError) {
          throw updateError;
        }
        
        return NextResponse.json({
          success: true,
          message: 'Dhan broker verified successfully'
        });
      }
      
      // If the request fails, the token is invalid
      const errorData = await profileResponse.json();
      
      return NextResponse.json(
        { error: `Dhan API error: ${errorData.message || errorData.error || 'Unknown error'}` },
        { status: 401 }
      );
      
    } catch (apiError: any) {
      return NextResponse.json(
        { 
          error: 'Failed to verify Dhan token',
          details: apiError.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to verify Dhan credentials' },
      { status: 500 }
    );
  }
} 