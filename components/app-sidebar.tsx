"use client"

import * as React from "react"
import {
  BarChartBig,
  BookOpen,
  Bot,
  CircleDollarSign,
  Command,
  Copy,
  DollarSign,
  ExternalLink,
  FileJson,
  Frame,
  GalleryVerticalEnd,
  HelpCircle,
  History,
  Key,
  LineChart,
  Map,
  PieChart,
  ScrollText,
  Search,
  Settings2,
  Share2,
  ShoppingBag,
  SquareTerminal,
  Tag,
  Webhook
} from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from '@/lib/supabase/client'

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const defaultData = {
  user: {
    name: "User",
    email: "loading@example.com",
    avatar: "https://ui-avatars.com/api/?name=User&background=random",
  },
  teams: [
    {
      name: "AlgoZ Tech",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: Command,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: PieChart,
      isActive: true,
    },
    {
      title: "Charts",
      url: "/charts",
      icon: BarChartBig,
    },
    {
      title: "Broker Auth",
      url: "/broker-auth",
      icon: Key,
    },
    {
      title: "Assistant",
      url: "/assistant",
      icon: Bot,
    },
    {
      title: "TradingView",
      url: "#",
      icon: LineChart,
      items: [
        {
          title: "Manage",
          url: "/tradingview/manage",
        },
        {
          title: "Webhook URL",
          url: "/tradingview/webhook-url",
        },
        {
          title: "JSON",
          url: "/tradingview/json",
        },
        {
          title: "Symbol",
          url: "/tradingview/symbol",
        },
        {
          title: "Trade Logs",
          url: "/tradingview/trade-logs",
        },
      ],
    },
    {
      title: "Scalping Tool",
      url: "#",
      icon: BarChartBig,
      items: [
        {
          title: "Manage",
          url: "/scalping-tool/manage",
        },
      ],
    },
    {
      title: "Copy Trading",
      url: "#",
      icon: Copy,
      items: [
        {
          title: "Manage",
          url: "/copy-trading/manage",
        },
      ],
    },
    {
      title: "Marketplace",
      url: "/marketplace",
      icon: ShoppingBag,
    },
    {
      title: "Backtest",
      url: "/backtest",
      icon: History,
    },
    {
      title: "Optimization",
      url: "/optimization",
      icon: Settings2,
    },
    {
      title: "My Developer",
      url: "/my-developer",
      icon: Bot,
    },
    {
      title: "Pricing",
      url: "/pricing",
      icon: DollarSign,
    },
    {
      title: "Referral",
      url: "/referral",
      icon: Share2,
    },
    {
      title: "Support",
      url: "/support",
      icon: HelpCircle,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userData, setUserData] = useState(defaultData)
  const [loading, setLoading] = useState(true)
  
  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error fetching user:', error)
        return
      }
      
      if (data?.user) {
        // Try to get profile from users table first
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', data.user.id)
          .single()
          
        // Update user data with real values
        setUserData({
          ...defaultData,
          user: {
            name: userData?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || 'No email',
            avatar: userData?.avatar_url || data.user.user_metadata?.avatar_url ,
          }
        })
      }
    } catch (err) {
      console.error('Error in fetchUserData:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Subscribe to auth state changes
  useEffect(() => {
    fetchUserData()
    
    const supabase = createClient()
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchUserData()
    })
    
    // Set up listener for user profile updates
    const setupUserListener = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      
      const channel = supabase
        .channel('user-profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`,
          },
          () => {
            fetchUserData()
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
    
    const unsubscribePromise = setupUserListener()
    
    return () => {
      // Clean up auth listener
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
      
      // Clean up DB listener
      if (unsubscribePromise) {
        unsubscribePromise.then(unsubFn => {
          if (unsubFn) unsubFn()
        })
      }
    }
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={userData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={userData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
