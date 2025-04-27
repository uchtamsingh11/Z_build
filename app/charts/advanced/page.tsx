"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { Search, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetTitle
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

export default function AdvancedChartsPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    
    // Apply styles to hide watermark 
    const style = document.createElement('style');
    style.textContent = `
      .tv-lightweight-charts .tv-lightweight-charts__watermark {
        display: none !important;
      }
      .tv-lightweight-charts [class*="watermark"] {
        display: none !important;
      }
      .watermarka, .watermarka-label {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: isDarkMode ? '#121212' : '#ffffff' },
        textColor: isDarkMode ? '#d9d9d9' : '#000',
        attributionLogo: false,
      },
      grid: {
        vertLines: {
          color: isDarkMode ? '#333333' : '#eee',
        },
        horzLines: {
          color: isDarkMode ? '#333333' : '#eee',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {});
    // Generate one unique data point per day for 30 days
    const generateMockCandleData = () => {
      const data = [];
      const days = 30;
      let basePrice = 17000;
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - days + i + 1);
        const time = date.toISOString().slice(0, 10); // YYYY-MM-DD
        const open = basePrice + Math.random() * 10 - 5;
        const close = open + Math.random() * 10 - 5;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        data.push({
          time,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
        });
        basePrice = close;
      }
      return data;
    };
    const candleData = generateMockCandleData();
    candleSeries.setData(candleData);
    const handleResize = () => {
      chart.resize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.head.removeChild(style);
      chart.remove();
    };
  }, [isDarkMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log("Searching for:", searchQuery);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    // Apply theme to document body
    if (!isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      {/* Header with avatar and search bar */}
      <header className={`absolute top-0 left-0 right-0 z-10 flex h-12 items-center border-b ${isDarkMode ? 'border-zinc-800 bg-black/90' : 'border-zinc-200 bg-white/90'} backdrop-blur-sm px-4`}>
        <div className="flex items-center space-x-3">
          {/* Avatar with Sheet panel trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="h-8 w-8 cursor-pointer transition-transform hover:scale-105">
                  <AvatarImage src="/avatar-placeholder.svg" alt="Profile" />
                  <AvatarFallback className={`${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>
                    ZB
                  </AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>
            
            <SheetContent 
              side="left" 
              className={`w-64 p-6 ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
              <SheetTitle className="sr-only">Theme Settings</SheetTitle>
              <div className="flex flex-col space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                    <span className="text-sm font-medium">Theme</span>
                  </div>
                  <Switch 
                    checked={isDarkMode} 
                    onCheckedChange={toggleTheme} 
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="relative w-64">
            <div className="relative">
              <Search className={`absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
              <Input
                type="text"
                placeholder="Search symbols..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-8 w-full ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} pl-8 text-xs rounded-full`}
              />
            </div>
          </form>
        </div>
      </header>
      
      <div
        ref={chartContainerRef}
        className="chart-container"
        style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}
      />
      
      {/* Add styling for dark/light mode */}
      <style jsx global>{`
        .dark-mode {
          color-scheme: dark;
        }
        :root {
          --background: ${isDarkMode ? '#121212' : '#ffffff'};
          --foreground: ${isDarkMode ? '#ffffff' : '#000000'};
        }
        body {
          background-color: var(--background);
          color: var(--foreground);
        }
      `}</style>
    </div>
  );
}