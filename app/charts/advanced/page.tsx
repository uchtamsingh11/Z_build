"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, CandlestickSeries, BarSeries, LineSeries } from "lightweight-charts";
import { Search, Sun, Moon, User, Settings, LogOut, BookOpen, Home, HelpCircle, Bell, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetFooter
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SymbolSearchPopup from "@/components/tradingview/symbol-search-popup";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from "next/navigation";
import IndicatorsIcon from "@/components/indicators-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdvancedChartsPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState("BTCUSD");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [timeframe, setTimeframe] = useState("D");
  const [chartType, setChartType] = useState<"candlestick" | "bar" | "line">("candlestick");

  // Create a debounce function for symbol search
  const debounce = (func: Function, delay: number) => {
    let debounceTimer: NodeJS.Timeout;
    return function(...args: any[]) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch symbols function with error handling
  const fetchSymbols = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchError("");
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('symbols')
        .select('DISPLAY_NAME, EXCH_ID, SECURITY_ID')
        .ilike('DISPLAY_NAME', `%${query}%`)
        .limit(20);
      
      if (error) {
        console.error('Error fetching symbols:', error);
        setSearchError("Failed to fetch symbols. Please try again.");
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Error in symbol search:', error);
      setSearchError("An unexpected error occurred. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Create debounced search function
  const debouncedFetchSymbols = useCallback(
    debounce((query: string) => fetchSymbols(query), 300),
    []
  );

  // Update search when query changes
  useEffect(() => {
    debouncedFetchSymbols(searchQuery);
  }, [searchQuery, debouncedFetchSymbols]);

  useEffect(() => {
    // Check for current user and get email
    const fetchUserEmail = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "user@example.com");
      }
    };
    
    fetchUserEmail();
  }, []);

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
    
    // Generate line chart data (only time and value needed)
    const generateLineData = () => {
      const candleData = generateMockCandleData();
      return candleData.map(item => ({
        time: item.time,
        value: item.close
      }));
    };
    
    const candleData = generateMockCandleData();
    const lineData = generateLineData();
    
    let series;
    if (chartType === "candlestick") {
      series = chart.addSeries(CandlestickSeries, {});
      series.setData(candleData);
    } else if (chartType === "bar") {
      series = chart.addSeries(BarSeries, {});
      series.setData(candleData);
    } else if (chartType === "line") {
      series = chart.addSeries(LineSeries, {});
      series.setData(lineData);
    } else {
      // Default to candlestick if for some reason chartType is not one of the expected values
      series = chart.addSeries(CandlestickSeries, {});
      series.setData(candleData);
    }
    
    const handleResize = () => {
      chart.resize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.head.removeChild(style);
      chart.remove();
    };
  }, [isDarkMode, chartType]);

  const handleOpenSearchPopup = () => {
    setIsSearchPopupOpen(true);
    setSearchQuery(""); // Reset search query when opening popup
    setSearchResults([]); // Reset results
    setSearchError(""); // Reset error state
  };

  const handleCloseSearchPopup = () => {
    setIsSearchPopupOpen(false);
  };

  const handleSelectSymbol = (symbol: string) => {
    setCurrentSymbol(symbol);
    setIsSearchPopupOpen(false);
    // Here you would normally update the chart with the new symbol data
    console.log(`Selected symbol: ${symbol}`);
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/'); // Redirect to landing page
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    // In a real app, you would fetch new data based on the timeframe
    console.log(`Timeframe changed to: ${newTimeframe}`);
  };

  const handleChartTypeChange = (newType: "candlestick" | "bar" | "line") => {
    setChartType(newType);
    console.log(`Chart type changed to: ${newType}`);
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
                  <AvatarFallback className="!bg-black !text-white border border-zinc-800">
                    <User size={16} color="white" strokeWidth={2} />
                  </AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>
            
            <SheetContent 
              side="left" 
              className={`w-80 p-0 ${isDarkMode ? 'bg-zinc-900 text-white border-r border-zinc-800' : 'bg-white text-zinc-900 border-r border-zinc-200'}`}>
              <SheetHeader className="p-6 pb-4 border-b border-solid border-0 border-b-zinc-800/20">
                <SheetTitle className="sr-only">User Profile</SheetTitle>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-14 w-14 border border-solid border-zinc-700/20">
                    <AvatarImage src="/avatar-placeholder.svg" alt="Profile" />
                    <AvatarFallback className="!bg-black !text-white border border-zinc-800">
                      <User size={24} strokeWidth={1.5} className="text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm mt-1">{userEmail}</p>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="px-6 py-4 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <h4 className={`text-xs uppercase font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} tracking-wide`}>Navigation</h4>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" className="w-full justify-start h-10 px-3 gap-3 rounded-md">
                      <Home size={18} strokeWidth={1.5} />
                      <span className="font-normal">Dashboard</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start h-10 px-3 gap-3 rounded-md">
                      <BookOpen size={18} strokeWidth={1.5} />
                      <span className="font-normal">Trading History</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start h-10 px-3 gap-3 rounded-md">
                      <Bell size={18} strokeWidth={1.5} />
                      <span className="font-normal">Alerts</span>
                    </Button>
                  </div>
                </div>
                
                <Separator className={isDarkMode ? 'bg-zinc-800/50 h-px' : 'bg-zinc-200 h-px'} />
                
                <div className="flex flex-col gap-3">
                  <h4 className={`text-xs uppercase font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} tracking-wide`}>Settings</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
                        <span className="text-sm">Dark Mode</span>
                      </div>
                      <Switch 
                        checked={isDarkMode} 
                        onCheckedChange={toggleTheme} 
                        className={`data-[state=checked]:bg-zinc-800 border ${isDarkMode ? 'border-zinc-600' : 'border-zinc-300'}`}
                      />
                    </div>
                    
                    <Button variant="ghost" className="w-full justify-start h-10 px-3 gap-3 rounded-md">
                      <Settings size={18} strokeWidth={1.5} />
                      <span className="font-normal">Account Settings</span>
                    </Button>
                    
                    <Button variant="ghost" className="w-full justify-start h-10 px-3 gap-3 rounded-md">
                      <HelpCircle size={18} strokeWidth={1.5} />
                      <span className="font-normal">Help & Support</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50/10 dark:hover:bg-red-950/10 h-10 px-3 gap-3 rounded-md"
                      onClick={handleSignOut}
                    >
                      <LogOut size={18} strokeWidth={1.5} />
                      <span className="font-normal">Sign Out</span>
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Search button to open symbol search popup */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSearchPopup}
            className={`flex h-9 items-center space-x-2 rounded-md px-3 ${
              isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
            }`}
          >
            <Search className={`h-4.5 w-4.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
              {currentSymbol}
            </span>
          </Button>
          
          {/* Vertical divider */}
          <div className={`h-6 w-px ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></div>
          
          {/* Timeframe dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`flex h-9 px-2 rounded-md items-center ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
              >
                <span className={`font-medium text-sm ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  {timeframe}
                </span>
                <ChevronDown className={`ml-1 h-4 w-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className={`${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <DropdownMenuItem onClick={() => handleTimeframeChange("1m")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>1m</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("5m")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>5m</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("15m")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>15m</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("1h")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>1h</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("4h")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>4h</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("D")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>D</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("W")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>W</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("M")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>M</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Vertical divider */}
          <div className={`h-6 w-px ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></div>
          
          {/* Chart type selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`flex h-9 rounded-md px-2 items-center ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
              >
                {chartType === "candlestick" && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-0">
                    <rect x="4" y="3" width="2" height="12" rx="0.5" className={isDarkMode ? 'fill-zinc-300' : 'fill-zinc-700'} />
                    <rect x="8" y="6" width="2" height="9" rx="0.5" className={isDarkMode ? 'fill-zinc-300' : 'fill-zinc-700'} />
                    <rect x="12" y="9" width="2" height="6" rx="0.5" className={isDarkMode ? 'fill-zinc-300' : 'fill-zinc-700'} />
                  </svg>
                )}
                {chartType === "bar" && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-0">
                    <line x1="4" y1="4" x2="4" y2="14" stroke={isDarkMode ? '#d4d4d8' : '#3f3f46'} strokeWidth="2" strokeLinecap="round" />
                    <line x1="9" y1="6" x2="9" y2="14" stroke={isDarkMode ? '#d4d4d8' : '#3f3f46'} strokeWidth="2" strokeLinecap="round" />
                    <line x1="14" y1="8" x2="14" y2="14" stroke={isDarkMode ? '#d4d4d8' : '#3f3f46'} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {chartType === "line" && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-0">
                    <path d="M2 14L6 10L10 12L16 6" stroke={isDarkMode ? '#d4d4d8' : '#3f3f46'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className={`${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <DropdownMenuItem onClick={() => handleChartTypeChange("candlestick")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <rect x="3" y="2" width="2" height="12" rx="0.5" className={isDarkMode ? 'fill-zinc-300' : 'fill-zinc-700'} />
                  <rect x="7" y="5" width="2" height="9" rx="0.5" className={isDarkMode ? 'fill-zinc-300' : 'fill-zinc-700'} />
                  <rect x="11" y="8" width="2" height="6" rx="0.5" className={isDarkMode ? 'fill-zinc-300' : 'fill-zinc-700'} />
                </svg>
                Candles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChartTypeChange("bar")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <line x1="4" y1="4" x2="4" y2="12" stroke={isDarkMode ? '#d4d4d8' : '#3f3f46'} strokeWidth="1.5" />
                  <line x1="8" y1="6" x2="8" y2="14" stroke={isDarkMode ? '#d4d4d8' : '#3f3f46'} strokeWidth="1.5" />
                  <line x1="12" y1="2" x2="12" y2="10" stroke={isDarkMode ? '#d4d4d8' : '#3f3f46'} strokeWidth="1.5" />
                </svg>
                Bar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChartTypeChange("line")} className={`${isDarkMode ? 'text-zinc-200 focus:bg-zinc-800' : 'text-zinc-800 focus:bg-zinc-100'}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M2 12L6 8L10 10L14 4" stroke={isDarkMode ? '#d4d4d8' : '#3f3f46'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Line
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Vertical divider */}
          <div className={`h-6 w-px ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></div>
          
          {/* Indicators button */}
          <Button
            variant="ghost"
            size="sm"
            className={`flex h-9 items-center space-x-2 rounded-md px-3 ${
              isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center">
              <IndicatorsIcon className={`h-4.5 w-4.5 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`} />
              <span className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Indicators
              </span>
            </div>
          </Button>
        </div>
      </header>
      
      <div
        ref={chartContainerRef}
        className="chart-container"
        style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}
      />

      {/* Symbol search popup */}
      {isSearchPopupOpen && (
        <SymbolSearchPopup
          isOpen={isSearchPopupOpen}
          onClose={handleCloseSearchPopup}
          onSelectSymbol={handleSelectSymbol}
          isDarkMode={isDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          searchError={searchError}
        />
      )}
    </div>
  );
}