"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, CandlestickSeries, BarSeries, LineSeries, Time } from "lightweight-charts";
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
  LayoutGrid, 
  Compass, 
  Settings, 
  Save, 
  Folder, 
  Wifi,
  Sun,
  CalendarRange,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SymbolSearchPopup from "@/components/tradingview/symbol-search-popup";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from "next/navigation";
import { fetchHistoricalData, formatIntervalForDhan } from "@/app/services/dhanApi";

// Types for chart data
interface ChartDataPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface LineDataPoint {
  time: Time;
  value: number;
}

export default function AdvancedChartsPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState("RELIANCE");
  const [currentSecurityId, setCurrentSecurityId] = useState("1333"); // Default to RELIANCE
  const [currentExchangeSegment, setCurrentExchangeSegment] = useState("NSE_EQ");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [timeframe, setTimeframe] = useState("1m");
  const [chartType, setChartType] = useState<"candlestick" | "bar" | "line">("candlestick");
  const [isConnected, setIsConnected] = useState(true);
  
  // New state variables for API integration
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [lineChartData, setLineChartData] = useState<LineDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

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
  
  // Fetch chart data from Dhan API
  const fetchChartData = useCallback(async () => {
    if (!currentSecurityId || !currentExchangeSegment) {
      console.warn('Missing required parameters for data fetch');
      return;
    }

    setIsLoading(true);
    setDataError(null);

    try {
      // Convert UI timeframe to API interval
      let interval = formatIntervalForDhan(timeframe);
      
      // Prepare date range based on selected timeframe from bottom bar
      let customFromDate: string | undefined;
      const now = new Date();
      
      if (selectedTimeframe === '1D') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        customFromDate = yesterday.toISOString().split('T')[0];
      } else if (selectedTimeframe === '5D') {
        const fiveDaysAgo = new Date(now);
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        customFromDate = fiveDaysAgo.toISOString().split('T')[0];
      } else if (selectedTimeframe === '1M') {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        customFromDate = oneMonthAgo.toISOString().split('T')[0];
      } else if (selectedTimeframe === '3M') {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        customFromDate = threeMonthsAgo.toISOString().split('T')[0];
      } else if (selectedTimeframe === '6M') {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        customFromDate = sixMonthsAgo.toISOString().split('T')[0];
      } else if (selectedTimeframe === '1Y') {
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        customFromDate = oneYearAgo.toISOString().split('T')[0];
      } else if (selectedTimeframe === '5Y') {
        const fiveYearsAgo = new Date(now);
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        customFromDate = fiveYearsAgo.toISOString().split('T')[0];
      } else if (selectedTimeframe === 'YTD') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        customFromDate = startOfYear.toISOString().split('T')[0];
      } else {
        // Default to 1D if no timeframe is selected
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        customFromDate = yesterday.toISOString().split('T')[0];
      }
      
      console.log(`Fetching ${currentSymbol} data with interval ${interval}, timeframe ${selectedTimeframe}`);
      
      // Format dates specifically for intraday requests if using minute/hour timeframes
      const isIntraday = timeframe.toLowerCase().includes('m') || timeframe.toLowerCase().includes('h');
      let fromDateFormatted = customFromDate;
      let toDateFormatted = toDate || new Date().toISOString().split('T')[0];
      
      // For intraday requests, we need to include time component
      if (isIntraday && customFromDate && !customFromDate.includes(':')) {
        // For 1 minute data, limit to 1 day to avoid too many candles
        if (timeframe === '1m' && selectedTimeframe === 'All') {
          // Limit to last 5 hours for 1-minute data when "All" is selected
          const fiveHoursAgo = new Date(now);
          fiveHoursAgo.setHours(fiveHoursAgo.getHours() - 5);
          fromDateFormatted = fiveHoursAgo.toISOString().split('.')[0].replace('T', ' ');
        } else {
          fromDateFormatted = `${customFromDate} 09:15:00`;
        }
      }
      
      if (isIntraday && toDateFormatted && !toDateFormatted.includes(':')) {
        toDateFormatted = `${toDateFormatted} 15:30:00`;
      }
      
      const response = await fetchHistoricalData({
        symbol: currentSecurityId,
        exchangeSegment: currentExchangeSegment,
        instrument: 'EQUITY', // Add instrument parameter as required by Dhan API
        interval: interval,
        ...(fromDateFormatted && { fromDate: fromDateFormatted }),
        ...(toDateFormatted && { toDate: toDateFormatted })
      });

      if (response && response.data && response.data.length > 0) {
        console.log(`Received ${response.data.length} data points`);
        
        // Format data for the chart - ensure time is properly formatted as required by lightweight-charts
        const candleData = response.data.map((point) => {
          // Handle timestamp conversion - if it's a number, convert to proper format
          let timeValue: Time;
          if (typeof point.time === 'number') {
            const date = new Date(point.time);
            
            // Format based on timeframe - for intraday we need precise time
            if (isIntraday) {
              // For intraday, include time component in ISO format
              timeValue = Math.floor(point.time / 1000) as Time; // Lightweight charts expects seconds for intraday
            } else {
              // For daily charts, just use YYYY-MM-DD format
              timeValue = date.toISOString().split('T')[0] as Time;
            }
          } else {
            // Already a string in the right format
            timeValue = point.time as Time;
          }
          
          return {
            time: timeValue,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
            volume: point.volume
          };
        });
        
        setChartData(candleData);
        
        // Also prepare line data for line chart
        const lineData = candleData.map(point => ({
          time: point.time,
          value: point.close
        }));
        
        setLineChartData(lineData);
        
        // Update chart if it exists
        if (seriesRef.current && chartData.length > 0) {
          if (chartType === 'line') {
            seriesRef.current.setData(lineData);
          } else {
            seriesRef.current.setData(candleData);
          }
        }
      } else {
        console.warn('No data received from API');
        setDataError('No data available for the selected time range');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Try to extract more useful error message if available
      const errorMessage = error instanceof Error 
        ? error.message
        : 'Failed to load chart data';
        
      // Check if the error contains details about authentication
      if (errorMessage.includes('401') || errorMessage.includes('auth')) {
        setDataError('Authentication error: Please check your Dhan API credentials');
      } else if (errorMessage.includes('429')) {
        setDataError('Rate limit exceeded: Too many requests to Dhan API');
      } else {
        setDataError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentSecurityId, currentExchangeSegment, timeframe, selectedTimeframe, chartType, toDate]);
  
  // Initial data fetch on component mount
  useEffect(() => {
    // Fetch data with default parameters as soon as component mounts
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Session timer
  useEffect(() => {
    // Set up timer to track session time
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
      setCurrentTime(new Date());
    }, 1000);
    
    // Clear timer on unmount
    return () => clearInterval(timer);
  }, []);
  
  // Additional initialization for chart on component mount
  useEffect(() => {
    // Fetch user email 
    fetchUserEmail();
    
    // Initialize chart
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: isDarkMode ? '#131722' : '#ffffff' },
          textColor: isDarkMode ? '#D9D9D9' : '#333333',
        },
        grid: {
          vertLines: { color: isDarkMode ? '#1E2131' : '#f0f0f0' },
          horzLines: { color: isDarkMode ? '#1E2131' : '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: isDarkMode ? '#2B2B43' : '#d9d9d9',
        },
        rightPriceScale: {
          borderColor: isDarkMode ? '#2B2B43' : '#d9d9d9',
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { mouseWheel: true, pinch: true },
      });
      
      // Save chart reference
      chartRef.current = chart;
      
      // Add candlestick series by default
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#089981',
        downColor: '#f23645',
        borderUpColor: '#089981',
        borderDownColor: '#f23645',
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
      });
      
      // Save series reference
      seriesRef.current = candlestickSeries;
      
      // Handle window resize 
      window.addEventListener('resize', handleResize);
    }
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [isDarkMode]);
  
  // Update chart data when data changes
  useEffect(() => {
    if (chartRef.current && seriesRef.current) {
      if (chartType === 'line' && lineChartData.length > 0) {
        seriesRef.current.setData(lineChartData);
      } else if (chartData.length > 0) {
        seriesRef.current.setData(chartData);
      }
      
      // Automatically fit content if we have data
      if ((chartType === 'line' && lineChartData.length > 0) || 
          (chartType !== 'line' && chartData.length > 0)) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [chartData, lineChartData, chartType]);

  const formatSessionTime = () => {
    const hours = Math.floor(sessionTime / 3600);
    const minutes = Math.floor((sessionTime % 3600) / 60);
    const seconds = sessionTime % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', second: '2-digit'});
  };
  
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return function(...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };
  
  const fetchSymbols = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchError("");
    
    try {
      // Connect to Supabase and fetch symbols from the correct table
      const supabase = createClient();
      const { data, error } = await supabase
        .from('symbols')
        .select('*')
        .ilike('DISPLAY_NAME', `%${query}%`)
        .limit(20);
      
      if (error) {
        console.error('Error fetching symbols:', error);
        setSearchError("Failed to fetch symbols. Please try again later.");
        return;
      }
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error in symbol search:', error);
      setSearchError("An unexpected error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => fetchSymbols(query), 300),
    []
  );

  // Search effect
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, debouncedSearch]);

  // Fetch user email
  const fetchUserEmail = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "user@example.com");
      }
    } catch (error) {
      console.error("Error fetching user email:", error);
    }
  };
  
  const handleResize = () => {
    if (chartRef.current && chartContainerRef.current) {
      chartRef.current.resize(
        chartContainerRef.current.clientWidth,
        chartContainerRef.current.clientHeight
      );
    }
  };

  // Add effect to fetch data when symbol, timeframe, or charting params change
  useEffect(() => {
    fetchChartData();
  }, [currentSecurityId, currentExchangeSegment, timeframe, selectedTimeframe, fetchChartData]);

  const handleOpenSearchPopup = () => {
    setIsSearchPopupOpen(true);
    setSearchQuery(""); // Reset search query when opening popup
    setSearchResults([]); // Reset results
    setSearchError(""); // Reset error state
  };

  const handleCloseSearchPopup = () => {
    setIsSearchPopupOpen(false);
  };

  const handleSelectSymbol = (symbol: string, securityId: string, exchangeSegment: string) => {
    setCurrentSymbol(symbol);
    setCurrentSecurityId(securityId);
    setCurrentExchangeSegment(exchangeSegment);
    setIsSearchPopupOpen(false);
    console.log(`Selected symbol: ${symbol} (ID: ${securityId}, Exchange: ${exchangeSegment})`);
    // Data will be fetched via the useEffect hook
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
    console.log(`Timeframe changed to: ${newTimeframe}`);
    // Data will be fetched via the useEffect hook
  };

  const handleChartTypeChange = (newType: "candlestick" | "bar" | "line") => {
    setChartType(newType);
    console.log(`Chart type changed to: ${newType}`);
    
    // Update existing chart if we have data and a chart reference
    if (chartRef.current && seriesRef.current) {
      // Remove old series
      chartRef.current.removeSeries(seriesRef.current);
      
      // Add new series of the selected type
      let newSeries;
      if (newType === "candlestick") {
        newSeries = chartRef.current.addSeries(CandlestickSeries, {
          upColor: '#089981',
          downColor: '#f23645',
          borderUpColor: '#089981',
          borderDownColor: '#f23645',
          wickUpColor: '#089981',
          wickDownColor: '#f23645',
        });
        
        // Only use actual data from API, never mock data
        if (chartData.length > 0) {
          newSeries.setData(chartData);
        } else {
          // Display loading indicator or error message instead of generating mock data
          setDataError('Waiting for data from Dhan API...');
        }
      } else if (newType === "bar") {
        newSeries = chartRef.current.addSeries(BarSeries, {
          upColor: '#089981',
          downColor: '#f23645',
        });
        
        // Only use actual data from API, never mock data
        if (chartData.length > 0) {
          newSeries.setData(chartData);
        } else {
          setDataError('Waiting for data from Dhan API...');
        }
      } else if (newType === "line") {
        newSeries = chartRef.current.addSeries(LineSeries, {
          color: '#2962FF',
          lineWidth: 2,
        });
        
        // Only use actual data from API, never mock data
        if (lineChartData.length > 0) {
          newSeries.setData(lineChartData);
        } else {
          setDataError('Waiting for data from Dhan API...');
        }
      }
      
      seriesRef.current = newSeries;
    }
  };

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(selectedTool === toolName ? null : toolName);
    console.log(`Tool selected: ${toolName}`);
  };

  // Handle timeframe selection in the bottom bar
  const handleTimeframeSelect = (tf: string) => {
    setSelectedTimeframe(tf);
    console.log(`Selected timeframe: ${tf}`);
    // Data will be fetched via the useEffect hook
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
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-white">Loading chart data...</span>
            </div>
          </div>
        )}
        
        {/* Error overlay */}
        {dataError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="flex flex-col items-center gap-2 max-w-md p-4 bg-[#131722] border border-red-500 rounded-md">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="text-white text-center">{dataError}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={() => {
                  setDataError(null);
                  fetchChartData();
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
      
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
          onSelectSymbol={(symbol, securityId, exchangeSegment) => {
            handleSelectSymbol(
              symbol, 
              securityId || "1333", 
              exchangeSegment || "NSE_EQ"
            );
          }}
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