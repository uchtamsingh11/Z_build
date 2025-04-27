"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, BadgeCheck, Clock, Coins, CreditCard, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import TransactionHistoryModal from './transaction-history-modal'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

// Declare cashfree type for TypeScript
declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function DashboardPricing() {
    const [showHistory, setShowHistory] = useState(false);
    const [customAmount, setCustomAmount] = useState(500);
    const [customCoins, setCustomCoins] = useState(500);
    const [userBalance, setUserBalance] = useState(0);
    
    // Update coins when amount changes (1:1 ratio)
    useEffect(() => {
        setCustomCoins(customAmount);
    }, [customAmount]);

    const handleHistoryClick = () => {
        setShowHistory(true);
    };

    const handleCloseHistory = () => {
        setShowHistory(false);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        setCustomAmount(value);
    };

    return (
        <div className="max-w-6xl mx-auto pb-24">
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
<<<<<<< HEAD
                            onClick={() => handlePurchase(1000)}
                            asChild
                        >
                            <Link href="/auth">BUY_NOW</Link>
=======
                            onClick={() => window.location.href = '/pricing'}
                        >
                            VIEW DETAILS
>>>>>>> 82bb08576a74077e2884f81f186d67dce9129f9d
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
<<<<<<< HEAD
                            onClick={() => handlePurchase(2500)}
                            asChild
                        >
                            <Link href="/auth">BUY_NOW</Link>
=======
                            onClick={() => window.location.href = '/pricing'}
                        >
                            VIEW DETAILS
>>>>>>> 82bb08576a74077e2884f81f186d67dce9129f9d
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
<<<<<<< HEAD
                            onClick={() => handlePurchase(customAmount)}
                            asChild
                        >
                            <Link href="/auth">BUY_NOW</Link>
=======
                            onClick={() => window.location.href = '/pricing'}
                        >
                            VIEW DETAILS
>>>>>>> 82bb08576a74077e2884f81f186d67dce9129f9d
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            
            <div className="mx-auto max-w-6xl px-6 py-4 text-center">
                <p className="text-sm text-zinc-400 font-mono">YOU_CAN_USE_THIS_COIN_ACROSS_25_PLUS_PRODUCTS_AND_SERVICES</p>
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
            
            {/* Transaction History Modal */}
            <TransactionHistoryModal 
                isOpen={showHistory} 
                onClose={handleCloseHistory} 
            />
        </div>
    )
} 