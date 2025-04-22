"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { CoinBalanceDisplay } from "@/components/coin-balance-display"
import TransactionHistoryModal from "@/components/transaction-history-modal"
import { 
  AlertCircle, 
  BadgeCheck, 
  Clock,
  Coins, 
  CreditCard, 
  TerminalIcon 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [sessionId, setSessionId] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [customAmount, setCustomAmount] = useState(500)
  const [customCoins, setCustomCoins] = useState(500)
  
  useEffect(() => {
    async function checkAuth() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase.auth.getUser()
      
      if (error || !data?.user) {
        window.location.href = '/auth/login'
        return
      }
      
      setUser(data.user)
      setSessionId(Math.random().toString(36).substring(2, 10).toUpperCase())
    }
    
    checkAuth()
  }, [])

  // Update coins when amount changes (1:1 ratio)
  useEffect(() => {
    setCustomCoins(customAmount)
  }, [customAmount])

  const handleHistoryClick = () => {
    setShowHistory(true)
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setCustomAmount(value)
  }

  const handlePurchase = async (amount: number) => {
    try {
      // Get the current user
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to purchase coins')
        return
      }

      // Create a transaction record
      const { error } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          transaction_type: 'recharge',
          description: `Purchased ${amount} coins`
        })

      if (error) {
        console.error('Error creating transaction:', error)
        alert('Failed to complete purchase')
        return
      }

      alert(`Successfully purchased ${amount} coins!`)

    } catch (error) {
      console.error('Error processing purchase:', error)
      alert('An error occurred while processing your purchase')
    }
  }

  // Define our pricing plans
  const pricingPlans = [
    {
      name: "BASIC_PLAN",
      price: "₹999",
      coins: 1000,
      recommended: false,
      cta: "BUY_NOW"
    },
    {
      name: "PRO_PLAN",
      price: "₹2249",
      coins: 2500,
      recommended: true,
      cta: "BUY_NOW"
    }
  ]

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full grid-cols-[auto_1fr] bg-black text-white font-mono">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-zinc-900">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block font-mono text-xs uppercase tracking-wider">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="font-mono text-xs uppercase tracking-wider">
                    <BreadcrumbPage>Pricing</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            <div className="ml-auto mr-4">
              <CoinBalanceDisplay />
            </div>
          </header>
          
          <div className="flex-1 bg-black min-h-screen relative">
            {/* Grid background overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
            
            {/* Console header */}
            <div className="border-b border-zinc-900 p-3 text-zinc-500 text-xs flex items-center bg-zinc-950 sticky top-0 z-10 mb-8">
              <div className="mr-auto flex items-center">
                <TerminalIcon className="w-4 h-4 mr-2" />
                <span>SYSTEM:PRICING</span>
              </div>
              <div>ACTIVE</div>
              <div className="ml-4 px-2 py-0.5 bg-zinc-950 border border-zinc-900 text-zinc-400">SESSION_ID: {sessionId}</div>
            </div>
            
            <div className="space-y-10 relative z-10 px-6 pb-10">
              {/* Header Section */}
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-3">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-mono uppercase tracking-wider text-white mb-1">PRICING_PLANS</h2>
                      <p className="text-zinc-400 text-sm">SELECT_OPTIMAL_RESOURCE_ALLOCATION</p>
                    </div>
                  </div>
                  <Button 
                    className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700 transition-all hover:shadow-md rounded-xl"
                    onClick={handleHistoryClick}
                  >
                    <Clock className="h-4 w-4" />
                    <span>History</span>
                  </Button>
                </div>
              </div>
              
              {/* Pricing Plans */}
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Basic Plan */}
                  <Card className="border-zinc-800 bg-zinc-900/50 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <CardHeader className="pt-8 px-6">
                      <div className="mb-4 flex items-center">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mr-4">
                          <Coins className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white font-mono">BASIC_PLAN</CardTitle>
                        </div>
                      </div>
                      
                      <div className="flex items-baseline mb-4">
                        <span className="text-4xl font-bold text-white">₹999</span>
                        <span className="ml-1 text-sm text-zinc-400">/one-time</span>
                      </div>
                      
                      <div className="flex items-center py-2 px-3 bg-zinc-950 rounded-md border border-zinc-800 mb-4">
                        <Coins className="h-4 w-4 text-white mr-2" />
                        <span className="text-lg font-mono">1000 COINS</span>
                      </div>
                    </CardHeader>
                    
                    <CardFooter className="px-6 pb-8">
                      <Button 
                        className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 mt-4"
                        onClick={() => handlePurchase(1000)}
                      >
                        BUY_NOW
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Pro Plan */}
                  <Card className="border-zinc-800 bg-zinc-900/50 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden ring-1 ring-white/20">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-white"></div>
                    
                    <CardHeader className="pt-8 px-6">
                      <div className="mb-4 flex items-center">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mr-4">
                          <Coins className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white font-mono">PRO_PLAN</CardTitle>
                          <div className="flex items-center mt-1">
                            <BadgeCheck className="w-3 h-3 text-white mr-1" />
                            <CardDescription className="text-xs text-zinc-400">RECOMMENDED_CONFIG</CardDescription>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-baseline mb-4">
                        <span className="text-4xl font-bold text-white">₹2249</span>
                        <span className="ml-1 text-sm text-zinc-400">/one-time</span>
                      </div>
                      
                      <div className="flex items-center py-2 px-3 bg-zinc-950 rounded-md border border-zinc-800 mb-4">
                        <Coins className="h-4 w-4 text-white mr-2" />
                        <span className="text-lg font-mono">2500 COINS</span>
                      </div>
                    </CardHeader>
                    
                    <CardFooter className="px-6 pb-8">
                      <Button 
                        className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 mt-4"
                        onClick={() => handlePurchase(2500)}
                      >
                        BUY_NOW
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Custom Plan */}
                  <Card className="border-zinc-800 bg-zinc-900/50 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <CardHeader className="pt-8 px-6">
                      <div className="mb-4 flex items-center">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mr-4">
                          <Coins className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white font-mono">CUSTOM_PLAN</CardTitle>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="flex items-center text-center mb-4">
                          <span className="text-4xl font-bold text-white">{customCoins}</span>
                          <Coins className="h-7 w-7 ml-2 text-amber-500" />
                        </div>
                        
                        <div className="flex items-center mb-4">
                          <span className="text-2xl font-semibold text-white">₹</span>
                          <Input 
                            type="number" 
                            value={customAmount}
                            onChange={handleAmountChange}
                            min="1"
                            className="bg-zinc-800 border-zinc-700 text-white text-xl font-semibold w-[120px] ml-1"
                          />
                        </div>
                        
                        <p className="text-xs text-zinc-400 mt-1 mb-4">₹1 = 1 Coin</p>
                      </div>
                    </CardHeader>
                    
                    <CardFooter className="px-6 pb-8">
                      <Button 
                        className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 mt-4"
                        onClick={() => handlePurchase(customAmount)}
                      >
                        BUY_NOW
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
              
              {/* Refund Policy Section */}
              <div className="max-w-5xl mx-auto mt-16">
                <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-zinc-500 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">REFUND_POLICY</h3>
                      <p className="text-xs text-zinc-400">All purchases are final and non-refundable once coins are credited to your account. Unused coins remain valid for 12 months from the date of purchase. For assistance, contact support.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
      
      {/* Transaction History Modal */}
      <TransactionHistoryModal 
        isOpen={showHistory} 
        onClose={handleCloseHistory} 
      />
    </SidebarProvider>
  )
} 