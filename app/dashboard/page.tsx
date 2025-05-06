import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
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
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowDown, 
  ArrowUp, 
  Globe, 
  Newspaper, 
  PieChart, 
  TrendingUp,
  ServerIcon,
} from "lucide-react"
import { TickerTape } from "@/components/tradingview/ticker-tape"
import { NewsWidget } from "@/components/tradingview/news-widget"

export default async function DashboardPage() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase()

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
                  <BreadcrumbItem className="font-mono text-xs uppercase tracking-wider">
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            <div className="ml-auto mr-4">
              <CoinBalanceDisplay />
            </div>
          </header>
          
          <div className="flex-1 px-4 py-6 bg-black min-h-screen relative">
            {/* Grid background overlay */}
            {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div> */}
            
            <div className="space-y-10 relative z-10">
              {/* 📈 TradingView Ticker Tape Widget */}
              <section>
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                    <Globe className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-sm font-mono uppercase tracking-wider text-white">LIVE_MARKET_DATA</h2>
                </div>
                <TickerTape 
                  symbols={[
                    { proName: "NASDAQ:AAPL", title: "Apple" },
                    { proName: "NASDAQ:GOOGL", title: "Google" },
                    { proName: "NASDAQ:TSLA", title: "Tesla" },
                    { proName: "FX_IDC:USDINR", title: "USD/INR" },
                    { proName: "CRYPTOCAP:BTC", title: "Bitcoin" }
                  ]}
                  colorTheme="dark"
                  isTransparent={true}
                  showSymbolLogo={true}
                  displayMode="regular"
                />
              </section>

              {/* 📊 Top Section – Market Overview Cards */}
              {/* <section>
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                    <BarChartIcon className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-sm font-mono uppercase tracking-wider text-white">MARKET_OVERVIEW</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MarketCard 
                    name="NIFTY" 
                    symbol="NIFTY" 
                    price="24,302.15" 
                    change={0.83} 
                    icon={<DollarSign className="h-5 w-5" />} 
                  />
                  <MarketCard 
                    name="BANKNIFTY" 
                    symbol="BANKNIFTY" 
                    price="51,437.22" 
                    change={1.14} 
                    icon={<DollarSign className="h-5 w-5" />} 
                  />
                  <MarketCard 
                    name="Bitcoin" 
                    symbol="BTC/USD" 
                    price="68,341.56" 
                    change={-2.31} 
                    icon={<Bitcoin className="h-5 w-5" />} 
                  />
                  <MarketCard 
                    name="XAUUSD" 
                    symbol="XAU/USD" 
                    price="2,328.45" 
                    change={-0.25} 
                    icon={<DollarSign className="h-5 w-5" />} 
                  />
                </div>
              </section> */}

              {/* 🧠 Mid Section – Portfolio Snapshot + Bot Performance */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                      <PieChart className="w-3 h-3 text-white" />
                    </div>
                    <h2 className="text-sm font-mono uppercase tracking-wider text-white">PORTFOLIO_SNAPSHOT</h2>
                  </div>
                  <Card className="lg:col-span-1 border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-zinc-500 font-mono">TOTAL_VALUE</p>
                          <p className="text-3xl font-bold">$0.00</p>
                          <p className="text-sm text-zinc-400 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            0.0% (24h)
                          </p>
                        </div>
                        {/* Pie chart placeholder */}
                        <div className="h-24 w-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                          <PieChart className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs mt-6">
                        <div>
                          <div className="h-2 w-full bg-zinc-800 rounded-full mb-1"></div>
                          <p className="text-zinc-400">STOCKS</p>
                          <p className="font-medium">0%</p>
                        </div>
                        <div>
                          <div className="h-2 w-full bg-zinc-700 rounded-full mb-1"></div>
                          <p className="text-zinc-400">CRYPTO</p>
                          <p className="font-medium">0%</p>
                        </div>
                        <div>
                          <div className="h-2 w-full bg-zinc-600 rounded-full mb-1"></div>
                          <p className="text-zinc-400">FOREX</p>
                          <p className="font-medium">0%</p>
                        </div>
                        <div>
                          <div className="h-2 w-full bg-zinc-500 rounded-full mb-1"></div>
                          <p className="text-zinc-400">COMMODITY</p>
                          <p className="font-medium">0%</p>
                        </div>
                      </div>
                      <div className="flex justify-between mt-6">
                        <Button variant="outline" size="sm" className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white text-xs font-mono">1D</Button>
                        <Button variant="outline" size="sm" className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white text-xs font-mono">1W</Button>
                        <Button variant="outline" size="sm" className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white text-xs font-mono">1M</Button>
                        <Button variant="outline" size="sm" className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white text-xs font-mono">ALL</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="flex items-center mb-4">
                    <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                      <ServerIcon className="w-3 h-3 text-white" />
                    </div>
                    <h2 className="text-sm font-mono uppercase tracking-wider text-white">BOT_PERFORMANCE</h2>
                  </div>
                  <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <CardContent className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-800">
                            <TableHead className="text-zinc-400 font-mono text-xs">BOT_NAME</TableHead>
                            <TableHead className="text-zinc-400 font-mono text-xs">STRATEGY</TableHead>
                            <TableHead className="text-zinc-400 font-mono text-xs">RETURN_%</TableHead>
                            <TableHead className="text-zinc-400 font-mono text-xs">STATUS</TableHead>
                            <TableHead className="text-zinc-400 font-mono text-xs">UPTIME</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-zinc-900">
                            <TableCell className="font-medium text-white">Alpha Trader</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 border-zinc-800 font-mono text-xs">
                                MOMENTUM
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300">+12.4%</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 border-zinc-800 font-mono text-xs">
                                RUNNING
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300">14d 6h</TableCell>
                          </TableRow>
                          <TableRow className="border-zinc-900">
                            <TableCell className="font-medium text-white">Beta Signals</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 border-zinc-800 font-mono text-xs">
                                ARBITRAGE
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300">+8.2%</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 border-zinc-800 font-mono text-xs">
                                PAUSED
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300">7d 11h</TableCell>
                          </TableRow>
                          <TableRow className="border-zinc-900">
                            <TableCell className="font-medium text-white">Gamma Bot</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 border-zinc-800 font-mono text-xs">
                                MEAN_REVERSION
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300">-2.1%</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 border-zinc-800 font-mono text-xs">
                                ERROR
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300">2d 8h</TableCell>
                          </TableRow>
                          <TableRow className="border-zinc-900">
                            <TableCell className="font-medium text-white">Delta Scanner</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 border-zinc-800 font-mono text-xs">
                                TREND_FOLLOWING
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300">+5.7%</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 border-zinc-800 font-mono text-xs">
                                RUNNING
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300">9d 14h</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* 📰 News and Market Intel Section */}
              <section>
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                    <Newspaper className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-sm font-mono uppercase tracking-wider text-white">MARKET_INTEL</h2>
                </div>
                <NewsWidget 
                  colorTheme="dark"
                  isTransparent={true}
                  height={500}
                  showBorder={false}
                  newsCategories={["headlines", "economy", "stock", "crypto"]}
                />
              </section>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// Component functions remain unchanged except for styling
function MarketCard({ name, symbol, price, change, icon }: { 
  name: string;
  symbol: string;
  price: string;
  change: number;
  icon: React.ReactNode;
}) {
  const isPositive = change >= 0
  
  return (
    <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-zinc-900 rounded-full border border-zinc-800">
              {icon}
            </div>
            <div>
              <h3 className="font-medium text-white">{name}</h3>
              <p className="text-xs text-zinc-500 font-mono">{symbol}</p>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl font-semibold">{price}</p>
          <p className={`flex items-center text-sm ${isPositive ? 'text-zinc-400' : 'text-zinc-400'}`}>
            {isPositive ? <ArrowUp className="h-3.5 w-3.5 mr-1" /> : <ArrowDown className="h-3.5 w-3.5 mr-1" />} 
            {Math.abs(change)}%
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function WatchlistItem({ symbol, name, price, change }: {
  symbol: string;
  name: string;
  price: string;
  change: number;
}) {
  const isPositive = change >= 0
  
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 last:border-0 hover:bg-zinc-900/20">
      <div>
        <h4 className="font-mono text-white">{symbol}</h4>
        <p className="text-xs text-zinc-500">{name}</p>
      </div>
      <div className="text-right">
        <p className="font-medium">{price}</p>
        <p className={`text-xs flex items-center justify-end font-mono ${isPositive ? 'text-zinc-400' : 'text-zinc-400'}`}>
          {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
          {Math.abs(change)}%
        </p>
      </div>
    </div>
  )
}

function StrategyCard({ name, winRate, trades, sharpe, drawdown, icon }: {
  name: string;
  winRate: number;
  trades: number;
  sharpe: number;
  drawdown: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-3 border border-zinc-900 rounded bg-zinc-900/30 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center p-1 rounded bg-zinc-900 border border-zinc-800">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-white">{name}</h3>
        </div>
        <p className="text-xs px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded font-mono">
          WR: {winRate}%
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-1 text-xs text-zinc-500">
        <div>
          <p className="text-zinc-400 font-mono">TRADES</p>
          <p className="text-white">{trades}</p>
        </div>
        <div>
          <p className="text-zinc-400 font-mono">SHARPE</p>
          <p className="text-white">{sharpe}</p>
        </div>
        <div>
          <p className="text-zinc-400 font-mono">DRAWDOWN</p>
          <p className="text-white">{drawdown}%</p>
        </div>
      </div>
    </div>
  )
}

function NewsItem({ title, source, summary, time, tags }: {
  title: string;
  source: string;
  summary: string;
  time: string;
  tags: string[];
}) {
  return (
    <div className="p-4 hover:bg-zinc-900/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <span className="text-xs text-zinc-500 whitespace-nowrap ml-2">{time}</span>
      </div>
      <p className="text-xs text-zinc-400 mt-1">{summary}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          {tags.map((tag, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
        <span className="text-xs text-zinc-500">{source}</span>
      </div>
    </div>
  )
}

function AlertItem({ symbol, condition, price, status }: {
  symbol: string;
  condition: 'above' | 'below';
  price: string;
  status: 'pending' | 'triggered';
}) {
  return (
    <div className="flex items-center justify-between p-3 border border-zinc-900 rounded bg-zinc-900/30">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'triggered' ? 'bg-zinc-400' : 'bg-zinc-700'}`}></div>
        <span className="text-sm font-mono">{symbol}</span>
      </div>
      <div className="text-xs text-zinc-400 font-mono">
        {condition === 'above' ? 'PRICE > ' : 'PRICE < '}{price}
      </div>
      <Badge variant="outline" className={`bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 border-zinc-800 font-mono text-xs ${status === 'triggered' ? 'border-zinc-700' : ''}`}>
        {status === 'triggered' ? 'TRIGGERED' : 'PENDING'}
      </Badge>
    </div>
  )
}

