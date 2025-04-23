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
  const [isLoading, setIsLoading] = useState<number | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [phone, setPhone] = useState<string>('')
  
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
      setEmail(data.user?.email || null)
      setSessionId(Math.random().toString(36).substring(2, 10).toUpperCase())
      
      // Skip profile retrieval to avoid errors with missing table
      // We'll just use email from the user object
      /*
      // Fetch user profile for phone number if available
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', data.user.id)
        .single();
        
      if (profile?.phone) {
        setPhone(profile.phone);
      }
      */
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

  // Function to load Cashfree SDK
  const loadCashfreeSDK = async () => {
    return new Promise<any>((resolve, reject) => {
      // Check if already loaded
      if ((window as any).Cashfree) {
        resolve((window as any).Cashfree);
        return;
      }
      
      // Use production SDK URL 
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js';
      script.async = true;
      
      script.onload = () => {
        // Initialize Cashfree
        const cashfree = new (window as any).Cashfree();
        resolve(cashfree);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Cashfree SDK'));
      };
      
      document.body.appendChild(script);
    });
  };

  // New payment handler with Cashfree integration
  const handlePurchase = async (planId: number, coins: number, price: number) => {
    try {
      if (!user) {
        alert('Please log in to purchase coins');
        return;
      }
      
      setIsLoading(planId);
      
      console.log("Starting purchase process...");
      // Call our API to create a payment order
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          coinAmount: coins,
          price: price,
          customerEmail: email,
          customerPhone: phone
        }),
      });
      
      const data = await response.json();
      console.log("Create order response:", data);
      
      if (!data.success) {
        console.error('Failed to create payment order:', data.message);
        alert('Failed to initiate payment. Please try again.');
        setIsLoading(null);
        return;
      }
      
      // Load Cashfree SDK
      const cashfree = await loadCashfreeSDK();
      console.log("Loaded Cashfree SDK");
      
      // Initiate payment
      // Updated to use the new API response format
      let sessionId = '';
      if (data.data && data.data.cf_order_id) {
        sessionId = data.data.cf_order_id;
      } else if (data.data && data.data.payment_session_id) {
        sessionId = data.data.payment_session_id;
      } else {
        console.error('Missing session ID in response:', data);
        alert('Payment initialization error. Please try again.');
        setIsLoading(null);
        return;
      }
      
      console.log("Initiating checkout with session ID:", sessionId);
      cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: '_self'
      });
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('An error occurred while initiating payment. Please try again.');
      setIsLoading(null);
    }
  };

  // Define our pricing plans
  const pricingPlans = [
    {
      id: 1,
      name: "BASIC_PLAN",
      price: 999,
      coins: 1000,
      recommended: false,
      cta: "BUY_NOW"
    },
    {
      id: 2,
      name: "PRO_PLAN",
      price: 2249,
      coins: 2500,
      recommended: true,
      cta: "BUY_NOW"
    },
    {
      id: 3,
      name: "CUSTOM_PLAN",
      custom: true,
      recommended: false,
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
                        onClick={() => handlePurchase(1, 1000, 999)}
                        disabled={isLoading === 1}
                      >
                        {isLoading === 1 ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            PROCESSING
                          </span>
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
                          <span className="inline-block px-2 py-0.5 bg-white text-black text-xs font-semibold rounded mt-1">RECOMMENDED</span>
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
                        className="w-full h-12 bg-white hover:bg-zinc-200 text-black border-zinc-200 mt-4 font-semibold"
                        onClick={() => handlePurchase(2, 2500, 2249)}
                        disabled={isLoading === 2}
                      >
                        {isLoading === 2 ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            PROCESSING
                          </span>
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
                      
                      <div className="flex items-center mb-4">
                        <div className="basis-1/2">
                          <Input
                            type="number"
                            min="100"
                            value={customAmount}
                            onChange={handleAmountChange}
                            placeholder="Enter amount"
                            className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
                          />
                        </div>
                        <div className="basis-1/2 pl-3">
                          <span className="text-xl font-bold text-white">₹{customAmount}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center py-2 px-3 bg-zinc-950 rounded-md border border-zinc-800 mb-4">
                        <Coins className="h-4 w-4 text-white mr-2" />
                        <span className="text-lg font-mono">{customCoins} COINS</span>
                      </div>
                    </CardHeader>
                    
                    <CardFooter className="px-6 pb-8">
                      <Button 
                        className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 mt-4"
                        onClick={() => handlePurchase(3, customCoins, customAmount)}
                        disabled={isLoading === 3 || customAmount < 100}
                      >
                        {isLoading === 3 ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            PROCESSING
                          </span>
                        ) : (
                          'BUY_NOW'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
              
              {/* Payment Info Section */}
              <div className="max-w-3xl mx-auto mt-16">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                  <h3 className="text-lg font-mono mb-4 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    PAYMENT_INFORMATION
                  </h3>
                  
                  <div className="text-sm text-zinc-400 space-y-2">
                    <p>• All payments are processed securely through Cashfree Payment Gateway.</p>
                    <p>• Coins will be instantly credited to your account after successful payment.</p>
                    <p>• For any payment-related issues, please contact our support team.</p>
                    <p>• Coins are non-refundable but do not expire.</p>
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