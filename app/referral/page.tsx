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
import { Card, CardContent } from "@/components/ui/card"

export default function ReferralPage() {
  const router = useRouter()
  const [referralCode, setReferralCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { showNotification } = useNotification()
  const supabase = createClient()

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
      }
    }
    
    fetchUserData()
  }, [router])

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
          
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <Card className="w-full max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-center">Your Referral Code</h2>
                    <p className="text-sm text-zinc-400 text-center">
                      Create a unique referral code for others to use
                    </p>
                  </div>
                  
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
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}