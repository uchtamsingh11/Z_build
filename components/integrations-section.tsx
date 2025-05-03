"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { InfiniteSlider } from '@/components/motion-primitives/infinite-slider'
import { ExternalLink } from 'lucide-react'

// Replace with actual trading/financial platform logos
const TradingPlatformLogos = {
  Binance: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0L5.6 6.4 8 8.8l4-4 4 4 2.4-2.4L12 0zM5.6 17.6L12 24l6.4-6.4-2.4-2.4-4 4-4-4-2.4 2.4zM4 12l-4 4 4 4 4-4-4-4z" />
      <path d="M20 12l4-4-4-4-4 4 4 4z" />
      <path d="M12 10.4L9.6 12l2.4 2.4 2.4-2.4-2.4-1.6z" />
    </svg>
  ),
  Coinbase: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.75c-5.385 0-9.75-4.365-9.75-9.75S6.615 2.25 12 2.25s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" />
      <path d="M12 6.75c-2.9 0-5.25 2.35-5.25 5.25s2.35 5.25 5.25 5.25 5.25-2.35 5.25-5.25-2.35-5.25-5.25-5.25z" />
    </svg>
  ),
  MetaMask: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.2848 1L13.3848 7.91L15.0048 3.95L22.2848 1Z" />
      <path d="M1.70484 1L10.5348 7.98L9.00484 3.95L1.70484 1Z" />
      <path d="M19.1348 17.19L16.7848 21.1L21.8648 22.61L23.3348 17.27L19.1348 17.19Z" />
      <path d="M0.674805 17.27L2.13481 22.61L7.21481 21.1L4.86481 17.19L0.674805 17.27Z" />
      <path d="M6.93481 10.77L5.54481 13.1L10.5848 13.36L10.4048 7.91L6.93481 10.77Z" />
      <path d="M17.0548 10.77L13.5248 7.84L13.3848 13.36L18.4148 13.1L17.0548 10.77Z" />
      <path d="M7.21481 21.1L10.2448 19.51L7.59481 17.3L7.21481 21.1Z" />
      <path d="M13.7548 19.51L16.7848 21.1L16.3948 17.3L13.7548 19.51Z" />
    </svg>
  ),
  KuCoin: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18a6 6 0 116-6 6 6 0 01-6 6zm0-10a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  ),
  Kraken: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.25 12c0 6.213-5.037 11.25-11.25 11.25S.75 18.213.75 12 5.787.75 12 .75 23.25 5.787 23.25 12zM9.75 7.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm9 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12 21.75c3.225 0 6.056-1.616 7.773-4.078l-3.366-2.25H7.593l-3.366 2.25A9.722 9.722 0 0012 21.75z" />
    </svg>
  ),
  TradingView: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
}

const integrationData = [
  {
    name: "Binance",
    icon: TradingPlatformLogos.Binance,
    description: "Connect to Binance for real-time trading data and automated execution"
  },
  {
    name: "Coinbase",
    icon: TradingPlatformLogos.Coinbase,
    description: "Integrate with Coinbase for seamless crypto trading and portfolio management"
  },
  {
    name: "MetaMask",
    icon: TradingPlatformLogos.MetaMask,
    description: "Use AlgoZ with MetaMask for DeFi strategy execution and monitoring"
  },
  {
    name: "KuCoin",
    icon: TradingPlatformLogos.KuCoin,
    description: "Link KuCoin accounts for comprehensive API-based trading solutions"
  },
  {
    name: "Kraken",
    icon: TradingPlatformLogos.Kraken,
    description: "Leverage Kraken's liquidity and market data with AlgoZ integration"
  },
  {
    name: "TradingView",
    icon: TradingPlatformLogos.TradingView,
    description: "Utilize TradingView charts and signals directly within AlgoZ"
  }
]

export default function IntegrationsSection() {
    const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
    
    return (
        <section>
            <div className="bg-black py-24 md:py-36 relative">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-purple-950/10 to-transparent opacity-30"></div>
                
                <div className="mx-auto mb-16 max-w-2xl space-y-6 text-center px-6">
                    <h2 className="text-balance text-3xl font-semibold md:text-5xl text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Integration Partners</h2>
                    <p className="text-gray-300 text-lg">Connect AlgoZ seamlessly with your favorite trading platforms and financial services.</p>

                    <Button
                        variant="outline"
                        size="lg"
                        className="mt-4 border-gray-700 bg-black/50 text-white hover:bg-zinc-900 hover:text-white hover:border-purple-500 transition-all duration-300"
                        asChild>
                        <Link href="#" className="flex items-center gap-2">
                            Explore All Integrations
                            <ExternalLink size={16} />
                        </Link>
                    </Button>
                </div>
                
                <div className="mx-auto max-w-6xl px-6">
                    <TooltipProvider>
                        <div className="bg-zinc-900/25 group relative mx-auto max-w-3xl items-center justify-between space-y-8 rounded-2xl border border-gray-800/30 p-8 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
                            <div
                                role="presentation"
                                className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:32px_32px] opacity-50"></div>
                            
                            {/* Highlighted integration description */}
                            {activeIntegration && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-black/70 border border-gray-800/50 p-4 rounded-lg text-center mb-4 backdrop-blur-md"
                                >
                                    <p className="text-gray-300">
                                        {integrationData.find(i => i.name === activeIntegration)?.description}
                                    </p>
                                </motion.div>
                            )}
                            
                            <div>
                                <InfiniteSlider
                                    gap={32}
                                    speed={20}
                                    direction="horizontal">
                                    {integrationData.slice(0, 4).map((integration, i) => (
                                        <Tooltip key={i}>
                                            <TooltipTrigger asChild>
                                                <div onMouseEnter={() => setActiveIntegration(integration.name)}>
                                                    <IntegrationCard>
                                                        <integration.icon />
                                                    </IntegrationCard>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-black border-gray-800 text-white">
                                                {integration.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </InfiniteSlider>
                            </div>

                            <div>
                                <InfiniteSlider
                                    gap={32}
                                    speed={20}
                                    direction="horizontal"
                                    reverse>
                                    {integrationData.slice(2, 6).map((integration, i) => (
                                        <Tooltip key={i}>
                                            <TooltipTrigger asChild>
                                                <div onMouseEnter={() => setActiveIntegration(integration.name)}>
                                                    <IntegrationCard>
                                                        <integration.icon />
                                                    </IntegrationCard>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-black border-gray-800 text-white">
                                                {integration.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </InfiniteSlider>
                            </div>
                            
                            <div>
                                <InfiniteSlider
                                    gap={32}
                                    speed={20}
                                    direction="horizontal">
                                    {integrationData.slice(1, 5).map((integration, i) => (
                                        <Tooltip key={i}>
                                            <TooltipTrigger asChild>
                                                <div onMouseEnter={() => setActiveIntegration(integration.name)}>
                                                    <IntegrationCard>
                                                        <integration.icon />
                                                    </IntegrationCard>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-black border-gray-800 text-white">
                                                {integration.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </InfiniteSlider>
                            </div>
                        </div>
                    </TooltipProvider>
                    
                    {/* Partner stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto text-center">
                        <div className="bg-zinc-900/20 border border-gray-800/30 rounded-lg p-6">
                            <p className="text-3xl font-bold text-white">25+</p>
                            <p className="text-gray-400">Trading Platforms</p>
                        </div>
                        <div className="bg-zinc-900/20 border border-gray-800/30 rounded-lg p-6">
                            <p className="text-3xl font-bold text-white">10M+</p>
                            <p className="text-gray-400">Daily Trades</p>
                        </div>
                        <div className="bg-zinc-900/20 border border-gray-800/30 rounded-lg p-6">
                            <p className="text-3xl font-bold text-white">99.9%</p>
                            <p className="text-gray-400">Uptime</p>
                        </div>
                        <div className="bg-zinc-900/20 border border-gray-800/30 rounded-lg p-6">
                            <p className="text-3xl font-bold text-white">$2B+</p>
                            <p className="text-gray-400">Daily Volume</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

const IntegrationCard = ({ children, className, isCenter = false }: { children: React.ReactNode; className?: string; position?: 'left-top' | 'left-middle' | 'left-bottom' | 'right-top' | 'right-middle' | 'right-bottom'; isCenter?: boolean }) => {
    return (
        <motion.div 
            whileHover={{ scale: 1.15, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className={cn('bg-black relative z-20 flex size-14 rounded-full border border-gray-800 shadow-lg hover:border-purple-500/50 hover:shadow-purple-900/20 cursor-pointer transition-colors duration-300', className)}>
            <div className={cn('m-auto size-fit *:size-7 *:text-white', isCenter && '*:size-8')}>{children}</div>
        </motion.div>
    )
} 