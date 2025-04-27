import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Define a type for the allowed services
type ServiceType = 'backtest' | 'optimisation';

// Define service costs for validation
const serviceCosts: Record<ServiceType, number> = {
  'backtest': 50,
  'optimisation': 500
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Validate service type with TypeScript
    const service = body.service as ServiceType
    
    // Verify service is valid
    if (!service || !Object.keys(serviceCosts).includes(service)) {
      return NextResponse.json({ 
        error: 'Invalid service specified',
        valid_services: Object.keys(serviceCosts)
      }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    
    // Call the database function to check service coins
    const { data, error } = await supabase.rpc('api_check_service_coins', {
      service: service
    })
    
    if (error) {
      console.error('Error checking service coins:', error)
      return NextResponse.json({ error: 'Failed to check coin balance' }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 