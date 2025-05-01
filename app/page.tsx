import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextEffect } from '@/components/motion-primitives/text-effect'
import { AnimatedGroup } from '@/components/motion-primitives/animated-group'
import { HeroHeader } from '@/components/hero5-header'
import LogoCloud from '@/components/logo-cloud'
import Features from '@/components/features-3'
import IntegrationsSection from '@/components/integrations-section'
import Testimonials from '@/components/testimonials-2'
import DashboardPricing from '@/components/dashboard-pricing'
import Footer from '@/components/footer'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export default function Home() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden bg-black text-white font-mono">
                {/* Grid background overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none"></div>
                
                <section className="min-h-[calc(100vh-150px)] relative pt-20">
                    <div className="relative pt-24 md:pt-36">
                        <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"></div>
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants}>
                                    <Link
                                        href="/auth"
                                        className="hover:bg-zinc-900 group mx-auto flex w-fit items-center gap-4 rounded-full border border-zinc-800 p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300">
                                        <span className="text-white text-sm font-mono">ALGORITHMIC_TRADING_INTERFACE</span>
                                        <span className="block h-4 w-0.5 border-l bg-zinc-700"></span>

                                        <div className="bg-zinc-900 group-hover:bg-zinc-800 size-6 overflow-hidden rounded-full duration-500">
                                            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3 text-white" />
                                                </span>
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3 text-white" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </AnimatedGroup>

                                <TextEffect
                                    preset="fade-in-blur"
                                    speedSegment={0.3}
                                    as="h1"
                                    className="mt-8 text-balance text-6xl md:text-5xl lg:mt-16 xl:text-[4.25rem] font-mono uppercase tracking-wider">
                                    ALGOZ: TRADING_SMARTER
                                </TextEffect>
                                <TextEffect
                                    per="line"
                                    preset="fade-in-blur"
                                    speedSegment={0.3}
                                    delay={0.5}
                                    as="p"
                                    className="mx-auto mt-8 max-w-2xl text-balance text-md text-zinc-400 break-words text-wrap">
                                    HARNESS THE POWER OF ALGORITHMIC TRADING WITH OUR INTELLIGENT PLATFORM. OPTIMIZE YOUR STRATEGIES, MINIMIZE EMOTIONAL DECISIONS, AND MAXIMIZE YOUR RETURNS.
                                </TextEffect>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                                    <div
                                        key={1}
                                        className="rounded-md p-0.5">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="rounded-md px-5 text-base bg-white hover:bg-zinc-100 text-black font-mono">
                                            <Link href="/auth">
                                                <span className="text-nowrap uppercase">START_TRADING</span>
                                            </Link>
                                        </Button>
                                    </div>
                                    <Button
                                        key={2}
                                        asChild
                                        size="lg"
                                        variant="ghost"
                                        className="h-10.5 rounded-md px-5 text-white border border-zinc-700 hover:bg-zinc-800 font-mono">
                                        <Link href="/learn-more">
                                            <span className="text-nowrap uppercase">LEARN_MORE</span>
                                        </Link>
                                    </Button>
                                </AnimatedGroup>
                            </div>
                        </div>
                    </div>
                </section>
                
                <LogoCloud />
                <div id="features">
                    <Features />
                </div>
                {/* <IntegrationsSection /> */}
                <Testimonials />
                
                {/* Pricing heading */}
                <div id="pricing" className="mx-auto max-w-6xl px-6 pt-16 pb-8 text-center">
                    <h2 className="text-4xl font-medium lg:text-5xl text-white font-mono uppercase tracking-wider">PRICING_PLAN</h2>
                    <p className="mt-4 text-zinc-400 font-mono">CHOOSE_THE_PLAN_THAT_BEST_FITS_YOUR_TRADING_NEEDS</p>
                </div>
                
                <DashboardPricing />
            </main>
            <div id="about">
                <Footer />
            </div>
        </>
    )
}
