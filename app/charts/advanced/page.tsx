"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, CandlestickSeries, BarSeries, LineSeries } from "lightweight-charts";
import { 
  Search, 
  ChevronDown, 
  BarChart3, 
  LineChart, 
  CandlestickChart, 
  Layers, 
  PenTool, 
  Gauge, 
  Clock, 
  ZoomIn, 
  LayoutGrid, 
  Compass, 
  Settings, 
  Save, 
  Folder, 
  Trash2,
  MonitorSmartphone,
  Wifi,
  Sun,
  CalendarRange
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState("BTCUSD");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [timeframe, setTimeframe] = useState("D");
  const [chartType, setChartType] = useState<"candlestick" | "bar" | "line">("candlestick");
  const [isConnected, setIsConnected] = useState(true);

  // Apply dark theme on initial load
  useEffect(() => {
    document.documentElement.classList.add('dark-mode');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('chartTheme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark-mode');
    }
  }, []);
  
  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prevTime => prevTime + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format session time as HH:MM:SS
  const formatSessionTime = () => {
    const hours = Math.floor(sessionTime / 3600);
    const minutes = Math.floor((sessionTime % 3600) / 60);
    const seconds = sessionTime % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format current time
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString();
  };

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
        background: { color: isDarkMode ? '#0e0e0e' : '#ffffff' },
        textColor: isDarkMode ? '#d9d9d9' : '#000',
        attributionLogo: false,
      },
      grid: {
        vertLines: {
          color: isDarkMode ? 'rgba(42, 46, 57, 0.5)' : '#eee',
          style: 1, // 0 - solid, 1 - dotted, 2 - dashed, 3 - large dashed
        },
        horzLines: {
          color: isDarkMode ? 'rgba(42, 46, 57, 0.5)' : '#eee',
          style: 1, // 0 - solid, 1 - dotted, 2 - dashed, 3 - large dashed
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: isDarkMode ? 'rgba(42, 46, 57, 0.5)' : '#eee',
      },
      rightPriceScale: {
        borderColor: isDarkMode ? 'rgba(42, 46, 57, 0.5)' : '#eee',
      },
      crosshair: {
        mode: 1, // 0 - normal, 1 - magnet
        vertLine: {
          color: isDarkMode ? '#758696' : '#758696',
          width: 1,
          style: 1,
          labelBackgroundColor: isDarkMode ? '#2A2E39' : '#fff',
        },
        horzLine: {
          color: isDarkMode ? '#758696' : '#758696',
          width: 1,
          style: 1,
          labelBackgroundColor: isDarkMode ? '#2A2E39' : '#fff',
        }
      }
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
      series = chart.addSeries(CandlestickSeries, {
        upColor: '#089981',
        downColor: '#f23645',
        borderUpColor: '#089981',
        borderDownColor: '#f23645',
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
      });
      series.setData(candleData);
    } else if (chartType === "bar") {
      series = chart.addSeries(BarSeries, {
        upColor: '#089981',
        downColor: '#f23645',
      });
      series.setData(candleData);
    } else if (chartType === "line") {
      series = chart.addSeries(LineSeries, {
        color: '#2962FF',
        lineWidth: 2,
      });
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
    // Apply theme to document body and save to localStorage
    if (!isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('chartTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('chartTheme', 'light');
    }
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

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(selectedTool === toolName ? null : toolName);
    console.log(`Tool selected: ${toolName}`);
  };

  // Handle timeframe selection in the bottom bar
  const handleTimeframeSelect = (tf: string) => {
    setSelectedTimeframe(tf);
    console.log(`Selected timeframe: ${tf}`);
    // Here you would normally fetch data for the selected timeframe
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0e0e0e] text-white overflow-hidden relative">
      {/* Left sidebar toolbar - vertical */}
      <div className="absolute left-0 top-0 bottom-0 z-20 w-12 border-r border-zinc-800 bg-[#131722] flex flex-col items-center py-3">
        <TooltipProvider>
          {/* Chart type toggle */}
          <div className="mb-6 flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleChartTypeChange("candlestick")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${chartType === "candlestick" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <CandlestickChart size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Candlestick Chart</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleChartTypeChange("bar")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${chartType === "bar" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <BarChart3 size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Bar Chart</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleChartTypeChange("line")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${chartType === "line" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <LineChart size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Line Chart</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator className="w-8 my-2 bg-zinc-800" />

          {/* Drawing tools section */}
          <div className="mb-6 flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleToolSelect("pointer")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${selectedTool === "pointer" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <Compass size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Cursor Tool</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleToolSelect("crosshair")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${selectedTool === "crosshair" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <PenTool size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Drawing Tools</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleToolSelect("layouts")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${selectedTool === "layouts" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <LayoutGrid size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Chart Layouts</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleToolSelect("indicators")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${selectedTool === "indicators" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <Gauge size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Indicators</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator className="w-8 my-2 bg-zinc-800" />

          {/* Bottom tools */}
          <div className="mt-auto flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleToolSelect("save")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${selectedTool === "save" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <Save size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Save Layout</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleToolSelect("load")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${selectedTool === "load" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <Folder size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Load Layout</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center rounded-sm text-zinc-400 hover:bg-[#2A2E39] hover:text-white"
                >
                  <Sun size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Toggle Theme</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleToolSelect("settings")}
                  className={`w-10 h-10 flex items-center justify-center rounded-sm ${selectedTool === "settings" ? "bg-[#2A2E39] text-white" : "text-zinc-400 hover:bg-[#2A2E39] hover:text-white"}`}
                >
                  <Settings size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      
      {/* Top toolbar - horizontal */}
      <div className="h-12 ml-12 border-b border-zinc-800 bg-[#131722] flex items-center px-4 z-10">
        <div className="flex items-center space-x-3">
          {/* Symbol selector */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSearchPopup}
            className="h-9 flex items-center space-x-2 rounded-sm px-3 bg-[#2A2E39]/30 hover:bg-[#2A2E39]"
          >
            <span className="text-sm font-medium text-white">{currentSymbol}</span>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </Button>
          
          {/* Timeframe selectors */}
          <div className="flex items-center gap-1">
            {['1m', '5m', '15m', '1h', '4h', 'D', 'W', 'M'].map((tf) => (
              <Button
                key={tf}
                variant="ghost"
                size="sm"
                className={`px-2 h-7 text-xs rounded-sm ${timeframe === tf ? 'bg-[#2A2E39] text-white' : 'text-zinc-400 hover:bg-[#2A2E39]/70 hover:text-white'}`}
                onClick={() => handleTimeframeChange(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
          
          {/* Vertical divider */}
          <div className="h-6 w-px bg-zinc-700"></div>
          
          {/* Indicators button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 flex items-center space-x-2 rounded-sm px-3 hover:bg-[#2A2E39]"
            onClick={() => handleToolSelect("indicators")}
          >
            <div className="flex items-center">
              <Layers className="h-4 w-4 text-zinc-300" />
              <span className="ml-2 text-sm font-medium text-zinc-300">
                Indicators
              </span>
            </div>
          </Button>
          
          {/* Compare button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 flex items-center space-x-2 rounded-sm px-3 hover:bg-[#2A2E39]"
          >
            <div className="flex items-center">
              <Search className="h-4 w-4 text-zinc-300" />
              <span className="ml-2 text-sm font-medium text-zinc-300">
                Compare
              </span>
            </div>
          </Button>
        </div>
      </div>
      
      {/* Main chart area */}
      <div 
        className="relative flex-1 ml-12"
        ref={chartContainerRef}
      />
      
      {/* Timeframe selector bar */}
      <div className="h-10 ml-12 border-t border-zinc-800 bg-[#131722] flex items-center justify-between px-4 z-10">
        <div className="flex items-center h-full">
          {["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"].map((tf) => (
            <button
              key={tf}
              className={`px-4 h-full flex items-center text-sm font-medium ${
                selectedTimeframe === tf 
                  ? "text-white border-b-2 border-blue-500" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              onClick={() => handleTimeframeSelect(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <div className="flex items-center">
          <button className="flex items-center text-zinc-400 hover:text-white ml-4 border-l border-zinc-700 pl-4">
            <CalendarRange className="w-4 h-4 mr-2" />
            <span className="text-sm">Date Range</span>
          </button>
          
          <div className="flex items-center ml-6 border-l border-zinc-700 pl-4">
            <Clock className="w-4 h-4 mr-2 text-zinc-400" />
            <span className="text-sm text-zinc-300">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
          </div>
        </div>
      </div>
      
      {/* Bottom status bar */}
      <div className="h-6 ml-12 border-t border-zinc-800 bg-[#131722]/90 flex items-center justify-between px-4 text-xs text-zinc-400 z-10">
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <Wifi className="w-3 h-3 mr-1 text-green-500" />
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
          <span className="mr-4">{currentSymbol}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          <span className="mr-4">Session: {formatSessionTime()}</span>
          <span>{formatCurrentTime()}</span>
        </div>
      </div>

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