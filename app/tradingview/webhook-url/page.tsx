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
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, TerminalIcon, Link2Icon, ClipboardCopyIcon, AlertTriangleIcon, RefreshCwIcon, ToggleLeftIcon, ToggleRightIcon, Trash2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WebhookManager } from "@/components/webhook/webhook-manager"
import crypto from 'crypto'

// Helper to generate a random token
const generateToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

export default async function Page() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  // Get or create a webhook for the user
  let { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', data.user.id)
    .order('created_at', { ascending: false });

  // If no webhook exists, create one
  if (!webhooks || webhooks.length === 0) {
    const newToken = generateToken();
    
    await supabase
      .from('webhooks')
      .insert({
        user_id: data.user.id,
        token: newToken,
        description: 'Default TradingView webhook'
      });
    
    // Refresh webhooks list
    const { data: refreshedWebhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', data.user.id)
      .order('created_at', { ascending: false });
      
    if (refreshedWebhooks) {
      webhooks = refreshedWebhooks;
    }
  }

  // Get the API base URL from environment or default
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
    `${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000'}`;

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
                  <BreadcrumbItem className="hidden md:block font-mono text-xs uppercase tracking-wider">
                    <BreadcrumbLink href="/tradingview">
                      TradingView
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="font-mono text-xs uppercase tracking-wider">
                    <BreadcrumbPage>Webhook URL</BreadcrumbPage>
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
                  <Link2Icon className="w-3 h-3 text-white" />
                </div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-white">WEBHOOK_URL</h2>
              </div>
              
              <Card className="border-zinc-800 bg-zinc-900/50 shadow-md">
                <CardContent className="pt-6 space-y-6">
                  <WebhookManager 
                    webhooks={webhooks || []} 
                    apiBaseUrl={apiBaseUrl} 
                    userId={data.user.id} 
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 