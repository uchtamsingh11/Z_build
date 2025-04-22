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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Headset, MessageSquare, Phone, TerminalIcon } from "lucide-react"
import Link from "next/link"

export default async function Page() {
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
                    <BreadcrumbPage>Support</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            <div className="ml-auto mr-4">
              <CoinBalanceDisplay />
            </div>
          </header>
          
          {/* Grid background overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
          
          {/* Console header */}
          <div className="border-b border-zinc-900 p-3 text-zinc-500 text-xs flex items-center bg-zinc-950 sticky top-0 z-10 mb-8">
            <div className="mr-auto flex items-center">
              <TerminalIcon className="w-4 h-4 mr-2" />
              <span>SYSTEM:SUPPORT</span>
            </div>
            <div>ACTIVE</div>
            <div className="ml-4 px-2 py-0.5 bg-zinc-950 border border-zinc-900 text-zinc-400">SESSION_ID: {sessionId}</div>
          </div>
          
          <div className="relative z-10 px-4">
            <div className="flex items-center mb-6">
              <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
                <Headset className="w-3 h-3 text-white" />
              </div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-white">CUSTOMER_SUPPORT</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* WhatsApp Support */}
              <Card className="border-zinc-800 bg-zinc-900/50 shadow-md">
                <CardHeader>
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-white font-mono">WHATSAPP_SUPPORT</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Connect with our support team directly via WhatsApp for quick resolution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400 text-sm mb-4">
                    Our support team is available from 9:00 AM to 6:00 PM UTC, Monday through Friday
                  </p>
                  <div className="bg-zinc-800 p-3 rounded-md mb-4 font-mono">
                    <div className="text-xs text-zinc-500">CONTACT_ID</div>
                    <div className="text-sm text-white">+91 9241740350</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white" asChild>
                    <Link href="https://wa.me/919241740350" target="_blank">CONNECT_VIA_WHATSAPP</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Telegram Support */}
              <Card className="border-zinc-800 bg-zinc-900/50 shadow-md">
                <CardHeader>
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.2647 2.25982C21.8967 1.93982 21.1297 1.74982 19.9997 1.74982C19.0573 1.75103 18.1203 1.88258 17.2187 2.13982C14.8297 2.88982 3.69873 7.42982 1.77473 8.28982C0.66673 8.76982 0.01673 9.72982 0.09573 10.8158C0.16673 11.8098 0.87673 12.6538 1.93173 12.9558L6.09973 14.0718C6.34473 14.8988 7.46973 18.6198 7.78373 19.6498C7.98273 20.3198 8.35673 21.1178 9.03473 21.2578C9.63073 21.4228 10.2247 21.1678 10.6397 20.7518L12.9787 18.4278L16.9877 21.4988C17.1647 21.6398 17.3537 21.7508 17.5527 21.8408C17.8233 21.9632 18.1167 22.0264 18.4147 22.0258C19.4027 22.0258 19.9567 21.0058 20.0967 20.4818L22.9217 4.44982C23.1497 3.28982 22.8047 2.69982 22.2647 2.25982ZM9.74773 14.3098L8.08773 18.1538L7.50273 13.9038L17.2467 6.75982L9.74773 14.3098Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <CardTitle className="text-lg text-white font-mono">TELEGRAM_SUPPORT</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Get help through our official Telegram channel with fast response times
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400 text-sm mb-4">
                    Our Telegram support operates 24/7 with dedicated agents ready to assist you
                  </p>
                  <div className="bg-zinc-800 p-3 rounded-md mb-4 font-mono">
                    <div className="text-xs text-zinc-500">CHANNEL_ID</div>
                    <div className="text-sm text-white">@AlgoZsupport1</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white" asChild>
                    <Link href="https://t.me/AlgoZsupport1" target="_blank">JOIN_TELEGRAM_CHANNEL</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Phone Support */}
              <Card className="border-zinc-800 bg-zinc-900/50 shadow-md">
                <CardHeader>
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-white font-mono">PHONE_SUPPORT</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Speak directly with our support specialists for complex issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400 text-sm mb-4">
                    Priority phone support available for verified users during business hours
                  </p>
                  <div className="bg-zinc-800 p-3 rounded-md mb-4 font-mono">
                    <div className="text-xs text-zinc-500">SUPPORT_LINE</div>
                    <div className="text-sm text-white">+91 9241740350</div>
                  </div>
                  <div className="bg-zinc-800 p-3 rounded-md mb-4 font-mono">
                    <div className="text-xs text-zinc-500">OPERATING_HOURS</div>
                    <div className="text-sm text-white">MON-FRI: 8AM-8PM ET</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white" asChild>
                    <Link href="tel:+919241740350">CALL_SUPPORT</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mt-8 p-4 border border-zinc-800 rounded-md bg-zinc-900/30">
              <div className="flex items-center mb-2">
                <TerminalIcon className="w-4 h-4 mr-2 text-zinc-500" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-400">SUPPORT_INFO</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-2">
                Our support team is available to assist you with any questions or issues you may encounter while using our platform.
              </p>
              <p className="text-zinc-400 text-sm">
                For security concerns or account issues, please use the secure messaging options above rather than sharing sensitive information.
              </p>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 