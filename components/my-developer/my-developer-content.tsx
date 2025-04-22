'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Code, Terminal, Laptop, CpuIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function MyDeveloperContent() {
  const [isBooking, setIsBooking] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Handle the booking process
  const handleBookDeveloper = () => {
    setIsBooking(true);
    setCountdown(5);
  };

  // Countdown effect
  useEffect(() => {
    if (!isBooking) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsBooking(false);
          setShowWhatsApp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBooking]);

  return (
    <div className="relative w-full max-w-lg">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:14px_24px] opacity-40 z-0"></div>
      
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 rounded-lg opacity-20 blur-xl"></div>
      
      <Card className="relative w-full p-8 border border-zinc-800 bg-zinc-950/90 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-sm rounded-lg z-10 overflow-hidden">
        {/* Tech circuit line decorations */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900"></div>
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-zinc-900 via-zinc-700 to-zinc-900"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-zinc-900 via-zinc-700 to-zinc-900"></div>
        <div className="absolute bottom-0 right-0 w-1 h-1/3 bg-gradient-to-t from-zinc-900 via-zinc-700 to-zinc-900"></div>
        
        <div className="flex flex-col items-center justify-center space-y-10 relative z-10">
          {!isBooking && !showWhatsApp && (
            <motion.div 
              className="flex flex-col items-center space-y-8 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-zinc-800 rounded-full blur-sm opacity-30"></div>
                <div className="h-24 w-24 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] relative">
                  <CpuIcon className="h-12 w-12 text-zinc-300" />
                  <div className="absolute h-full w-full rounded-full border border-zinc-700 animate-ping opacity-20"></div>
                </div>
              </div>
              
              <div className="w-full text-center space-y-3">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Terminal className="h-4 w-4 text-zinc-500" />
                  <p className="text-xs font-mono text-zinc-500 tracking-wider">SYSTEM_ACCESS</p>
                </div>
                <h3 className="text-zinc-300 font-mono tracking-wide text-xl">DEVELOPER_REQUIRED</h3>
                <p className="text-zinc-600 text-xs font-mono">ESTIMATED_WAIT_TIME: 00:00:05</p>
              </div>
              
              <Button 
                onClick={handleBookDeveloper}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 py-6 text-lg font-mono tracking-widest rounded-md shadow-lg transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] group relative overflow-hidden"
              >
                <span className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></span>
                <Code className="mr-2 h-5 w-5 inline-block" />
                INITIALIZE_DEV_SESSION
              </Button>
            </motion.div>
          )}

          {isBooking && (
            <motion.div 
              className="flex flex-col items-center space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative h-32 w-32">
                <div className="absolute inset-0 border-2 border-t-zinc-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-2 border-r-zinc-600 border-l-transparent border-t-transparent border-b-transparent rounded-full animate-spin animation-delay-150"></div>
                <div className="absolute inset-8 border-2 border-b-zinc-600 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin animation-delay-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-mono font-bold text-zinc-300">{countdown}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <p className="text-zinc-400 font-mono text-sm tracking-wider">ESTABLISHING_CONNECTION</p>
                <div className="flex space-x-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 animate-pulse"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 animate-pulse animation-delay-150"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 animate-pulse animation-delay-300"></div>
                </div>
              </div>
              
              <div className="w-full rounded bg-zinc-900 border border-zinc-800 p-2">
                <p className="font-mono text-xs text-zinc-500">
                  <span className="text-zinc-600">$</span> connecting to developer server...<br/>
                  <span className="text-zinc-600">$</span> initializing session protocols...<br/>
                  <span className="text-zinc-600">$</span> establishing secure channel...
                </p>
              </div>
            </motion.div>
          )}

          {showWhatsApp && (
            <motion.div 
              className="flex flex-col items-center space-y-8 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-zinc-800 rounded-full blur-sm opacity-30"></div>
                <div className="h-24 w-24 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  <Laptop className="h-12 w-12 text-zinc-300" />
                </div>
              </div>
              
              <div className="w-full text-center space-y-2">
                <h3 className="text-zinc-300 font-mono tracking-wide text-xl">CONNECTION_ESTABLISHED</h3>
                <p className="text-zinc-600 text-xs font-mono">DEVELOPER_READY: TRUE</p>
              </div>
              
              <Button 
                onClick={() => window.open('https://wa.me/919241740350', '_blank')}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 py-6 text-lg font-mono tracking-widest rounded-md shadow-lg transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] group relative overflow-hidden"
              >
                <span className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></span>
                <Terminal className="mr-2 h-5 w-5 inline-block" />
                CONNECT_SECURE_CHANNEL
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setShowWhatsApp(false)}
                className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 text-xs font-mono tracking-wider"
              >
                RESET_CONNECTION
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
} 