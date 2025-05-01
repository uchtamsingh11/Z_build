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
import { useState, useEffect, useCallback } from 'react'
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
  TerminalIcon,
  Info,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from 'next/navigation'

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [sessionId, setSessionId] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [processingPaymentFor, setProcessingPaymentFor] = useState<number | null>(null)
  const [userBalance, setUserBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [directCheckoutReady, setDirectCheckoutReady] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const router = useRouter()
  const [formattedBalance, setFormattedBalance] = useState('0')
  
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

  // Load Cashfree SDK
  useEffect(() => {
    // Only load the script once
    if (!document.getElementById('cashfree-script')) {
      const script = document.createElement('script')
      script.id = 'cashfree-script'
      script.src = 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js'
      script.async = true
      script.onload = () => setDirectCheckoutReady(true)
      document.body.appendChild(script)
    } else if (window.Cashfree) {
      setDirectCheckoutReady(true)
    }
  }, [])

  const handleHistoryClick = () => {
    setShowHistory(true)
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
  }
  
  const handlePurchase = async (amount: number, coins: number) => {
    try {
      setIsLoading(true)
      setProcessingPaymentFor(coins)
      
      // Call our API to create an order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          coins: coins
        }),
      })
      
      const data = await response.json()
      
      // Log the response
      console.log('Payment data received:', data)
      
      if (!response.ok) {
        console.error('Payment API error:', data)
        throw new Error(data.error || 'Failed to create order')
      }
      
      // Prioritize payment_link (most reliable method)
      if (data.payment_link) {
        window.location.href = data.payment_link
        return
      } 
      
      // Fallback to Direct Checkout if payment_session_id exists and SDK is fully loaded
      if (data.payment_session_id && directCheckoutReady && window.Cashfree) {
        try {
          const cashfree = new window.Cashfree(data.payment_session_id)
          cashfree.redirect()
          return
        } catch (directError) {
          console.error('Direct checkout error:', directError)
          // Continue to session ID fallback if direct checkout fails
        }
      }
      
      // Last resort: session_id URL redirect 
      if (data.payment_session_id) {
        window.location.href = `https://payments.cashfree.com/order/#${data.payment_session_id}`
        return
      }
      
      throw new Error('Payment gateway error: Required payment data missing')
      
    } catch (error) {
      console.error('Payment error:', error)
      alert('Failed to initiate payment. Please try again.')
    } finally {
      setIsLoading(false)
      setProcessingPaymentFor(null)
    }
  }

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
              
              {/* Pricing Cards */}
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
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
                        onClick={() => handlePurchase(999, 1000)}
                        disabled={isLoading}
                      >
                        {isLoading && processingPaymentFor === 1000 ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> PROCESSING</>
                        ) : (
                          'BUY_NOW'
                        )}
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
                        onClick={() => handlePurchase(2249, 2500)}
                        disabled={isLoading}
                      >
                        {isLoading && processingPaymentFor === 2500 ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> PROCESSING</>
                        ) : (
                          'BUY_NOW'
                        )}
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
                          <span className="text-4xl font-bold text-white">1</span>
                          <Coins className="h-7 w-7 ml-2 text-amber-500" />
                        </div>
                        
                        <div className="flex items-center mb-4">
                          <span className="text-2xl font-semibold text-white">₹</span>
                          <span className="text-2xl font-semibold text-white ml-1">1</span>
                        </div>
                        
                        <p className="text-xs text-zinc-400 mt-1 mb-4">₹1 = 1 Coin</p>
                      </div>
                    </CardHeader>
                    
                    <CardFooter className="px-6 pb-8">
                      <Button 
                        className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 mt-4"
                        onClick={() => handlePurchase(1, 1)}
                        disabled={isLoading}
                      >
                        {isLoading && processingPaymentFor === 1 ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> PROCESSING</>
                        ) : (
                          'BUY_NOW'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
              
              <div className="mx-auto max-w-6xl px-6 py-4 text-center">
                <p className="text-sm text-zinc-400 font-mono">YOU_CAN_USE_THIS_COIN_ACROSS_25_PLUS_PRODUCTS_AND_SERVICES</p>
              </div>
              
              {/* Refund Policy Section */}
              <div className="max-w-5xl mx-auto mt-8">
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
      {showHistory && (
        <TransactionHistoryModal isOpen={showHistory} onClose={handleCloseHistory} />
      )}
    </SidebarProvider>
  );
} 