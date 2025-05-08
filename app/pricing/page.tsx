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
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { CoinBalanceDisplay } from "@/components/coin-balance-display"
import { 
  AlertCircle, 
  BadgeCheck, 
  Coins, 
  CreditCard, 
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [processingPaymentFor, setProcessingPaymentFor] = useState<number | null>(null)
  const [directCheckoutReady, setDirectCheckoutReady] = useState(false)
  
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
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
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
            {/* Content area with proper padding for mobile */}
            <div className="space-y-8 p-4 md:p-6 relative z-10">
              {/* Header Section */}
              <div className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                      <CreditCard className="w-3 h-3 text-white" />
                    </div>
                    <h2 className="text-sm font-mono uppercase tracking-wider text-white">PRICING_PLANS</h2>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">SELECT_OPTIMAL_RESOURCE_ALLOCATION</p>
                </div>
              </div>
              
              {/* Pricing Cards - Responsive Grid */}
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Basic Plan */}
                  <Card className="border-zinc-800 bg-zinc-900/50 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <CardHeader className="pt-6 px-4 md:pt-8 md:px-6">
                      <div className="mb-4 flex items-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center mr-3">
                          <Coins className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base md:text-lg text-white font-mono">BASIC_PLAN</CardTitle>
                        </div>
                      </div>
                      
                      <div className="flex items-baseline mb-4">
                        <span className="text-3xl md:text-4xl font-bold text-white">₹999</span>
                        <span className="ml-1 text-xs md:text-sm text-zinc-400">/only</span>
                      </div>
                      
                      <div className="flex items-center py-2 px-3 bg-zinc-950 rounded-md border border-zinc-800 mb-4">
                        <Coins className="h-3 w-3 md:h-4 md:w-4 text-white mr-2" />
                        <span className="text-base md:text-lg font-mono">1000 COINS</span>
                      </div>
                    </CardHeader>
                    
                    <CardFooter className="px-4 pb-6 md:px-6 md:pb-8">
                      <Button 
                        className="w-full h-10 md:h-12 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 mt-2 md:mt-4 text-sm md:text-base"
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
                    
                    <CardHeader className="pt-6 px-4 md:pt-8 md:px-6">
                      <div className="mb-4 flex items-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center mr-3">
                          <Coins className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base md:text-lg text-white font-mono">PRO_PLAN</CardTitle>
                          <div className="flex items-center mt-1">
                            <BadgeCheck className="w-3 h-3 text-white mr-1" />
                            <CardDescription className="text-xs text-zinc-400">RECOMMENDED_CONFIG</CardDescription>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-baseline mb-4">
                        <span className="text-3xl md:text-4xl font-bold text-white">₹2249</span>
                        <span className="ml-1 text-xs md:text-sm text-zinc-400">/only</span>
                      </div>
                      
                      <div className="flex items-center py-2 px-3 bg-zinc-950 rounded-md border border-zinc-800 mb-4">
                        <Coins className="h-3 w-3 md:h-4 md:w-4 text-white mr-2" />
                        <span className="text-base md:text-lg font-mono">2500 COINS</span>
                      </div>
                    </CardHeader>
                    
                    <CardFooter className="px-4 pb-6 md:px-6 md:pb-8">
                      <Button 
                        className="w-full h-10 md:h-12 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 mt-2 md:mt-4 text-sm md:text-base"
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
                  <Card className="border-zinc-800 bg-zinc-900/50 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden sm:col-span-2 lg:col-span-1">
                    <CardHeader className="pt-6 px-4 md:pt-8 md:px-6">
                      <div className="mb-4 flex items-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center mr-3">
                          <Coins className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base md:text-lg text-white font-mono">CUSTOM_PLAN</CardTitle>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="flex items-center text-center mb-4">
                          <span className="text-3xl md:text-4xl font-bold text-white">1</span>
                          <Coins className="h-5 w-5 md:h-7 md:w-7 ml-2 text-amber-500" />
                        </div>
                        
                        <div className="flex items-center mb-4">
                          <span className="text-xl md:text-2xl font-semibold text-white">₹</span>
                          <span className="text-xl md:text-2xl font-semibold text-white ml-1">1</span>
                        </div>
                        
                        <p className="text-xs text-zinc-400 mt-1 mb-4">₹1 = 1 Coin</p>
                      </div>
                    </CardHeader>
                    
                    <CardFooter className="px-4 pb-6 md:px-6 md:pb-8">
                      <Button 
                        className="w-full h-10 md:h-12 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 mt-2 md:mt-4 text-sm md:text-base"
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
              
              <div className="w-full pt-2 pb-4 text-center">
                <p className="text-xs md:text-sm text-zinc-400 font-mono">YOU_CAN_USE_THIS_COIN_ACROSS_25_PLUS_PRODUCTS_AND_SERVICES</p>
              </div>
              
              {/* Refund Policy Section */}
              <div className="w-full mt-4">
                <div className="p-3 md:p-4 bg-zinc-900/30 border border-zinc-800 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-xs md:text-sm font-medium text-white mb-1">REFUND_POLICY</h3>
                      <p className="text-xs text-zinc-400">All purchases are final and non-refundable once coins are credited to your account. Unused coins remain valid for 12 months from the date of purchase. For assistance, contact support.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 