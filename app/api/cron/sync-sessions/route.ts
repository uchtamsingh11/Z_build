import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// This endpoint can be called by a cron job to keep sessions in sync with broker status
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Directly use the RPC function to sync sessions
    const { data, error } = await supabase.rpc('sync_broker_sessions');
    
    if (error) {
      // If RPC fails, try the session-checker endpoint as backup
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/brokers/session-checker`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to sync sessions: ${errorData.error || 'Unknown error'}`);
      }
      
      const checkData = await response.json();
      
      return NextResponse.json({
        success: true,
        cron_job: 'sync-sessions',
        method: 'http_fallback',
        timestamp: new Date().toISOString(),
        details: checkData
      });
    }
    
    return NextResponse.json({
      success: true,
      cron_job: 'sync-sessions',
      method: 'direct_rpc',
      timestamp: new Date().toISOString(),
      deactivated: data || 0
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run session sync cron job' },
      { status: 500 }
    );
  }
} 