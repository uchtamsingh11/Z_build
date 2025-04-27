import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define a type for the integrity check result
type CoinSystemIntegrityResult = {
  user_id: string;
  user_email: string;
  total_transactions_sum: number;
  current_balance: number;
  is_consistent: boolean;
  balance_error: number;
}

export async function GET() {
  try {
    console.log('Admin verify-coin-system endpoint called');
    const supabase = await createClient();
    
    // Get the current user to verify admin status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profileError || !userData) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }
    
    // Verify admin role
    if (userData.role !== 'admin') {
      console.error('Access denied for non-admin user:', user.id);
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Run the system integrity check with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const { data: integrityData, error: integrityError } = await supabase
        .rpc('verify_coin_system_integrity');
        
      clearTimeout(timeoutId);
        
      if (integrityError) {
        console.error('Error verifying coin system integrity:', integrityError);
        return NextResponse.json(
          { error: 'Failed to verify coin system integrity', details: integrityError.message },
          { status: 500 }
        );
      }
      
      // Calculate system summary - with corrected field name (balance_error)
      const inconsistentUsers = integrityData.filter((user: CoinSystemIntegrityResult) => !user.is_consistent);
      const totalErrorAmount = inconsistentUsers.reduce((sum: number, user: CoinSystemIntegrityResult) => 
        sum + Math.abs(user.balance_error), 0);
      
      return NextResponse.json({
        users: integrityData,
        summary: {
          totalUsers: integrityData.length,
          inconsistentUsers: inconsistentUsers.length,
          totalErrorAmount,
          systemHealthy: inconsistentUsers.length === 0
        }
      });
    } catch (timeoutError) {
      console.error('Coin system verification timed out');
      return NextResponse.json(
        { error: 'Verification timed out - the operation took too long to complete' },
        { status: 504 }
      );
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 