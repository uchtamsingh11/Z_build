"use client"

import { InfoIcon, Coins } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ServicePriceInfoProps {
  service: 'backtest' | 'optimisation'
}

export function ServicePriceInfo({ service }: ServicePriceInfoProps) {
  const serviceData = {
    'backtest': {
      price: 50,
      description: 'Run a complete backtest on your strategy'
    },
    'optimisation': {
      price: 500,
      description: 'Run a complete parameter optimization for your strategy'
    }
  }
  
  const data = serviceData[service]
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center text-xs text-zinc-400 cursor-help">
            <Coins className="h-3 w-3 mr-1" />
            <span>{data.price} coins</span>
            <InfoIcon className="h-3 w-3 ml-1 text-zinc-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-zinc-950 border border-zinc-800 text-white text-xs p-3">
          <div className="max-w-[200px]">
            <div className="font-medium mb-1">Service Cost: {data.price} coins</div>
            <div className="text-zinc-400">{data.description}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 