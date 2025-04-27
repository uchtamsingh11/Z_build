"use client"

import { useState, useEffect } from 'react'
import { AlertCircleIcon, XIcon } from 'lucide-react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ServiceValidationErrorProps {
  isOpen: boolean
  onClose: () => void
  service: 'backtest' | 'optimisation'
  requiredCoins: number
  currentBalance: number
}

export function ServiceValidationError({
  isOpen,
  onClose,
  service,
  requiredCoins,
  currentBalance
}: ServiceValidationErrorProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-black border border-zinc-800 text-white p-0 font-mono">
        <AlertDialogHeader className="px-6 py-4 border-b border-zinc-900 bg-zinc-950">
          <AlertDialogTitle className="text-sm uppercase tracking-wider flex items-center font-mono">
            <AlertCircleIcon className="h-4 w-4 mr-2 text-red-500" />
            Insufficient Coins
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="px-6 py-6">
          <div className="text-white mb-4">
            You don't have enough coins to use the {service === 'backtest' ? 'Backtest' : 'Optimisation'} service.
          </div>
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="flex justify-between mb-2 text-xs">
              <span className="text-zinc-400">Required coins:</span>
              <span className="text-white">{requiredCoins}</span>
            </div>
            <div className="flex justify-between mb-2 text-xs">
              <span className="text-zinc-400">Your balance:</span>
              <span className={currentBalance > 0 ? "text-white" : "text-red-500"}>{currentBalance}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-zinc-800 pt-2 mt-2">
              <span className="text-zinc-400">Missing:</span>
              <span className="text-red-500">{requiredCoins - currentBalance}</span>
            </div>
          </div>
        </div>
        
        <AlertDialogFooter className="border-t border-zinc-900 bg-zinc-950 p-4">
          <div className="flex w-full justify-between">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs uppercase font-mono"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                onClose()
                // This would navigate to recharge page in a real implementation
                window.location.href = '/pricing'
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs uppercase font-mono"
            >
              Recharge Coins
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 