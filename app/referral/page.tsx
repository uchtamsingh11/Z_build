'use client'

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
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CoinBalanceDisplay } from "@/components/coin-balance-display"
import { useNotification } from '@/lib/notification'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, 
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  BarChart, 
  Users, 
  DollarSign, 
  History, 
  Share2, 
  Copy, 
  CheckCircle 
} from "lucide-react"

interface Referral {
  id: string
  referred_by: string
  referred_user: string
  amount: number
  paid_at: string
  created_at?: string
  updated_at?: string
  referred_user_email?: string
}

export default function ReferralPage() {
  const router = useRouter()
  const [referralCode, setReferralCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { showNotification } = useNotification()
  const supabase = createClient()
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  
  // Analytics states
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)

  // Fetch current user and their referral code on page load
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        router.push('/auth/login')
        return
      }
      
      console.log('Auth user ID:', authUser.id)
      setUser(authUser)
      
      // Fetch user's profile including referral code
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      console.log('User data from DB:', data, error)
      
      // If user record doesn't exist in users table, create one
      if (error && error.code === 'PGRST116') {
        console.log('User record not found, creating one')
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ 
            id: authUser.id,
            email: authUser.email,
            created_at: new Date()
          }])
          .select()
          
        console.log('Created new user record:', newUser, insertError)
        
        if (insertError) {
          console.error('Error creating user record:', insertError)
          showNotification({
            title: 'Error',
            description: 'Failed to set up user profile',
            type: 'error'
          })
        }
      } else if (data && data.referral) {
        setReferralCode(data.referral)
        
        // If user has a referral code, fetch analytics data
        if (data.referral) {
          fetchReferralAnalytics(data.referral);
        } else {
          setIsAnalyticsLoading(false);
        }
      } else {
        setIsAnalyticsLoading(false);
      }
    }
    
    fetchUserData()
  }, [router])

  // Fetch referral analytics data
  const fetchReferralAnalytics = async (userReferralCode: string) => {
    try {
      setIsAnalyticsLoading(true)
      
      if (!userReferralCode) {
        console.log('No referral code available, skipping analytics fetch')
        setReferrals([])
        setTotalUsers(0)
        setTotalRevenue(0)
        setIsAnalyticsLoading(false)
        return
      }
      
      console.log('Fetching referrals for code:', userReferralCode)
      
      // Fetch all referrals where the current user's code was used
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_by', userReferralCode)
        .order('paid_at', { ascending: false })
        
      if (referralsError) {
        console.error('Error fetching referrals:', referralsError)
        throw referralsError
      }
      
      const safeReferralsData = referralsData || []
      console.log('Fetched referrals data:', safeReferralsData.length, 'records')
      
      // Enhancement: Fetch user emails for referred users
      const referralsWithUserDetails = await Promise.all(
        safeReferralsData.map(async (referral) => {
          try {
            // Get user email for each referred user
            const { data: referredUserData } = await supabase
              .from('users')
              .select('email')
              .eq('id', referral.referred_user)
              .single()
              
            return {
              ...referral,
              referred_user_email: referredUserData?.email || 'Unknown user'
            }
          } catch (err) {
            console.error('Error getting user details:', err)
            return {
              ...referral,
              referred_user_email: 'Unknown user'
            }
          }
        })
      )
      
      setReferrals(referralsWithUserDetails)
      
      // Calculate totals
      setTotalUsers(new Set(safeReferralsData.map(r => r.referred_user)).size)
      setTotalRevenue(safeReferralsData.reduce((sum, referral) => sum + (parseFloat(referral.amount) || 0), 0))
      
    } catch (error: any) {
      console.error('Error fetching referral data:', error)
      // Show a more detailed error if available
      showNotification({
        title: 'Error',
        description: 'Failed to load referral analytics: ' + (error.message || 'Unknown error'),
        type: 'error'
      })
      // Set empty state to prevent UI from breaking
      setReferrals([])
      setTotalUsers(0)
      setTotalRevenue(0)
    } finally {
      setIsAnalyticsLoading(false)
    }
  }

  const handleGenerateReferral = async () => {
    if (!referralCode.trim()) {
      showNotification({
        title: 'Error',
        description: 'Please enter a referral code',
        type: 'error'
      })
      return
    }

    setIsLoading(true)
    
    try {
      // First get the current user data to see if they already have this referral code
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('referral')
        .eq('id', user.id)
        .single()
      
      console.log('Current user data:', currentUser, currentUserError)
      
      // If user is keeping their existing referral code, we can skip the existence check
      if (currentUser && currentUser.referral === referralCode) {
        showNotification({
          title: 'Info',
          description: 'This is already your current referral code',
          type: 'info'
        })
        setIsLoading(false)
        return
      }
      
      console.log('Checking if referral code exists:', referralCode)
      
      // Check if referral code already exists for another user
      const { data: existingReferral, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('referral', referralCode)
        .maybeSingle()
      
      if (checkError) {
        console.error('Check error:', checkError)
        throw checkError
      }
      
      console.log('Existing referral check result:', existingReferral)
      
      if (existingReferral) {
        showNotification({
          title: 'Referral code already taken',
          description: 'Please choose another referral code',
          type: 'error'
        })
        setIsLoading(false)
        return
      }
      
      console.log('Updating referral code for user ID:', user.id)
      
      // Update user's referral code
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ referral: referralCode })
        .eq('id', user.id)
        .select()
      
      console.log('Update result:', updateData, updateError)
      
      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }
      
      // Verify the update was successful by re-fetching the user data
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('referral')
        .eq('id', user.id)
        .single()
      
      console.log('Verification result:', verifyData, verifyError)
        
      if (verifyError || !verifyData || verifyData.referral !== referralCode) {
        console.error('Verification error:', verifyError || 'Referral code not updated')
        throw new Error('Failed to verify referral code update')
      }
      
      showNotification({
        title: 'Success!',
        description: 'Your referral code has been updated',
        type: 'success'
      })
      
      // Fetch analytics data with the new referral code
      fetchReferralAnalytics(referralCode);
      
    } catch (error) {
      console.error('Error setting referral code:', error)
      showNotification({
        title: 'Error',
        description: 'Failed to set referral code. Please try again.',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const copyToClipboard = () => {
    if (referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/sign-up?ref=${referralCode}`)
      setIsLinkCopied(true)
      
      showNotification({
        title: 'Copied!',
        description: 'Referral link copied to clipboard',
        type: 'success'
      })
      
      setTimeout(() => setIsLinkCopied(false), 2000)
    }
  }

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full grid-cols-[auto_1fr] bg-zinc-950 text-zinc-100">
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-zinc-900 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
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
                  <BreadcrumbItem>
                    <BreadcrumbPage>Referral</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            <div className="ml-auto mr-4">
              <CoinBalanceDisplay />
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto bg-black">
            <div className="p-4 md:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">Referrals</h1>
              </div>
              
              <div className="w-full max-w-md mx-auto space-y-6">
                {/* Main referral card */}
                <Card className="border border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 flex items-center justify-center bg-zinc-800 rounded-full">
                        <Share2 className="h-3 w-3 text-white" />
                      </div>
                      <CardTitle className="text-base md:text-lg">Your Referral Code</CardTitle>
                    </div>
                    <CardDescription className="text-xs text-zinc-400 mt-1">
                      Create a unique referral code for others to use
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter your referral code"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                          className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200"
                        />
                        <Button 
                          onClick={handleGenerateReferral}
                          disabled={isLoading}
                          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                        >
                          {isLoading ? 'Generating...' : 'Generate'}
                        </Button>
                      </div>
                      
                      {referralCode && (
                        <div className="mt-2 p-3 md:p-4 bg-zinc-800 rounded-md border border-zinc-700">
                          <p className="text-xs md:text-sm text-zinc-400 mb-1">Share this link with friends:</p>
                          <div className="flex items-center mt-2">
                            <p className="text-xs md:text-sm font-mono bg-zinc-900 p-2 rounded border border-zinc-700 break-all flex-1 truncate">
                              {`${window.location.origin}/sign-up?ref=${referralCode}`}
                            </p>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="ml-2 text-zinc-400 hover:text-white hover:bg-zinc-700"
                              onClick={copyToClipboard}
                            >
                              {isLinkCopied ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Stats summary */}
                {referralCode && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Total Users Card */}
                    <Card className="border border-zinc-800 bg-zinc-900/50">
                      <CardContent className="p-3 md:p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-3.5 w-3.5 text-zinc-400" />
                          <p className="text-xs text-zinc-400">Total Users</p>
                        </div>
                        
                        {isAnalyticsLoading ? (
                          <Skeleton className="h-7 w-12 mt-1" />
                        ) : (
                          <div className="text-xl md:text-2xl font-bold mt-1">{totalUsers}</div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Revenue Card */}
                    <Card className="border border-zinc-800 bg-zinc-900/50">
                      <CardContent className="p-3 md:p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                          <p className="text-xs text-zinc-400">Revenue</p>
                        </div>
                        
                        {isAnalyticsLoading ? (
                          <Skeleton className="h-7 w-20 mt-1" />
                        ) : (
                          <div className="text-xl md:text-2xl font-bold mt-1">${totalRevenue.toFixed(2)}</div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Average Card */}
                    <Card className="border border-zinc-800 bg-zinc-900/50">
                      <CardContent className="p-3 md:p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart className="h-3.5 w-3.5 text-zinc-400" />
                          <p className="text-xs text-zinc-400">Avg. Revenue</p>
                        </div>
                        
                        {isAnalyticsLoading ? (
                          <Skeleton className="h-7 w-20 mt-1" />
                        ) : (
                          <div className="text-xl md:text-2xl font-bold mt-1">
                            ${totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : '0.00'}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {/* Last few referrals */}
                {referralCode && referrals.length > 0 && (
                  <Card className="border border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-center gap-2">
                        <History className="h-3.5 w-3.5 text-zinc-400" />
                        <CardTitle className="text-sm">Recent Referrals</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      {isAnalyticsLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />
                        </div>
                      ) : (
                        <div className="border border-zinc-800 rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-zinc-800/50 hover:bg-zinc-800/70">
                                <TableHead className="text-xs text-zinc-400 font-medium">User</TableHead>
                                <TableHead className="text-right text-xs text-zinc-400 font-medium">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {referrals.slice(0, 3).map((referral) => (
                                <TableRow key={referral.id} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                                  <TableCell className="text-xs py-1.5">
                                    {referral.referred_user_email}
                                  </TableCell>
                                  <TableCell className="text-right text-xs py-1.5">
                                    ${referral.amount.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}