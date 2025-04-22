import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BacktestingPage } from "@/components/backtest/backtest-page"

export default async function Page() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex-1 bg-black">
      <h1 className="text-3xl font-bold mb-6 text-white">Backtest</h1>
      <BacktestingPage />
    </div>
  )
} 