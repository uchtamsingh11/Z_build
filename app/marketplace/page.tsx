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
import { createClient } from '@/lib/supabase/server'
import { CoinBalanceDisplay } from "@/components/coin-balance-display"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { ChevronRight, Star, TrendingUp, BarChart3, RefreshCw, BadgeCheck, ShoppingBag, TerminalIcon } from "lucide-react"

export default async function MarketplacePage() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();

  // Mock strategy data - in a real app, this would come from your database
  const featuredStrategy = {
    id: 0,
    title: "Advanced Volatility Harvester",
    description: "Our premium strategy that adapts to market volatility and captures significant movements with advanced risk management.",
    price: "$299",
    type: "Semi",
    rating: 4.9,
    reviews: 124,
    featured: true
  };

  const strategies = [
    {
      id: 1,
      title: "Momentum Breakout Strategy",
      description: "A strategy that identifies and capitalizes on momentum breakouts with risk management and profit targets.",
      price: "$99",
      type: "Semi",
      rating: 4.7,
      reviews: 86,
      icon: TrendingUp
    },
    {
      id: 2,
      title: "Trend Following System",
      description: "Follows established market trends with multiple timeframe analysis for optimal entry and exit points.",
      price: "$149",
      type: "Semi",
      rating: 4.5,
      reviews: 62,
      icon: BarChart3,
      badge: "TRENDING"
    },
    {
      id: 3,
      title: "Mean Reversion Strategy",
      description: "Identifies overbought and oversold market conditions to capture price reversions to the mean.",
      price: "$129",
      type: "Semi", 
      rating: 4.6,
      reviews: 53,
      icon: RefreshCw
    },
    {
      id: 4,
      title: "Scalping Strategy Bundle",
      description: "A collection of short-term strategies designed for quick market entries and exits with tight risk control.",
      price: "$199",
      type: "Semi",
      rating: 4.8,
      reviews: 95,
      icon: TrendingUp
    },
  ]

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
                    <BreadcrumbPage>Marketplace</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            <div className="ml-auto mr-4 flex items-center gap-2">
              <CoinBalanceDisplay />
            </div>
          </header>
          
          {/* Grid background overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
          
          {/* Console header */}
          <div className="border-b border-zinc-900 p-3 text-zinc-500 text-xs flex items-center bg-zinc-950 sticky top-0 z-10 mb-8">
            <div className="mr-auto flex items-center">
              <TerminalIcon className="w-4 h-4 mr-2" />
              <span>SYSTEM:MARKETPLACE</span>
            </div>
            <div>ACTIVE</div>
            <div className="ml-4 px-2 py-0.5 bg-zinc-950 border border-zinc-900 text-zinc-400">SESSION_ID: {sessionId}</div>
          </div>
          
          <div className="relative z-10 px-4">
            <div className="flex items-center mb-6">
              <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                <ShoppingBag className="w-3 h-3 text-white" />
              </div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-white">STRATEGY_MARKETPLACE</h2>
            </div>
            
            {/* Action Buttons Row */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-2">
                <Button asChild variant="outline">
                  <Link href="/dashboard/my-strategy">My Strategy</Link>
                </Button>
                <Button asChild variant="default">
                  <Link href="/dashboard/create-strategy">Create Strategy</Link>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-sm border-zinc-800 bg-zinc-900">
                  Latest
                </Button>
                <Button variant="outline" size="sm" className="text-sm border-zinc-800 bg-zinc-900">
                  Top Rated
                </Button>
                <Button variant="outline" size="sm" className="text-sm border-zinc-800 bg-zinc-900">
                  Price
                </Button>
              </div>
            </div>
            
            {/* Hero Section */}
            <div className="relative mb-10 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-8 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>
              <div className="absolute -inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent"></div>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="max-w-2xl">
                  <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Strategy Marketplace</h1>
                  <p className="text-zinc-300 text-lg max-w-xl">
                    Discover high-performance trading strategies from professional traders and developers. Filter, evaluate, and implement with just a few clicks.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">Browse All Strategies</Button>
                    <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                      How It Works
                    </Button>
                  </div>
                </div>
                <div className="flex-shrink-0 hidden md:block">
                  <div className="relative w-[180px] h-[180px] rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 p-1">
                    <div className="absolute inset-1 rounded-full bg-zinc-900 flex items-center justify-center">
                      <BarChart3 className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Featured Strategy */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Featured Strategy</h2>
                <Button variant="link" asChild className="text-white flex items-center">
                  <Link href="/marketplace/featured">
                    View All Features <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
              
              <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-zinc-800 shadow-xl hover:shadow-zinc-900/30 transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800">
                      <BadgeCheck className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium uppercase text-white">{featuredStrategy.type}</span>
                    <div className="ml-auto flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} fill={i < Math.floor(featuredStrategy.rating) ? "#ffffff" : "none"} 
                              stroke={i < Math.floor(featuredStrategy.rating) ? "#ffffff" : "#71717A"} 
                              className="h-3.5 w-3.5" />
                      ))}
                      <span className="ml-1 text-xs text-zinc-400">{featuredStrategy.rating} ({featuredStrategy.reviews})</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-white">{featuredStrategy.title}</CardTitle>
                  <CardDescription className="text-zinc-300 mt-1">{featuredStrategy.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center pb-6">
                  <div className="grid grid-cols-3 gap-4 w-full">
                    <div className="rounded-lg bg-zinc-800/80 p-3">
                      <div className="text-xs text-zinc-400">Success Rate</div>
                      <div className="text-lg font-bold text-white">94.2%</div>
                    </div>
                    <div className="rounded-lg bg-zinc-800/80 p-3">
                      <div className="text-xs text-zinc-400">Avg. Return</div>
                      <div className="text-lg font-bold text-white">+18.7%</div>
                    </div>
                    <div className="rounded-lg bg-zinc-800/80 p-3">
                      <div className="text-xs text-zinc-400">Price</div>
                      <div className="text-lg font-bold text-white">{featuredStrategy.price}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-0">
                  <Button variant="outline" className="flex-1 border-zinc-700 hover:bg-zinc-800" asChild>
                    <Link href={`/dashboard/strategy/${featuredStrategy.id}`}>View Details</Link>
                  </Button>
                  <Button variant="default" className="flex-1 bg-zinc-800 hover:bg-zinc-700">
                    Buy Strategy
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Strategy Cards */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Popular Strategies</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {strategies.map((strategy) => {
                  const Icon = strategy.icon || TrendingUp;
                  return (
                    <Card key={strategy.id} className="relative flex flex-col h-full bg-zinc-900 border-zinc-800 shadow-lg hover:shadow-zinc-900/30 hover:border-zinc-700 transition-all duration-300">
                      {strategy.badge && (
                        <div className="absolute right-3 top-3 z-10 bg-zinc-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                          {strategy.badge}
                        </div>
                      )}
                      <CardHeader className="pb-2 pt-6">
                        <div className="flex items-center mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-auto flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} fill={i < Math.floor(strategy.rating) ? "#ffffff" : "none"} 
                                   stroke={i < Math.floor(strategy.rating) ? "#ffffff" : "#71717A"} 
                                   className="h-3 w-3" />
                            ))}
                            <span className="ml-1 text-xs text-zinc-400">{strategy.rating}</span>
                          </div>
                        </div>
                        <CardTitle className="text-base font-semibold">{strategy.title}</CardTitle>
                        <CardDescription className="text-xs text-zinc-400 mt-1 line-clamp-2">{strategy.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4 pt-0 px-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-white">{strategy.price}</span>
                          <span className="text-xs text-zinc-400">{strategy.type} Auto</span>
                        </div>
                      </CardContent>
                      <CardFooter className="mt-auto pt-0">
                        <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 text-sm" asChild>
                          <Link href={`/dashboard/strategy/${strategy.id}`}>View Details</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 