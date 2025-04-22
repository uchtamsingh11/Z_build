"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquareQuote } from 'lucide-react'

export default function Testimonials() {
    return (
        <section className="bg-black py-16 md:py-32 relative">
            {/* Grid background overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
            
            <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16 relative z-10">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12 mb-8">
                    <div className="flex items-center justify-center mb-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-3">
                            <MessageSquareQuote className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-4xl font-medium lg:text-5xl text-white font-mono uppercase tracking-wider">USER FEEDBACK</h2>
                    </div>
                    <p className="mt-4 text-zinc-400 font-mono">REAL TRADERS SHARE THEIR EXPERIENCE WITH OUR ALGORITHMIC TRADING PLATFORM</p>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
                    <Card className="grid grid-rows-[auto_1fr] gap-6 sm:col-span-2 sm:p-6 lg:row-span-2 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors duration-300 h-auto min-h-40">
                        <CardContent>
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p className="text-lg font-medium text-white font-mono leading-relaxed">"ALGOZ HAS TRANSFORMED MY TRADING APPROACH. THEIR ADVANCED ALGORITHMS IMPROVED MY PERFORMANCE."</p>

                                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                                    <Avatar className="size-12 border border-zinc-700">
                                        <AvatarImage src="https://avatar.vercel.sh/rajesh" alt="Rajesh Sharma" height="400" width="400" loading="lazy" />
                                        <AvatarFallback className="bg-zinc-800 text-white font-mono">RS</AvatarFallback>
                                    </Avatar>

                                    <div>
                                        <cite className="text-sm font-medium text-white font-mono">RAJESH SHARMA</cite>
                                        <span className="text-zinc-400 block text-sm font-mono">PROFESSIONAL TRADER</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors duration-300 h-auto min-h-40">
                        <CardContent className="h-full pt-6">
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p className="text-base font-medium text-white font-mono leading-relaxed">"THE BACKTESTING CAPABILITIES ARE UNMATCHED. TEST STRATEGIES IN MINUTES."</p>

                                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                                    <Avatar className="size-12 border border-zinc-700">
                                        <AvatarImage src="https://avatar.vercel.sh/priya" alt="Priya Patel" height="400" width="400" loading="lazy" />
                                        <AvatarFallback className="bg-zinc-800 text-white font-mono">PP</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <cite className="text-sm font-medium text-white font-mono">PRIYA PATEL</cite>
                                        <span className="text-zinc-400 block text-sm font-mono">HEDGE FUND ANALYST</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors duration-300 h-auto min-h-40">
                        <CardContent className="h-full pt-6">
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p className="text-sm font-medium text-white font-mono leading-relaxed">"ALGOZ ML MODELS IDENTIFY PATTERNS I WOULD MISS."</p>

                                <div className="grid items-center gap-3 [grid-template-columns:auto_1fr]">
                                    <Avatar className="size-12 border border-zinc-700">
                                        <AvatarImage src="https://avatar.vercel.sh/vikram" alt="Vikram Mehta" height="400" width="400" loading="lazy" />
                                        <AvatarFallback className="bg-zinc-800 text-white font-mono">VM</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <cite className="text-sm font-medium text-white font-mono">VIKRAM MEHTA</cite>
                                        <span className="text-zinc-400 block text-sm font-mono">DATA SCIENTIST</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors duration-300 h-auto min-h-40">
                        <CardContent className="h-full pt-6">
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p className="text-sm font-medium text-white font-mono leading-relaxed">"AS A NOVICE TRADER, ALGOZ INTERFACE IS INVALUABLE."</p>

                                <div className="grid grid-cols-[auto_1fr] gap-3">
                                    <Avatar className="size-12 border border-zinc-700">
                                        <AvatarImage src="https://avatar.vercel.sh/anjali" alt="Anjali Gupta" height="400" width="400" loading="lazy" />
                                        <AvatarFallback className="bg-zinc-800 text-white font-mono">AG</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-white font-mono">ANJALI GUPTA</p>
                                        <span className="text-zinc-400 block text-sm font-mono">RETAIL INVESTOR</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
} 