"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ClipboardCopyIcon, RefreshCwIcon, Trash2Icon, PlusIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon, ActivityIcon, HistoryIcon, CodeIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format, formatDistanceToNow } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define the webhook type
interface Webhook {
  id: string
  user_id: string
  token: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_used_at: string | null
  request_count: number
}

interface WebhookManagerProps {
  webhooks: Webhook[]
  apiBaseUrl: string
  userId: string
}

export function WebhookManager({ webhooks, apiBaseUrl, userId }: WebhookManagerProps) {
  const [localWebhooks, setLocalWebhooks] = useState<Webhook[]>(webhooks)
  const [newWebhookDescription, setNewWebhookDescription] = useState('')
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false)
  const [selectedTabId, setSelectedTabId] = useState(webhooks[0]?.id || "")
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  const handleCopy = (text: string, webhookId: string) => {
    navigator.clipboard.writeText(text)
    setCopied({ ...copied, [webhookId]: true })
    setTimeout(() => {
      setCopied({ ...copied, [webhookId]: false })
    }, 2000)
  }

  const handleToggleActive = async (webhook: Webhook) => {
    const { data, error } = await supabase
      .from('webhooks')
      .update({ is_active: !webhook.is_active })
      .eq('id', webhook.id)
      .select()
      .single()

    if (!error && data) {
      setLocalWebhooks(
        localWebhooks.map(w => 
          w.id === webhook.id ? { ...w, is_active: !w.is_active } : w
        )
      )
    }
  }

  const handleDelete = async (webhookId: string) => {
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)

    if (!error) {
      setLocalWebhooks(localWebhooks.filter(w => w.id !== webhookId))
      if (selectedTabId === webhookId && localWebhooks.length > 1) {
        setSelectedTabId(localWebhooks.filter(w => w.id !== webhookId)[0].id)
      }
    }
  }

  const handleCreateWebhook = async () => {
    setIsCreatingWebhook(true)
    
    try {
      // Generate random token on the client - we'll let backend regenerate for security
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: userId,
          token: Math.random().toString(36).substring(2) + Date.now().toString(36),
          description: newWebhookDescription || 'TradingView webhook'
        })
        .select()
        .single()

      if (error) throw error

      // Refresh webhooks
      const { data: refreshedWebhooks } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (refreshedWebhooks) {
        setLocalWebhooks(refreshedWebhooks)
        setSelectedTabId(refreshedWebhooks[0].id)
      }
      
      setNewWebhookDescription('')
    } catch (error) {
      console.error('Error creating webhook:', error)
    } finally {
      setIsCreatingWebhook(false)
    }
  }

  const getWebhookStatus = (webhook: Webhook) => {
    if (!webhook.is_active) return 'inactive'
    if (!webhook.last_used_at) return 'unused'
    return 'active'
  }

  if (localWebhooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 md:p-6 space-y-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 shadow-md">
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <AlertCircleIcon className="w-12 h-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold">No webhooks found</h3>
            <p className="text-zinc-400 text-center max-w-md mt-2 mb-4">
              You don't have any webhooks set up yet. Create one to receive order requests from TradingView.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white border-zinc-800">
                <DialogHeader>
                  <DialogTitle>Create new webhook</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Generate a new webhook URL for your TradingView alerts.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      placeholder="My TradingView Webhook"
                      className="col-span-3 bg-zinc-800 border-zinc-700"
                      value={newWebhookDescription}
                      onChange={(e) => setNewWebhookDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreateWebhook}
                    disabled={isCreatingWebhook}
                  >
                    {isCreatingWebhook ? 'Creating...' : 'Create webhook'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h2 className="text-lg md:text-xl font-semibold">Your TradingView Webhooks</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <PlusIcon className="w-3 h-3 mr-1" />
              New webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white border-zinc-800">
            <DialogHeader>
              <DialogTitle>Create new webhook</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Generate a new webhook URL for your TradingView alerts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="My TradingView Webhook"
                  className="col-span-3 bg-zinc-800 border-zinc-700"
                  value={newWebhookDescription}
                  onChange={(e) => setNewWebhookDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateWebhook}
                disabled={isCreatingWebhook}
              >
                {isCreatingWebhook ? 'Creating...' : 'Create webhook'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50 shadow-md overflow-hidden">
        <Tabs 
          value={selectedTabId} 
          onValueChange={setSelectedTabId}
          className="w-full"
        >
          <CardHeader className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <div className="overflow-x-auto -mx-4 px-4 pb-1">
              <TabsList className="bg-transparent p-0 h-auto flex">
                {localWebhooks.map(webhook => (
                  <TabsTrigger 
                    key={webhook.id}
                    value={webhook.id}
                    className="data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm px-3 py-1.5 text-xs rounded-md"
                  >
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">
                      {webhook.description || `Webhook ${webhook.id.substring(0, 6)}`}
                    </span>
                    <Badge 
                      className={`ml-2 ${webhook.is_active 
                        ? 'bg-green-800 text-white hover:bg-green-700' 
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
                      variant="secondary"
                    >
                      {webhook.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {localWebhooks.map(webhook => (
              <TabsContent key={webhook.id} value={webhook.id} className="mt-0 space-y-4 p-4">
                {/* Webhook URL Card */}
                <Card className="border border-zinc-800 bg-zinc-800/30 shadow-sm">
                  <CardHeader className="p-3 pb-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertCircleIcon className="h-4 w-4 text-zinc-400" />
                        <CardTitle className="text-sm">Webhook URL</CardTitle>
                      </div>
                      <div className="flex space-x-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">Active</span>
                          <Switch 
                            checked={webhook.is_active} 
                            onCheckedChange={() => handleToggleActive(webhook)}
                          />
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-zinc-400 hover:text-red-500"
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-900 text-white border-zinc-800">
                            <DialogHeader>
                              <DialogTitle>Delete webhook</DialogTitle>
                              <DialogDescription className="text-zinc-400">
                                Are you sure you want to delete this webhook? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4">
                              <Button 
                                variant="destructive" 
                                onClick={() => handleDelete(webhook.id)}
                              >
                                Delete webhook
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <CardDescription className="mt-1 text-xs text-zinc-500">
                      Use this URL to receive alerts from TradingView
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="flex">
                      <Input 
                        value={`${apiBaseUrl}/api/webhook/trading-view/${webhook.token}`}
                        readOnly
                        className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs h-9"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="ml-2 h-9 w-9 shrink-0"
                        onClick={() => handleCopy(`${apiBaseUrl}/api/webhook/trading-view/${webhook.token}`, webhook.id)}
                      >
                        {copied[webhook.id] ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ClipboardCopyIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border border-zinc-800 bg-zinc-800/30 shadow-sm">
                    <CardHeader className="p-3 pb-0 flex flex-row items-center space-y-0 gap-2">
                      <ActivityIcon className="h-4 w-4 text-zinc-400" />
                      <CardTitle className="text-xs font-medium text-zinc-300">Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 mr-2 rounded-full ${
                          webhook.is_active 
                            ? 'bg-green-500' 
                            : 'bg-zinc-500'
                        }`}></div>
                        <span className="text-sm">
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-zinc-800 bg-zinc-800/30 shadow-sm">
                    <CardHeader className="p-3 pb-0 flex flex-row items-center space-y-0 gap-2">
                      <HistoryIcon className="h-4 w-4 text-zinc-400" />
                      <CardTitle className="text-xs font-medium text-zinc-300">Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <span className="text-sm">{webhook.request_count} requests</span>
                    </CardContent>
                  </Card>
                </div>

                {/* Details Card */}
                <Card className="border border-zinc-800 bg-zinc-800/30 shadow-sm">
                  <CardHeader className="p-3 pb-0 flex flex-row items-center space-y-0 gap-2">
                    <InfoIcon className="h-4 w-4 text-zinc-400" />
                    <CardTitle className="text-xs font-medium text-zinc-300">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div className="text-zinc-400">Created</div>
                      <div>{format(new Date(webhook.created_at), 'MMM d, yyyy h:mm a')}</div>
                      
                      <div className="text-zinc-400">Last updated</div>
                      <div>{format(new Date(webhook.updated_at), 'MMM d, yyyy h:mm a')}</div>
                      
                      <div className="text-zinc-400">Last used</div>
                      <div>
                        {webhook.last_used_at 
                          ? `${formatDistanceToNow(new Date(webhook.last_used_at))} ago` 
                          : 'Never used'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* How To Use Card */}
                <Card className="border border-zinc-800 bg-zinc-800/30 shadow-sm">
                  <CardHeader className="p-3 pb-0 flex flex-row items-center space-y-0 gap-2">
                    <CodeIcon className="h-4 w-4 text-zinc-400" />
                    <CardTitle className="text-xs font-medium text-zinc-300">How to use with TradingView</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <p className="text-xs text-zinc-300 mb-3">
                      Copy this webhook URL and paste it in TradingView's alert settings.
                      Your JSON payload should include these fields:
                    </p>
                    <div className="bg-zinc-900 p-3 rounded text-xs overflow-x-auto">
                      <pre className="text-green-300 whitespace-pre-wrap">
{`{
  "symbol": "NSE:RELIANCE-EQ",
  "action": "BUY",        // or "SELL"
  "quantity": 1,
  "orderType": "MARKET",  // or "LIMIT", "SL", "SL-M"
  "price": 2500,          // required for LIMIT and SL orders
  "triggerPrice": 2450,   // required for SL and SL-M orders
  "productType": "INTRADAY" // or "DELIVERY", "MARGIN", etc.
}`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
} 