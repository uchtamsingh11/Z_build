import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Create the table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS broker_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        broker_id UUID NOT NULL,
        active BOOLEAN NOT NULL DEFAULT FALSE,
        last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY (broker_id) REFERENCES broker_credentials(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_broker_sessions_user_id ON broker_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_broker_sessions_broker_id ON broker_sessions(broker_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_broker_sessions_user_broker ON broker_sessions(user_id, broker_id);
    `;
    
    // Get project ID from query params
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required as a query parameter' },
        { status: 400 }
      );
    }
    
    // Check if the table already exists
    try {
      const { error: checkError } = await supabase.from('broker_sessions').select('id').limit(1);
      
      // If no error, table exists
      if (!checkError) {
        return NextResponse.json({
          success: true,
          message: 'broker_sessions table already exists'
        });
      }
    } catch (checkError) {
      // Error checking table existence - proceed with creation
    }
    
    // Use fetch to call the mcp_supabase_apply_migration endpoint
    const migrationResponse = await fetch(`/api/project/${projectId}/migration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'create_broker_sessions_table',
        sql: createTableQuery
      })
    });
    
    if (!migrationResponse.ok) {
      const errorData = await migrationResponse.json();
      throw new Error(`Failed to create broker_sessions table: ${errorData.error || 'Unknown error'}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'broker_sessions table created successfully'
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed', details: error },
      { status: 500 }
    );
  }
} 