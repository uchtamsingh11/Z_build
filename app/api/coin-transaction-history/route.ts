import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    
    // Fetch transaction history
    const { data: transactions, error: transactionError } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (transactionError) {
      console.error('Error fetching transactions:', transactionError)
      return NextResponse.json({ error: 'Failed to fetch transaction history' }, { status: 500 })
    }
    
    // Fetch service usage history
    const { data: serviceUsage, error: serviceError } = await supabase
      .rpc('get_user_service_history')
    
    if (serviceError) {
      console.error('Error fetching service usage:', serviceError)
      // Continue with just transactions if service history fails
    }
    
    return NextResponse.json({
      transactions,
      serviceUsage: serviceError ? [] : serviceUsage,
      user_id: user.id
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 