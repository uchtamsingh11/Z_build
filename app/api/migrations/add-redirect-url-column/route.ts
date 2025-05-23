import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Create the column if it doesn't exist
    const addColumnQuery = `
      ALTER TABLE broker_credentials
      ADD COLUMN IF NOT EXISTS redirect_url TEXT;
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
    
    // Check if the column already exists
    try {
      const { data, error } = await supabase
        .from('broker_credentials')
        .select('redirect_url')
        .limit(1);
      
      // If no error, column exists
      if (!error) {
        return NextResponse.json({
          success: true,
          message: 'redirect_url column already exists in broker_credentials table'
        });
      }
    } catch (checkError) {
      // Error checking column existence - proceed with creation
    }
    
    // Use fetch to call the migration endpoint
    const migrationResponse = await fetch(`/api/project/${projectId}/migration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'add_redirect_url_to_broker_credentials',
        sql: addColumnQuery
      })
    });
    
    if (!migrationResponse.ok) {
      const errorData = await migrationResponse.json();
      throw new Error(`Failed to add redirect_url column: ${errorData.error || 'Unknown error'}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'redirect_url column added to broker_credentials table successfully'
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed', details: error },
      { status: 500 }
    );
  }
} 