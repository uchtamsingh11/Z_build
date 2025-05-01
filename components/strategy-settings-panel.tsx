"use client"

import * as React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input" 
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface StrategySettingsPanelProps {
  isBacktest?: boolean; // If true, shows backtest-specific settings
  onSettingsChange?: (settings: StrategySettings) => void;
}

interface StrategySettings {
  timeframe: {
    value: string;
    customValue?: number;
    customUnit?: string;
  };
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  entryExitRules: string;
  slippage: number;
  slippageUnit: 'ticks' | 'percent';
  commission: number;
  capital: number;
  // Additional strategy parameters can be added here
}

export function StrategySettingsPanel({ 
  isBacktest = false,
  onSettingsChange
}: StrategySettingsPanelProps) {
  const [settings, setSettings] = useState<StrategySettings>({
    timeframe: { value: "1h" },
    dateRange: { from: undefined, to: undefined },
    entryExitRules: "",
    slippage: 1,
    slippageUnit: 'ticks',
    commission: 0.1,
    capital: 10000
  })
  
  const [showCustomTimeframe, setShowCustomTimeframe] = useState(false)
  
  const handleTimeframeChange = (value: string) => {
    if (value === "custom") {
      setShowCustomTimeframe(true)
      setSettings({
        ...settings,
        timeframe: { ...settings.timeframe, value }
      })
    } else {
      setShowCustomTimeframe(false)
      setSettings({
        ...settings,
        timeframe: { value }
      })
    }
    
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        timeframe: { value }
      })
    }
  }
  
  const handleCustomTimeframeChange = (field: 'customValue' | 'customUnit', value: any) => {
    const newSettings = {
      ...settings,
      timeframe: { ...settings.timeframe, [field]: value }
    }
    setSettings(newSettings)
    
    if (onSettingsChange) {
      onSettingsChange(newSettings)
    }
  }
  
  const handleDateRangeChange = (field: 'from' | 'to', date: Date | undefined) => {
    // Create a new dateRange object with the updated field
    const newDateRange = { 
      ...settings.dateRange,
      [field]: date 
    } as { from: Date | undefined; to: Date | undefined }
    
    // Update settings with the new dateRange
    const newSettings = {
      ...settings,
      dateRange: newDateRange
    }
    
    setSettings(newSettings)
    
    if (onSettingsChange) {
      onSettingsChange(newSettings)
    }
  }
  
  const handleSettingChange = (field: keyof StrategySettings, value: any) => {
    const newSettings = { ...settings, [field]: value }
    setSettings(newSettings)
    
    if (onSettingsChange) {
      onSettingsChange(newSettings)
    }
  }
  
  return (
    <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono uppercase tracking-wider text-white">
          Strategy Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeframe Selection */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider block text-zinc-500 font-mono">
            Timeframe:
          </Label>
          <Select 
            value={settings.timeframe.value} 
            onValueChange={handleTimeframeChange}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700">
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono">
              <SelectItem value="tick">Tick</SelectItem>
              <SelectItem value="1m">1 Minute</SelectItem>
              <SelectItem value="3m">3 Minutes</SelectItem>
              <SelectItem value="5m">5 Minutes</SelectItem>
              <SelectItem value="15m">15 Minutes</SelectItem>
              <SelectItem value="30m">30 Minutes</SelectItem>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="4h">4 Hours</SelectItem>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          {showCustomTimeframe && (
            <div className="flex space-x-2 mt-2">
              <Input
                type="number"
                min={1}
                value={settings.timeframe.customValue || ""}
                onChange={(e) => handleCustomTimeframeChange('customValue', Number(e.target.value))}
                className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700 w-1/2"
              />
              <Select 
                value={settings.timeframe.customUnit || "Minutes"} 
                onValueChange={(value) => handleCustomTimeframeChange('customUnit', value)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700 w-1/2">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono">
                  <SelectItem value="Minutes">Minutes</SelectItem>
                  <SelectItem value="Hours">Hours</SelectItem>
                  <SelectItem value="Days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Date Range Selector (for both Backtest and Optimization) */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider block text-zinc-500 font-mono">
            {isBacktest ? "Backtest Date Range:" : "Optimization Date Range:"}
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Date */}
            <div className="space-y-1">
              <Label className="text-xs text-zinc-500">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between bg-zinc-900 border-zinc-800 text-zinc-300 font-mono hover:bg-zinc-800 hover:text-white focus:ring-0",
                      !settings.dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    {settings.dateRange?.from ? (
                      format(settings.dateRange.from, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                  <Calendar
                    mode="single"
                    selected={settings.dateRange?.from}
                    onSelect={(date) => handleDateRangeChange('from', date)}
                    initialFocus
                    classNames={{
                      day_button: "text-zinc-300",
                      day: "text-zinc-300"
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* To Date */}
            <div className="space-y-1">
              <Label className="text-xs text-zinc-500">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between bg-zinc-900 border-zinc-800 text-zinc-300 font-mono hover:bg-zinc-800 hover:text-white focus:ring-0",
                      !settings.dateRange?.to && "text-muted-foreground"
                    )}
                  >
                    {settings.dateRange?.to ? (
                      format(settings.dateRange.to, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                  <Calendar
                    mode="single"
                    selected={settings.dateRange?.to}
                    onSelect={(date) => handleDateRangeChange('to', date)}
                    initialFocus
                    classNames={{
                      day_button: "text-zinc-300",
                      day: "text-zinc-300"
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <Separator className="border-zinc-800" />
        
        {/* Shared Settings Block */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-mono">Strategy Parameters</h3>
          
          {/* Entry/Exit Rules */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500">Entry/Exit Rules</Label>
            <Input 
              placeholder="e.g., Long when price crosses above moving average..."
              value={settings.entryExitRules}
              onChange={(e) => handleSettingChange('entryExitRules', e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slippage */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">Slippage</Label>
              <div className="flex space-x-2">
                <Input 
                  type="number"
                  min={0}
                  step={0.1}
                  value={settings.slippage}
                  onChange={(e) => handleSettingChange('slippage', Number(e.target.value))}
                  className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700"
                />
                <Select 
                  value={settings.slippageUnit} 
                  onValueChange={(value: 'ticks' | 'percent') => handleSettingChange('slippageUnit', value)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700 w-1/2">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono">
                    <SelectItem value="ticks">Ticks</SelectItem>
                    <SelectItem value="percent">Percent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Commission */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">Commission (%)</Label>
              <Input 
                type="number"
                min={0}
                step={0.01}
                value={settings.commission}
                onChange={(e) => handleSettingChange('commission', Number(e.target.value))}
                className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700"
              />
            </div>
          </div>
          
          {/* Capital Allocation */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500">Capital Allocation</Label>
            <Input 
              type="number"
              min={0}
              value={settings.capital}
              onChange={(e) => handleSettingChange('capital', Number(e.target.value))}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 