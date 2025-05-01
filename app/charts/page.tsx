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
import { BarChart3, TerminalIcon } from "lucide-react"

export default async function ChartsPage() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/auth/login')
  }

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
                    <BreadcrumbPage>Charts</BreadcrumbPage>
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
              <div className="flex items-center mb-6">
                <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                  <BarChart3 className="w-3 h-3 text-white" />
                </div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-white">Advanced AI Charting Suite</h2>
              </div>

              <div className="text-center">
                <a
                // href="/charts/advanced"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-3 bg-black border border-white rounded-md text-lg font-medium text-white"
                >
                  Launch Charting Suite
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              <div className="max-w-2xl mx-auto">
                <ul className="text-white space-y-3 list-disc pl-6">
                  <li>Unlimited access to enterprise-grade charting software — completely free</li>
                  <li>Harness military-grade AI to generate high-performance trading strategies in seconds</li>
                  <li>Full multi-language support: code in Pine Script, JavaScript, or Python with zero limitations</li>
                  <li>Execute strategies at institutional speed via our proprietary algo trading engine</li>
                  <li>Exclusive access to our comprehensive quantitative trading methodology eBook</li>
                  <li>Seamless integration with 25+ global brokers for frictionless trade execution</li>
                  <li>Transform your proprietary trading logic into executable algorithms without compromise</li>
                  <li>Monetize your expertise by creating and selling battle-tested strategies in our marketplace</li>
                </ul>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 