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
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle } from "lucide-react"
import { createStrategy } from "./actions"

export default async function CreateStrategyPage() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError || !userData?.user) {
    redirect('/auth/login')
  }

  // Verify user is an admin
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  // If not an admin user, show unauthorized message
  const isAdmin = !profileError && profileData?.role === 'admin';
  
  if (!isAdmin) {
    return (
      <SidebarProvider>
        <div className="grid min-h-screen w-full grid-cols-[auto_1fr] bg-zinc-950 text-zinc-100 font-mono">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/marketplace">
                        Marketplace
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Create Strategy</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              
              <div className="ml-auto mr-4 flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/my-strategy">Strategy</Link>
                </Button>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <CoinBalanceDisplay />
              </div>
            </header>
            
            <main className="p-6">
              <div className="flex flex-col items-center justify-center max-w-3xl mx-auto py-12">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-semibold mb-3">Access Denied</h1>
                <p className="text-zinc-400 text-center mb-6">
                  Only admin users can create strategies. Please contact an administrator if you need to create a trading strategy.
                </p>
                <Button asChild>
                  <Link href="/marketplace">Return to Marketplace</Link>
                </Button>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full grid-cols-[auto_1fr] bg-zinc-950 text-zinc-100 font-mono">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/marketplace">
                      Marketplace
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Create Strategy</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            <div className="ml-auto mr-4 flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/my-strategy">Strategy</Link>
              </Button>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <CoinBalanceDisplay />
            </div>
          </header>
          
          <main className="p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold">Create a New Strategy</h1>
              <p className="text-zinc-400">Fill in the details to create your custom trading strategy</p>
            </div>
            
            <div className="max-w-3xl">
              <form action={createStrategy}>
                <input type="hidden" name="userId" value={userData.user.id} />
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle>Strategy Information</CardTitle>
                    <CardDescription>Provide the basic information about your strategy</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Strategy Name*</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="Enter strategy name" 
                        className="bg-zinc-800 border-zinc-700"
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description*</Label>
                      <Textarea 
                        id="description" 
                        name="description"
                        placeholder="Describe how your strategy works" 
                        className="min-h-24 bg-zinc-800 border-zinc-700"
                        required 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Strategy Type*</Label>
                        <Select name="type" required>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semi">Semi</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)*</Label>
                        <Input 
                          id="price" 
                          name="price"
                          type="number" 
                          placeholder="99.99" 
                          className="bg-zinc-800 border-zinc-700"
                          min="0"
                          step="0.01"
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="script_code">Pine Script Code*</Label>
                      <Textarea 
                        id="script_code" 
                        name="script_code"
                        placeholder="Paste your Pine Script code here" 
                        className="min-h-72 font-mono text-sm bg-zinc-800 border-zinc-700"
                        required 
                      />
                      <p className="text-xs text-zinc-500">
                        Enter your Pine Script strategy code. Make sure it's valid and tested.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-zinc-800 pt-6">
                    <Button type="button" variant="outline">Cancel</Button>
                    <Button type="submit">Create Strategy</Button>
                  </CardFooter>
                </Card>
              </form>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 