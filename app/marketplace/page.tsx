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

  // Get the featured strategy (first one for now, can be improved later)
  const featuredStrategy = strategies && strategies.length > 0 ? strategies[0] : null;

  const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();

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

          <div className="flex-1 px-4 py-6 bg-black min-h-screen relative"> 
          
          {/* Grid background overlay */}
          {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div> */}
          
          <div className="space-y-10 relative z-10">            
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
                  <Link href="/dashboard/my-strategy">Strategy</Link>
                </Button>
                
                {/* Only show Create Strategy button to admin users */}
                {isAdmin ? (
                  <Button asChild variant="default">
                    <Link href="/dashboard/create-strategy">Create Strategy</Link>
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="border-zinc-800 bg-zinc-900 opacity-70"
                    disabled
                    title="Admin access required"
                  >
                    Admin Access Required
                  </Button>
                )}
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
                    {isAdmin ? (
                      <Button asChild variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                        <Link href="/dashboard/create-strategy">Upload Strategy</Link>
                      </Button>
                    ) : (
                      <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                        How It Works
                      </Button>
                    )}
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
            
            {/* Featured Strategy Section */}
            {featuredStrategy ? (
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
                      <span className="text-xs font-medium uppercase text-white">Featured</span>
                      {/* Admin badge */}
                      <span className="text-xs font-medium rounded-full bg-indigo-900 px-2 py-0.5 text-white">Admin Verified</span>
                      <div className="ml-auto flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} fill={i < 4 ? "#ffffff" : "none"} 
                                stroke={i < 4 ? "#ffffff" : "#71717A"} 
                                className="h-3.5 w-3.5" />
                        ))}
                        <span className="ml-1 text-xs text-zinc-400">4.8 (12)</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-white">{featuredStrategy.name}</CardTitle>
                    <CardDescription className="text-zinc-300 mt-1">{featuredStrategy.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center pb-6">
                    <div className="grid grid-cols-3 gap-4 w-full">
                      <div className="rounded-lg bg-zinc-800/80 p-3">
                        <div className="text-xs text-zinc-400">Created</div>
                        <div className="text-lg font-bold text-white">
                          {new Date(featuredStrategy.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="rounded-lg bg-zinc-800/80 p-3">
                        <div className="text-xs text-zinc-400">Author</div>
                        <div className="text-lg font-bold text-white">
                          Admin
                        </div>
                      </div>
                      <div className="rounded-lg bg-zinc-800/80 p-3">
                        <div className="text-xs text-zinc-400">Price</div>
                        <div className="text-lg font-bold text-white">₹{featuredStrategy.price}</div>
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
            ) : null}
            
            {/* Strategy Cards */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">{strategies.length > 0 ? 'All Strategies' : 'No Strategies Available'}</h2>
                {isAdmin && (
                  <Button asChild variant="outline" size="sm" className="border-zinc-800 bg-zinc-900 text-sm">
                    <Link href="/dashboard/create-strategy">
                      + Add New Strategy
                    </Link>
                  </Button>
                )}
              </div>
              
              {strategies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {strategies.map((strategy) => {
                    // Randomly assign an icon for visual purposes
                    const icons = [TrendingUp, BarChart3, RefreshCw];
                    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
                    const Icon = randomIcon;
                    
                    return (
                      <Card key={strategy.id} className="bg-zinc-900 border-zinc-800 transition-all duration-300 hover:shadow-lg overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800">
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs font-medium uppercase text-white">Strategy</span>
                            {strategy.author?.role === 'admin' && (
                              <span className="bg-gradient-to-r from-indigo-900 to-purple-900 px-2 py-0.5 rounded-full text-xs font-medium">
                                ADMIN
                              </span>
                            )}
                            <div className="ml-auto flex items-center">
                              <Star fill="#ffffff" className="h-3 w-3" />
                              <span className="ml-0.5 text-xs text-zinc-400">4.5</span>
                            </div>
                          </div>
                          <CardTitle className="text-base font-bold">{strategy.name}</CardTitle>
                          <CardDescription className="text-xs mt-1 text-zinc-400 line-clamp-2">
                            {strategy.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="rounded-lg bg-zinc-800/50 p-2">
                            <div className="text-xs text-zinc-400">Price</div>
                            <div className="text-base font-bold">₹{strategy.price}</div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 pt-0">
                          <Button variant="outline" className="w-full text-xs border-zinc-800 hover:bg-zinc-800 py-1" asChild>
                            <Link href={`/dashboard/strategy/${strategy.id}`}>View Details</Link>
                          </Button>
                          {isAdmin && (
                            <Button 
                              variant="outline" 
                              className="w-8 h-8 p-0 text-xs border-zinc-800 hover:bg-zinc-800 hover:text-red-500" 
                              asChild
                            >
                              <Link href={`/dashboard/edit-strategy/${strategy.id}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M12 20h9"></path>
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                              </Link>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
                  <ShoppingBag className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Strategies Available</h3>
                  <p className="text-zinc-400 max-w-md mx-auto mb-6">
                    There are no trading strategies in the marketplace yet. 
                    {isAdmin && ' As an admin, you can be the first to create one!'}
                  </p>
                  {isAdmin && (
                    <Button asChild>
                      <Link href="/dashboard/create-strategy">
                        Create First Strategy
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Call to action for users */}
            {!isAdmin && (
              <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="rounded-full bg-zinc-800 p-4">
                    <TerminalIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">Are you a strategy developer?</h3>
                    <p className="mt-1 text-zinc-400">Contact an admin to have your Pine Script strategies uploaded to the marketplace.</p>
                  </div>
                  <Button className="bg-zinc-800 hover:bg-zinc-700">Contact Us</Button>
                </div>
              </div>
            )}
          </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 