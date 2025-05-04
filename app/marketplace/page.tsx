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
import { ChevronRight, Star, TrendingUp, BarChart3, RefreshCw, BadgeCheck, ShoppingBag, TerminalIcon, LogIn } from "lucide-react"
import { notFound } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Search,
  AlertCircle,
  ArrowUpDown,
  Filter,
  ChevronDown,
  ArrowRight,
  ChevronsUpDown,
  Bookmark,
  LayoutGrid,
  Calendar,
  TimerIcon
} from "lucide-react"

// Type definition for strategies
type Strategy = {
  id: string;
  name: string;
  description: string;
  price: number;
  script_code: string;
  created_by: string;
  created_at: string;
  author?: {
    email: string;
    role: string;
  };
  margin?: number;
  backtest_result?: number;
  tags?: string[];
  underlying?: string;
}

export default async function MarketplacePage() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    redirect('/auth/login')
  }

  // Initialize user role and authentication status
  let isAdmin = false;
  let isAuthenticated = !!userData?.user;

  // If user is authenticated, fetch their role from the users table
  if (isAuthenticated) {
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!profileError && profileData) {
      isAdmin = profileData.role === 'admin';
    }
  } else {
    // If not authenticated, redirect to login
    redirect('/auth/login');
  }

  // Fetch all strategies from the database with author information
  const { data: strategies, error: strategiesError } = await supabase
    .from('strategies')
    .select(`
      *,
      author:created_by(email, role)
    `)
    .order('created_at', { ascending: false });

  if (strategiesError) {
    console.error("Error fetching strategies:", strategiesError);
    return notFound();
  }

  // Enhance strategies with some dummy display data for the prototype
  const enhancedStrategies = strategies.map(strategy => {
    // Generate random values for demonstration purposes
    const margin = Math.floor(Math.random() * 1000) * 1000; // Random margin between 0-1000K
    const backtest_result = (Math.random() * 20 - 5).toFixed(2); // Random result between -5% and 15%
    const randomTags: string[] = [];
    
    // Random tags based on strategy
    const possibleTags = ['Intraday', 'Nifty', 'BankNifty', 'Buy', 'Sell', 'Options', 'Futures', 'Short-term'];
    const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags per strategy
    
    for (let i = 0; i < numTags; i++) {
      const randomIndex = Math.floor(Math.random() * possibleTags.length);
      if (!randomTags.includes(possibleTags[randomIndex])) {
        randomTags.push(possibleTags[randomIndex]);
      }
    }
    
    // Add either Buy or Sell if not present
    if (!randomTags.includes('Buy') && !randomTags.includes('Sell')) {
      randomTags.push(Math.random() > 0.5 ? 'Buy' : 'Sell');
    }
    
    return {
      ...strategy,
      margin,
      backtest_result: parseFloat(backtest_result),
      tags: randomTags,
      underlying: Math.random() > 0.5 ? 'Nifty' : 'BankNifty'
    };
  });

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full grid-cols-[auto_1fr] bg-black text-white font-mono">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-900 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <div className="text-sm font-medium">Strategy Marketplace</div>
            <div className="ml-auto flex items-center gap-2">
              <CoinBalanceDisplay />
            </div>
          </header>

          <div className="flex-1 bg-black min-h-screen relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-10"></div>
            
            <div className="relative z-10 mx-auto max-w-7xl px-4 py-6">
              {/* Main Tabs */}
              <Tabs defaultValue="algos" className="w-full">
                <div className="flex flex-wrap items-center justify-between mb-6">
                  <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="algos" className="data-[state=active]:bg-zinc-800">All Algos</TabsTrigger>
                    <TabsTrigger value="saved" className="data-[state=active]:bg-zinc-800">Saved Algos</TabsTrigger>
                    <TabsTrigger value="portfolios" className="data-[state=active]:bg-zinc-800">Portfolios</TabsTrigger>
                  </TabsList>
                  
                  {isAdmin && (
                    <Button asChild variant="outline" size="sm" className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
                      <Link href="/dashboard/create-strategy">
                        + Create New Strategy
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Sub-tabs */}
                <div className="mb-6">
                  <div className="border-b border-zinc-800 pb-1">
                    <div className="flex space-x-4">
                      <Button variant="link" className="text-white px-0 py-1 h-auto">Algo View</Button>
                    </div>
                  </div>
                </div>

                <TabsContent value="algos" className="mt-0">
                  {/* Filters Section */}
                  <div className="mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input 
                          placeholder="Search strategy or RA" 
                          className="pl-9 bg-zinc-900 border-zinc-800 focus:border-zinc-700" 
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="bg-zinc-900 border-zinc-800">All</Button>
                        <Button variant="outline" className="bg-zinc-900 border-zinc-800">Buying</Button>
                        <Button variant="outline" className="bg-zinc-900 border-zinc-800">Selling</Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-400">Margin Required (₹0K - ₹1000K)</label>
                        <Slider defaultValue={[500]} max={1000} step={50} className="py-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-400">Underlying</label>
                        <Select>
                          <SelectTrigger className="bg-zinc-900 border-zinc-800">
                            <SelectValue placeholder="All Underlyings" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="all">All Underlyings</SelectItem>
                            <SelectItem value="nifty">Nifty</SelectItem>
                            <SelectItem value="banknifty">BankNifty</SelectItem>
                            <SelectItem value="finnifty">FinNifty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-400">Deployment Days</label>
                        <Select>
                          <SelectTrigger className="bg-zinc-900 border-zinc-800">
                            <SelectValue placeholder="Select Days" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="all">All Days</SelectItem>
                            <SelectItem value="weekdays">Weekdays</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-400">Select RA</label>
                        <Select>
                          <SelectTrigger className="bg-zinc-900 border-zinc-800">
                            <SelectValue placeholder="All RAs" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="all">All RAs</SelectItem>
                            <SelectItem value="ra1">Risk Analyzer 1</SelectItem>
                            <SelectItem value="ra2">Risk Analyzer 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Alert Note */}
                  <Alert className="bg-red-950/20 border border-red-800 text-red-400 mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      The Backtests are based on past data. Historical data does not guarantee future results.
                    </AlertDescription>
                  </Alert>

                  {/* Strategy Grid Header */}
                  <div className="flex flex-wrap items-center justify-between mb-4">
                    <div className="text-sm font-medium">{enhancedStrategies.length} Strategies</div>
                    <div className="flex items-center gap-2">
                      <Select>
                        <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="performance">Best Performance</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Strategy Grid */}
                  {enhancedStrategies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enhancedStrategies.map((strategy) => (
                        <Card 
                          key={strategy.id} 
                          className="bg-zinc-900 border-zinc-800 transition-all duration-300 hover:border-zinc-700 hover:shadow-lg hover:translate-y-[-2px]"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="bg-zinc-800 text-xs px-1.5 py-0 h-5 font-normal">
                                    {strategy.underlying}
                                  </Badge>
                                  {strategy.tags?.includes('Intraday') && (
                                    <Badge className="bg-zinc-800 text-xs px-1.5 py-0 h-5 font-normal flex items-center">
                                      <TimerIcon className="mr-1 h-3 w-3" /> Intraday
                                    </Badge>
                                  )}
                                </div>
                                <CardTitle className="text-base font-semibold">{strategy.name}</CardTitle>
                                <div className="text-xs text-zinc-400 mt-1">by {strategy.author?.email || 'Unknown Author'}</div>
                              </div>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Bookmark className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pb-3">
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-zinc-800/40 p-2 rounded-md">
                                <div className="text-xs text-zinc-400 mb-1">Margin Required</div>
                                <div className="font-medium">₹{(strategy.margin / 1000).toFixed(0)}K</div>
                              </div>
                              <div className="bg-zinc-800/40 p-2 rounded-md">
                                <div className="text-xs text-zinc-400 mb-1">Backtest Result</div>
                                <div className={`font-medium ${strategy.backtest_result > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {strategy.backtest_result > 0 ? '+' : ''}{strategy.backtest_result}%
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-3">
                              {strategy.tags?.map((tag: string, index: number) => {
                                let tagColor = 'bg-zinc-800 text-zinc-300';
                                if (tag === 'Buy') tagColor = 'bg-green-900/30 text-green-400 border-green-800';
                                if (tag === 'Sell') tagColor = 'bg-red-900/30 text-red-400 border-red-800';
                                
                                return (
                                  <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className={`text-xs ${tagColor}`}
                                  >
                                    {tag}
                                  </Badge>
                                );
                              })}
                            </div>
                          </CardContent>
                          
                          <CardFooter className="flex-col space-y-2 pt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-zinc-800 hover:bg-zinc-800"
                              asChild
                            >
                              <Link href={`/dashboard/strategy/${strategy.id}`}>
                                View Backtest Results
                              </Link>
                            </Button>
                            
                            <Button
                              variant="default"
                              size="sm" 
                              className="w-full bg-zinc-800 hover:bg-zinc-700"
                            >
                              Get Plan (₹{strategy.price})
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
                      <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                        <LayoutGrid className="w-6 h-6 text-zinc-400" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">No Strategies Available</h3>
                      <p className="text-zinc-400 max-w-md mx-auto mb-6">
                        There are no trading strategies matching your filters.
                        {isAdmin && ' As an admin, you can create one!'}
                      </p>
                      {isAdmin && (
                        <Button asChild className="bg-zinc-800 hover:bg-zinc-700">
                          <Link href="/dashboard/create-strategy">
                            Create First Strategy
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="saved" className="mt-0">
                  <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                      <Bookmark className="w-6 h-6 text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Saved Strategies</h3>
                    <p className="text-zinc-400 max-w-md text-center mb-6">
                      Bookmark your favorite strategies to access them quickly.
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-zinc-800 hover:bg-zinc-800"
                      asChild
                    >
                      <Link href="#algos">
                        Browse Strategies
                      </Link>
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="portfolios" className="mt-0">
                  <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                      <LayoutGrid className="w-6 h-6 text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Portfolios Created</h3>
                    <p className="text-zinc-400 max-w-md text-center mb-6">
                      Build custom portfolios by combining multiple strategies.
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-zinc-800 hover:bg-zinc-800"
                    >
                      Create Portfolio
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 