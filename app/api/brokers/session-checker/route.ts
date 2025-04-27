import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// This endpoint can be called by a cron job every minute to ensure
// no active sessions exist for inactive brokers
export async function GET() {
  try {
    const supabase = await createClient();
    
    // First try using the stored procedure
    try {
      const { data, error } = await supabase.rpc('sync_broker_sessions');
      
      if (!error) {
        return NextResponse.json({
          success: true,
          method: 'stored_procedure',
          deactivated: data || 0,
          timestamp: new Date().toISOString()
        });
      }
    } catch (rpcError) {
      console.warn('RPC method failed, using direct query instead:', rpcError);
    }
    
    // Fallback method: Update directly in the database
    const { data: updateResult, error: updateError } = await supabase
      .from('broker_credentials')
      .update({
        session_active: false,
        last_activity: new Date().toISOString()
      })
      .eq('is_active', false)
      .eq('session_active', true);
    
    if (updateError) {
      throw updateError;
    }
    
    // Count how many rows were affected
    const { count, error: countError } = await supabase
      .from('broker_credentials')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
      .eq('session_active', false)
      .gt('last_activity', new Date(Date.now() - 60000).toISOString()); // Updated in the last minute
    
    if (countError) {
      throw countError;
    }
    
    return NextResponse.json({ 
      success: true,
      method: 'direct_query',
      message: 'Sessions synchronized with broker active status',
      deactivated: count || 0
    });
  } catch (error: any) {
    console.error('Session checker error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check sessions' },
      { status: 500 }
    );
  }
} 