"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { HistoryIcon, ArrowUpIcon, ArrowDownIcon, XIcon, CoinsIcon, ZapIcon, BellIcon } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  transaction_type: string
  created_at: string
  description: string
}

interface ServiceUsage {
  usage_id: string
  service: string
  usage_time: string
  status: string
  coins_deducted: number
  transaction_description: string
}

export function CoinTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [serviceUsage, setServiceUsage] = useState<ServiceUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('transactions')
  
  const fetchHistory = async () => {
    setLoading(true)
    
    try {
      // Use the API endpoint instead of direct Supabase calls
      const response = await fetch('/api/coin-transaction-history')
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history')
      }
      
      const data = await response.json()
      
      setTransactions(data.transactions || [])
      setServiceUsage(data.serviceUsage || [])
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'backtest':
        return <ZapIcon className="h-4 w-4" />
      case 'optimisation':
        return <CoinsIcon className="h-4 w-4" />
      default:
        return <HistoryIcon className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 border-zinc-800 hover:bg-zinc-900 bg-zinc-950 text-white"
        >
          <BellIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-black border border-zinc-800 text-white p-0 font-mono">
        <DialogHeader className="px-6 py-4 border-b border-zinc-900 bg-zinc-950">
          <DialogTitle className="text-sm uppercase tracking-wider flex items-center font-mono">
            <BellIcon className="h-4 w-4 mr-2" />
            Notifications
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 text-zinc-500 hover:text-white">
            <XIcon className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>
        
        <Tabs defaultValue="transactions" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 bg-zinc-950 border-b border-zinc-900 p-0">
            <TabsTrigger 
              value="transactions" 
              className={`py-3 rounded-none font-mono text-xs uppercase ${activeTab === 'transactions' ? 'text-white border-b-2 border-white' : 'text-zinc-500'}`}
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className={`py-3 rounded-none font-mono text-xs uppercase ${activeTab === 'services' ? 'text-white border-b-2 border-white' : 'text-zinc-500'}`}
            >
              Services Used
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="mt-0">
            <div className="max-h-[400px] overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                  <span className="ml-2 text-xs text-zinc-500">Loading history...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No transactions found
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-xs hover:bg-zinc-900"
                    >
                      <div className="flex items-start">
                        {transaction.amount > 0 ? (
                          <div className="flex items-center justify-center w-8 h-8 bg-emerald-500/10 rounded-full mr-3 text-emerald-500">
                            <ArrowUpIcon className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-8 h-8 bg-red-500/10 rounded-full mr-3 text-red-500">
                            <ArrowDownIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div className="text-white">
                            {transaction.description || (transaction.amount > 0 ? 'Coin Purchase' : 'Service Charge')}
                          </div>
                          <div className="text-zinc-500 text-[10px] mt-1">
                            {formatDate(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className={`font-medium ${transaction.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="services" className="mt-0">
            <div className="max-h-[400px] overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                  <span className="ml-2 text-xs text-zinc-500">Loading history...</span>
                </div>
              ) : serviceUsage.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No service usage found
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceUsage.map((usage) => (
                    <div 
                      key={usage.usage_id} 
                      className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-xs hover:bg-zinc-900"
                    >
                      <div className="flex items-start">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-500/10 rounded-full mr-3 text-blue-500">
                          {getServiceIcon(usage.service)}
                        </div>
                        <div>
                          <div className="text-white">
                            {usage.service.charAt(0).toUpperCase() + usage.service.slice(1)} Service
                          </div>
                          <div className="text-zinc-500 text-[10px] mt-1">
                            {formatDate(usage.usage_time)}
                          </div>
                        </div>
                      </div>
                      <div className="text-red-500 font-medium">
                        {usage.coins_deducted ? `-${Math.abs(usage.coins_deducted)}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 