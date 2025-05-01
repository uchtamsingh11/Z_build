"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LineChart, BarChart3, UsersRound, Store, Code, Settings } from 'lucide-react'
import { ReactNode } from 'react'

export default function Features() {
    return (
        <section className="bg-black py-16 md:py-32 relative" id="features">
            {/* Grid background overlay */}
            {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div> */}
            
            <div className="mx-auto max-w-6xl px-6 relative z-10">
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-3">
                            <Settings className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-4xl font-semibold lg:text-5xl text-white font-mono uppercase tracking-wider break-words text-wrap">ADVANCED_FEATURES</h2>
                    </div>
                    <p className="mt-4 text-zinc-400 font-mono break-words text-wrap">ALGORITHMIC_TRADING_SOLUTIONS_FOR_MODERN_TRADERS</p>
                </div>
                
                <Card className="mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x overflow-hidden shadow-zinc-900/20 text-center md:mt-16 bg-black border-zinc-800">
                    <div className="group shadow-zinc-900/10 hover:bg-zinc-900/50 transition-colors duration-300 p-2 sm:p-4">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <LineChart className="size-6 text-white" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-white font-mono uppercase break-words text-wrap">TRADINGVIEW</h3>
                        </CardHeader>
                        <CardContent>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-900/10 hover:bg-zinc-900/50 transition-colors duration-300 p-2 sm:p-4">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <BarChart3 className="size-6 text-white" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-white font-mono uppercase break-words text-wrap">SCALPING_TOOL</h3>
                        </CardHeader>
                        <CardContent>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-900/10 hover:bg-zinc-900/50 transition-colors duration-300 p-2 sm:p-4">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <UsersRound className="size-6 text-white" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-white font-mono uppercase break-words text-wrap">COPY_TRADING</h3>
                        </CardHeader>
                        <CardContent>
                        </CardContent>
                    </div>
                </Card>
                
                <Card className="mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x overflow-hidden shadow-zinc-900/20 text-center bg-black border-zinc-800">
                    <div className="group shadow-zinc-900/10 hover:bg-zinc-900/50 transition-colors duration-300 p-2 sm:p-4">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Store className="size-6 text-white" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-white font-mono uppercase break-words text-wrap">MARKETPLACE</h3>
                        </CardHeader>
                        <CardContent>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-900/10 hover:bg-zinc-900/50 transition-colors duration-300 p-2 sm:p-4">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Code className="size-6 text-white" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-white font-mono uppercase break-words text-wrap">CUSTOM_DEVELOPER</h3>
                        </CardHeader>
                        <CardContent>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-900/10 hover:bg-zinc-900/50 transition-colors duration-300 p-2 sm:p-4">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Settings className="size-6 text-white" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-white font-mono uppercase break-words text-wrap">OPTIMIZATION</h3>
                        </CardHeader>
                        <CardContent>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-white)25%,transparent)]">
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div aria-hidden className="bg-radial to-black absolute inset-0 from-transparent to-75%" />
        <div className="bg-black absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t border-gray-800 group-hover:border-gray-700 transition-colors duration-300">{children}</div>
    </div>
)
