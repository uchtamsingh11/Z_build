"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ClipboardCopyIcon, RefreshCwIcon, Trash2Icon, PlusIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react"
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
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <AlertCircleIcon className="w-12 h-12 text-zinc-600" />
        <h3 className="text-lg font-semibold">No webhooks found</h3>
        <p className="text-zinc-400 text-center max-w-md">
          You don't have any webhooks set up yet. Create one to receive order requests from TradingView.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-2">
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your TradingView Webhooks</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-xs">
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

      <div className="border border-zinc-800 rounded-md">
        <Tabs 
          value={selectedTabId} 
          onValueChange={setSelectedTabId}
          className="w-full"
        >
          <div className="border-b border-zinc-800">
            <TabsList className="bg-zinc-900 p-0">
              {localWebhooks.map(webhook => (
                <TabsTrigger 
                  key={webhook.id}
                  value={webhook.id}
                  className="data-[state=active]:bg-zinc-800 px-4 py-2 rounded-none border-r border-zinc-800 last:border-r-0"
                >
                  <span className="text-xs truncate max-w-[150px]">
                    {webhook.description || `Webhook ${webhook.id.substring(0, 6)}`}
                  </span>
                  {webhook.is_active ? (
                    <Badge className="ml-2 bg-green-800 text-white hover:bg-green-700">Active</Badge>
                  ) : (
                    <Badge className="ml-2 bg-zinc-700 text-zinc-300 hover:bg-zinc-600">Inactive</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {localWebhooks.map(webhook => (
            <TabsContent key={webhook.id} value={webhook.id} className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Webhook URL</Label>
                  <div className="flex space-x-2">
                    <Switch 
                      checked={webhook.is_active} 
                      onCheckedChange={() => handleToggleActive(webhook)}
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2Icon className="h-4 w-4" />
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
                <div className="flex">
                  <Input 
                    value={`${apiBaseUrl}/api/webhook/trading-view/${webhook.token}`}
                    readOnly
                    className="bg-zinc-800 border-zinc-700 text-zinc-300"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="ml-2"
                    onClick={() => handleCopy(`${apiBaseUrl}/api/webhook/trading-view/${webhook.token}`, webhook.id)}
                  >
                    {copied[webhook.id] ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClipboardCopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-mono">WEBHOOK_STATUS</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
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

                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-mono">USAGE_COUNT</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <span className="text-sm">{webhook.request_count} requests</span>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4">
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-mono">WEBHOOK_DETAILS</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
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
              </div>

              <div className="mt-6 p-4 bg-zinc-800/30 border border-zinc-700 rounded-md">
                <h3 className="font-semibold mb-2">How to use with TradingView</h3>
                <p className="text-sm text-zinc-300 mb-4">
                  Copy this webhook URL and paste it in TradingView's alert settings.
                  Your JSON payload should include these fields:
                </p>
                <pre className="bg-zinc-900 p-3 rounded text-xs overflow-x-auto text-green-300">
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
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
} 