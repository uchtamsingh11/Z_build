"use client"

import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { Landmark } from 'lucide-react'

export default function LogoCloud() {
    return (
        <section className="bg-black overflow-hidden py-12 relative">
            {/* Grid background overlay */}
            {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div> */}
            
            <div className="group relative m-auto max-w-7xl px-6 z-10">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="md:max-w-44 md:border-r md:border-zinc-800 md:pr-6">
                        <div className="flex items-center mb-2">
                            <div className="w-7 h-7 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                                <Landmark className="w-3 h-3 text-white" />
                            </div>
                            <p className="text-end text-sm text-zinc-400 font-mono uppercase">TRUSTED_PARTNERS</p>
                        </div>
                    </div>
                    <div className="relative py-6 md:w-[calc(100%-11rem)]">
                        <InfiniteSlider
                            direction="horizontal"
                            speed={40}
                            speedOnHover={20}
                            gap={112}>
                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    ALICEBLUE
                                </span>
                            </div>

                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    ANGLEBROKING
                                </span>
                            </div>
                            
                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    DHANHQ
                                </span>
                            </div>
                            
                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    ZERODHA
                                </span>
                            </div>
                            
                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    FYERS
                                </span>
                            </div>
                            
                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    BINANCE
                                </span>
                            </div>

                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    DELTAEXCHANGE
                                </span>
                            </div>
                            
                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    KOTAK
                                </span>
                            </div>
                            
                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    FLATTRADE
                                </span>
                            </div>
                            
                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    ICICI_DIRECT
                                </span>
                            </div>
                            
                            <div className="flex">
                                <span className="mx-auto text-lg font-mono text-white opacity-70 hover:opacity-100 transition-opacity uppercase">
                                    IIFL
                                </span>
                            </div>
                        </InfiniteSlider>

                        <div className="bg-gradient-to-r from-black absolute inset-y-0 left-0 w-20"></div>
                        <div className="bg-gradient-to-l from-black absolute inset-y-0 right-0 w-20"></div>
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
