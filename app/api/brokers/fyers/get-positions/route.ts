import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Environment variables (would normally be in .env)
const FYERS_API_URL = process.env.FYERS_API_URL || 'https://api-t1.fyers.in/api/v3';

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

    // Extract the access token
    const accessToken = broker.access_token || broker.credentials['Access Token'];
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 400 }
      );
    }

    // Request positions from Fyers API
    const positionsResponse = await fetch(`${FYERS_API_URL}/positions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!positionsResponse.ok) {
      // Check if it's a token-related error
      if (positionsResponse.status === 401 || positionsResponse.status === 403) {
        // Token might be expired or invalid
        await supabase
          .from('broker_credentials')
          .update({ is_active: false })
          .eq('id', broker_id);
          
        return NextResponse.json(
          { error: 'Authentication failed with Fyers API. Please reactivate your broker.' },
          { status: 401 }
        );
      }
      
      // Other API error
      const errorData = await positionsResponse.json();
      return NextResponse.json(
        { error: `Fyers API error: ${errorData.message || 'Unknown error'}` },
        { status: positionsResponse.status || 500 }
      );
    }

    // Parse the positions data
    const positionsData = await positionsResponse.json();
    
    // Also fetch holdings if available
    try {
      const holdingsResponse = await fetch(`${FYERS_API_URL}/holdings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (holdingsResponse.ok) {
        const holdingsData = await holdingsResponse.json();
        
        // Return both positions and holdings
        return NextResponse.json({
          success: true,
          data: {
            positions: positionsData,
            holdings: holdingsData
          }
        });
      }
    } catch (holdingsError) {
      console.error('Error fetching holdings:', holdingsError);
      // Continue with just positions if holdings fails
    }
    
    // Return just positions if holdings weren't fetched
    return NextResponse.json({
      success: true,
      data: {
        positions: positionsData,
        holdings: null
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch positions from Fyers' },
      { status: 500 }
    );
  }
} 