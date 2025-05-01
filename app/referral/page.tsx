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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full grid-cols-[auto_1fr] bg-zinc-950 text-zinc-100">
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
          
          <div className="flex-1 px-4 py-6 bg-black min-h-screen relative">
          {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div> */}
            <h1 className="text-3xl font-bold mb-6">Referrals</h1>
            
            <Tabs defaultValue="manage" className="w-full">
              <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                <TabsTrigger value="manage">Manage Code</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manage" className="mt-6">
                <Card className="w-full max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle>Your Referral Code</CardTitle>
                    <CardDescription>
                      Create a unique referral code for others to use
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter your referral code"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleGenerateReferral}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Generating...' : 'Generate'}
                        </Button>
                      </div>
                      
                      {referralCode && (
                        <div className="mt-4 p-4 bg-zinc-900 rounded-md">
                          <p className="text-sm text-zinc-400 mb-1">Share this link with friends:</p>
                          <p className="text-sm font-mono bg-zinc-800 p-2 rounded border border-zinc-700 break-all">
                            {`${window.location.origin}/sign-up?ref=${referralCode}`}
                          </p>
                        </div>
                      )}

                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-6">
                {!referralCode ? (
                  <Card>
                    <CardContent className="p-6 flex items-center justify-center">
                      <p className="text-zinc-400">Please generate a referral code first</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                      {/* Summary Cards */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total Users Referred
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isAnalyticsLoading ? (
                            <Skeleton className="h-10 w-20" />
                          ) : (
                            <div className="text-3xl font-bold">{totalUsers}</div>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total Revenue Generated
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isAnalyticsLoading ? (
                            <Skeleton className="h-10 w-28" />
                          ) : (
                            <div className="text-3xl font-bold">
                              ${totalRevenue.toFixed(2)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Avg. Revenue Per Referral
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isAnalyticsLoading ? (
                            <Skeleton className="h-10 w-24" />
                          ) : (
                            <div className="text-3xl font-bold">
                              ${totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : '0.00'}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Referrals Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Referral History</CardTitle>
                        <CardDescription>
                          All users who signed up using your referral code
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isAnalyticsLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                          </div>
                        ) : referrals.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {referrals.map((referral) => (
                                <TableRow key={referral.id}>
                                  <TableCell className="font-medium">
                                    {referral.referred_user_email}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    {formatDate(referral.paid_at)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ${referral.amount.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-6 text-zinc-500">
                            No referrals found. Share your referral code to get started!
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}