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
import { BrokerSelector } from "@/components/shared/broker-selector"
import { Card, CardContent } from "@/components/ui/card"
import { TerminalIcon, ScissorsIcon } from "lucide-react"

export default async function Page() {
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
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-zinc-900 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
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
                  <BreadcrumbItem className="hidden md:block font-mono text-xs uppercase tracking-wider">
                    <BreadcrumbLink href="/scalping-tool">
                      Scalping Tool
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="font-mono text-xs uppercase tracking-wider">
                    <BreadcrumbPage>Manage</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            <div className="ml-auto mr-4">
              <CoinBalanceDisplay />
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-black">
            {/* Grid background overlay */}
            {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div> */}
            
            <div className="space-y-10 relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                  <ScissorsIcon className="w-3 h-3 text-white" />
                </div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-white">MANAGE_SCALPING_TOOL</h2>
              </div>
              
              <Card className="border-zinc-800 bg-zinc-900/50 shadow-md">
                <CardContent className="pt-6 space-y-6">
                  <BrokerSelector />
                  
                  {/* Additional Scalping Tool settings can be added here */}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 