import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// This endpoint checks if the 'status' column exists in the broker_credentials table
// If it doesn't exist, it adds the column
export async function POST() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
      
    if (profileError || !userProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Check if the 'status' column exists in the broker_credentials table
    const { data: columnExists, error: columnError } = await supabase
      .rpc('check_column_exists', { 
        p_table_name: 'broker_credentials', 
        p_column_name: 'status' 
      });
    
    if (columnError) {
      throw columnError;
    }
    
    // If the column doesn't exist, add it
    if (!columnExists) {
      // Execute SQL to add the column
      const { error: alterError } = await supabase.rpc('execute_sql', {
        sql: `
          ALTER TABLE broker_credentials 
          ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disabled';
          
          -- Update existing records to set 'active' status where is_active is true
          UPDATE broker_credentials
          SET status = 'active'
          WHERE is_active = true;
        `
      });
      
      if (alterError) {
        throw alterError;
      }
      
      return NextResponse.json({
        success: true,
        message: 'Status column added to broker_credentials table'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Status column already exists in broker_credentials table'
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add status column' },
      { status: 500 }
    );
  }
} 