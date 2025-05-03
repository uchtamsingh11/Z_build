"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Facebook, Instagram, Linkedin, Phone, Send, Twitter, Terminal, TerminalIcon } from "lucide-react"

export default function Footer() {
  React.useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add("dark")
  }, [])

  return (
    <footer className="relative border-t border-zinc-800 bg-black text-white font-mono">
      {/* Grid background overlay */}
      {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div> */}
      
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          <div className="relative">
            <div className="flex items-center mb-4">
              <TerminalIcon className="w-6 h-6 mr-2 text-white" />
              <h2 className="text-3xl font-bold tracking-tight font-mono uppercase">ALGOZ</h2>
            </div>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-blue-900/10 blur-2xl" />
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold font-mono uppercase">PAGES</h3>
            <nav className="space-y-2 text-sm text-zinc-400 font-mono uppercase">
              <Link href="/privacy" className="block transition-colors hover:text-white">
                PRIVACY_POLICY
              </Link>
              <Link href="/disclaimer" className="block transition-colors hover:text-white">
                DISCLAIMER_POLICY
              </Link>
              <Link href="/terms" className="block transition-colors hover:text-white">
                TERMS_AND_CONDITIONS
              </Link>
              <Link href="/cookies" className="block transition-colors hover:text-white">
                COOKIES_POLICY
              </Link>
              <Link href="/refund" className="block transition-colors hover:text-white">
                REFUND_AND_CANCELLATION
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold font-mono uppercase">CONNECT_WITH_US</h3>
            <nav className="space-y-2 text-sm text-zinc-400 font-mono uppercase">
              <a href="https://wa.me/919241740350" className="flex items-center gap-2 transition-colors hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-whatsapp" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
                WHATSAPP_SUPPORT
              </a>
              <a href="https://t.me/AlgoZsupport1" className="flex items-center gap-2 transition-colors hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-telegram" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z"/>
                </svg>
                TELEGRAM_SUPPORT
              </a>
              <a href="tel:+919241740350" className="flex items-center gap-2 transition-colors hover:text-white">
                <Phone className="h-4 w-4" />
                +91 9241740350
              </a>
            </nav>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 text-center md:flex-row">
          <p className="text-sm text-zinc-400 font-mono">
            © 2024 ALGOZ_TRADING. ALL_RIGHTS_RESERVED.
          </p>
          <nav className="flex gap-4 text-sm text-zinc-400 font-mono uppercase">
            <Link href="/privacy" className="transition-colors hover:text-white">
              PRIVACY_POLICY
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              TERMS_OF_SERVICE
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-white">
              COOKIE_SETTINGS
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
} 