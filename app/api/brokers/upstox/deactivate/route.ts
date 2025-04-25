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
    
    // Update the broker's active status to false
    const { error: updateError } = await supabase
      .from('broker_credentials')
      .update({ is_active: false })
      .eq('id', broker_id)
      .eq('user_id', user.id);
    
    if (updateError) {
      throw updateError;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Upstox deactivated successfully' 
    });
    
  } catch (error: any) {
    console.error('Upstox deactivation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate Upstox' },
      { status: 500 }
    );
  }
} 