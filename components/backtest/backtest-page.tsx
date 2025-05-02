"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CheckIcon, ArrowRightIcon, ChevronDownIcon, TerminalIcon, ServerIcon, CpuIcon, BarChartIcon } from "lucide-react"
import { StrategySettingsPanel } from "@/components/strategy-settings-panel"
import { ServicePriceInfo } from "@/components/service-price-info"
import { ServiceValidationError } from "@/components/service-validation-error"
import { refreshCoinBalance } from "@/components/coin-balance-display"
import { Label } from "@/components/ui/label"
import { SymbolSearch } from "@/components/SymbolSearch"
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Type definition for backtest results
interface BacktestResults {
  netProfit: string;
  maxDrawdown: string;
  sharpeRatio: string;
  winRate: string;
  trades: number;
  dailyReturns: number[];
  portfolioValues: number[];
  days: number;
  dailyData?: Array<{date: string; return: number; value: number}>;
}

// Mock function to simulate Pine script to JSON conversion
const convertPineScriptToJson = (pineScript: string) => {
  // Initialize result object
  const result = {
    strategy: "Sample Strategy",
    strategy_parameters: [] as any[]
  }
  
  try {
    // Extract strategy name if available
    const strategyMatch = pineScript.match(/(?:strategy|indicator)\s*\(\s*["']([^"']*)["']/)
    if (strategyMatch && strategyMatch[1]) {
      result.strategy = strategyMatch[1]
    }
    
    // Improved regex to find all input() declarations
    // This pattern looks for variable assignments with input() calls
    const inputRegex = /(\w+)\s*=\s*input(?:\.(\w+))?\s*\(([^)]+)\)/g
    
    let match;
    while ((match = inputRegex.exec(pineScript)) !== null) {
      const varName = match[1].trim();
      const inputType = match[2] || "float"; // Default to float if type is not specified
      const inputParams = match[3];
      
      // Extract parameters
      const extractParams = (params: string) => {
        const result = {
          defaultValue: '',
          title: varName,
          min: undefined as number | undefined,
          max: undefined as number | undefined,
          type: inputType
        };
        
        // Split parameters
        const parts = params.split(',').map(p => p.trim());
        
        // Extract default value (first parameter)
        if (parts.length > 0) {
          result.defaultValue = parts[0];
        }
        
        // Process other parameters
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];
          
          // Named title parameter
          if (part.startsWith('title=')) {
            const titleMatch = part.match(/title\s*=\s*["']([^"']*)["']/);
            if (titleMatch) {
              result.title = titleMatch[1];
            }
          }
          // Named min parameter
          else if (part.startsWith('minval=')) {
            const minMatch = part.match(/minval\s*=\s*([^,\s)]+)/);
            if (minMatch && !isNaN(parseFloat(minMatch[1]))) {
              result.min = parseFloat(minMatch[1]);
            }
          }
          // Named max parameter
          else if (part.startsWith('maxval=')) {
            const maxMatch = part.match(/maxval\s*=\s*([^,\s)]+)/);
            if (maxMatch && !isNaN(parseFloat(maxMatch[1]))) {
              result.max = parseFloat(maxMatch[1]);
            }
          }
          // Positional title (usually second parameter)
          else if (i === 1 && !part.includes('=')) {
            const titleMatch = part.match(/["']([^"']*)["']/);
            if (titleMatch) {
              result.title = titleMatch[1];
            }
          }
          // Positional min (usually third parameter for numeric types)
          else if ((inputType === 'float' || inputType === 'int') && i === 2 && !part.includes('=')) {
            if (!isNaN(parseFloat(part))) {
              result.min = parseFloat(part);
            }
          }
          // Positional max (usually fourth parameter for numeric types)
          else if ((inputType === 'float' || inputType === 'int') && i === 3 && !part.includes('=')) {
            if (!isNaN(parseFloat(part))) {
              result.max = parseFloat(part);
            }
          }
        }
        
        return result;
      };
      
      const params = extractParams(inputParams);
      
      // Parse default value based on type
      let parsedDefault: any;
      let type = params.type;
      
      if (inputType === "float") {
        // Handle float values
        parsedDefault = parseFloat(params.defaultValue.replace(/["']/g, ''));
        if (isNaN(parsedDefault)) parsedDefault = 0.0;
        type = "float";
      } 
      else if (inputType === "int") {
        // Handle integer values
        parsedDefault = parseInt(params.defaultValue.replace(/["']/g, ''));
        if (isNaN(parsedDefault)) parsedDefault = 0;
        type = "integer";
      }
      else if (inputType === "bool") {
        // Handle boolean values
        parsedDefault = params.defaultValue.toLowerCase() === "true";
        type = "boolean";
      } 
      else if (inputType === "string" || inputType === "symbol" || inputType === "resolution" || inputType === "session") {
        // Handle string values - remove quotes
        parsedDefault = params.defaultValue.replace(/^["'](.*)["']$/, '$1');
        type = "string";
      }
      else if (inputType === "source") {
        // Handle source values
        parsedDefault = params.defaultValue.replace(/^["'](.*)["']$/, '$1');
        type = "source";
      }
      else if (inputType === "time") {
        // Handle time values
        parsedDefault = params.defaultValue;
        type = "time";
      }
      else if (inputType === "color") {
        // Handle color values
        parsedDefault = params.defaultValue.replace(/^["'](.*)["']$/, '$1');
        type = "color";
      }
      else {
        // Handle any other types
        // Try to parse as number first, then fall back to string
        const numValue = parseFloat(params.defaultValue.replace(/["']/g, ''));
        if (!isNaN(numValue) && params.defaultValue.indexOf('"') === -1 && params.defaultValue.indexOf("'") === -1) {
          parsedDefault = params.defaultValue.includes('.') ? numValue : parseInt(params.defaultValue);
          type = params.defaultValue.includes('.') ? "float" : "integer";
        } else {
          // Handle string literals enclosed in quotes
          parsedDefault = params.defaultValue.replace(/^["'](.*)["']$/, '$1');
          type = "string";
        }
      }
      
      // Create parameter object
      const param = {
        name: varName,
        label: params.title,
        type: type,
        default: parsedDefault,
        min: params.min,
        max: params.max
      }
      
      result.strategy_parameters.push(param);
    }
    
    // If no inputs are found, return empty parameters array
    if (result.strategy_parameters.length === 0) {
      result.strategy_parameters = [];
    }
    
    return {
      strategy: result.strategy,
      strategy_parameters: result.strategy_parameters.map(input => ({
        name: input.name,
        type: input.type,
        default: input.default,
        title: input.label,
        min: input.min,
        max: input.max
      }))
    };
  } catch (error) {
    console.error("Error parsing Pine script:", error)
    // Return empty result if parsing fails
    return {
      strategy: "Unnamed Strategy",
      strategy_parameters: []
    }
  }
}

// Simple seeded random number generator for consistent results
function seededRandom(seed: number) {
  let nextSeed = seed;
  
  return () => {
    nextSeed = (nextSeed * 9301 + 49297) % 233280;
    return nextSeed / 233280;
  };
}

// Portfolio Chart Component using react-chartjs-2
function PortfolioChart({ portfolioValues, days }: { portfolioValues: number[], days: number }) {
  // Create labels (days)
  const today = new Date();
  const labels = Array.from({ length: days + 1 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - days + i);
    return date.toLocaleDateString();
  });
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Portfolio Value',
        data: portfolioValues,
        borderColor: '#FF3B30',
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointBackgroundColor: '#FFFFFF'
      }
    ]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#FFFFFF',
          font: {
            family: 'monospace'
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#333',
        titleColor: '#FFF',
        bodyColor: '#FFF',
        borderColor: '#555',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#999',
          font: {
            family: 'monospace',
            size: 10
          },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: '#555'
        }
      },
      y: {
        ticks: {
          color: '#999',
          font: {
            family: 'monospace',
            size: 10
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: '#555'
        }
      }
    }
  };
  
  return (
    <div className="w-full h-full bg-zinc-950 rounded overflow-hidden">
      <Line data={data} options={options} />
    </div>
  );
}

export function BacktestingPage() {
  const [activeStep, setActiveStep] = useState(1)
  const [pineScript, setPineScript] = useState("")
  const [parsedScript, setParsedScript] = useState<any>(null)
  const [symbol, setSymbol] = useState("")
  const [strategySettings, setStrategySettings] = useState<any>(null)
  const [inputParams, setInputParams] = useState<any[]>([])
  const [backtestRunning, setBacktestRunning] = useState(false)
  const [countdownTime, setCountdownTime] = useState(30)
  const [backtestResults, setBacktestResults] = useState<BacktestResults | null>(null)
  
  // Add validation error state
  const [validationError, setValidationError] = useState(false)
  const [errorDetails, setErrorDetails] = useState({ requiredCoins: 50, currentBalance: 0 })
  
  // Handle Pine script conversion
  const handleConvertPineScript = () => {
    if (!pineScript.trim()) return
    
    try {
      const result = convertPineScriptToJson(pineScript)
      setParsedScript(result)
      
      // Initialize input parameters with default values and min/max if available
      const params = result.strategy_parameters
        .filter((input: any) => input.type === 'integer' || input.type === 'float') // Only keep numeric inputs
        .map((input: any) => ({
          ...input,
          label: input.title || input.name,
          min: input.min !== undefined ? input.min : (typeof input.default === 'number' ? input.default * 0.5 : 1),
          max: input.max !== undefined ? input.max : (typeof input.default === 'number' ? input.default * 2 : 100),
          value: input.default
        }))
      
      setInputParams(params)
      setActiveStep(2)
    } catch (error) {
      console.error("Error parsing Pine script:", error)
      // In a real app, show error message to user
    }
  }
  
  // Handle updating input parameter values
  const handleInputChange = (index: number, field: string, value: any) => {
    const updatedParams = [...inputParams]
    const param = { ...updatedParams[index] }
    
    // Update the field
    param[field] = value
    
    // Ensure min ≤ default ≤ max
    if (field === 'min' && param.min > param.value) {
      param.value = param.min
    }
    if (field === 'min' && param.min > param.max) {
      param.max = param.min
    }
    if (field === 'max' && param.max < param.value) {
      param.value = param.max
    }
    if (field === 'max' && param.max < param.min) {
      param.min = param.max
    }
    if (field === 'value' && param.value < param.min) {
      param.min = param.value
    }
    if (field === 'value' && param.value > param.max) {
      param.max = param.value
    }
    
    updatedParams[index] = param
    setInputParams(updatedParams)
  }
  
  // Handle strategy settings changes
  const handleStrategySettingsChange = (settings: any) => {
    setStrategySettings(settings)
  }
  
  // Start backtest process
  const handleStartBacktest = async () => {
    if (!symbol || !strategySettings?.timeframe) {
      // In a real app, show validation error
      return
    }
    
    try {
      // First check balance via the check-balance endpoint
      const balanceResponse = await fetch('/api/check-balance')
      if (!balanceResponse.ok) {
        throw new Error('Failed to check balance')
      }
      
      // Refresh the coin balance display
      await refreshCoinBalance()
      
      // Check if user has sufficient coins for backtest
      const response = await fetch('/api/check-service-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'backtest' })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.hasSufficientCoins) {
        // Show error dialog instead of alert
        setErrorDetails({
          requiredCoins: data.requiredCoins,
          currentBalance: data.coinBalance
        })
        setValidationError(true)
        return
      }
      
      // Deduct coins for the service
      const deductResponse = await fetch('/api/deduct-service-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'backtest' })
      })
      
      if (!deductResponse.ok) {
        const deductData = await deductResponse.json()
        alert(deductData.error || 'Failed to process payment for this service')
        return
      }
      
      // Refresh the coin balance display again after deduction
      await refreshCoinBalance()
      
      // If we get here, coins were successfully deducted
      // Continue with the backtest process
      setBacktestRunning(true)
      setActiveStep(3)
      
      // Simulate backtest process with countdown
      const interval = setInterval(() => {
        setCountdownTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            
            // Use the date range from settings if available, otherwise fallback to 30 days
            let backtestDays = 30;
            if (strategySettings?.dateRange?.from && strategySettings?.dateRange?.to) {
              backtestDays = getDaysDifference(strategySettings.dateRange.from, strategySettings.dateRange.to);
            }
            
            // Create a seed based on the symbol and pine script
            const seed = symbol.length + pineScript.length;
            
            // Initialize seeded random generator for consistent results
            const random = seededRandom(seed);
            
            // Initialize arrays for data
            const dailyReturns: number[] = [];
            const portfolioValues: number[] = [100]; // Starting with 100 as initial value
            const dailyData: Array<{date: string; return: number; value: number}> = [];
            
            // Create dates for simulation
            const today = new Date();
            let currentDate = new Date();
            
            // Use the from date if available, otherwise fallback to calculating from today
            if (strategySettings?.dateRange?.from) {
              currentDate = new Date(strategySettings.dateRange.from);
            } else {
              currentDate.setDate(today.getDate() - backtestDays);
            }
            
            // Ensure at least 65% of days have negative returns
            const totalDays = backtestDays;
            const minNegativeDays = Math.ceil(totalDays * 0.65);
            let negativeDaysCount = 0;
            let positiveDaysCount = 0;
            
            // Generate all daily returns
            for (let i = 0; i < totalDays; i++) {
              // Move date forward by 1 day
              currentDate.setDate(currentDate.getDate() + 1);
              const dateStr = currentDate.toISOString().split('T')[0];
              
              // Calculate if this day should be negative to ensure we meet the 65% requirement
              // We need (minNegativeDays - negativeDaysCount) more negative days in (totalDays - i) remaining days
              const remainingDays = totalDays - i;
              const remainingRequiredNegative = minNegativeDays - negativeDaysCount;
              const negativeProb = remainingRequiredNegative / remainingDays;
              
              // Determine if this day is positive or negative
              const isNegative = random() < Math.max(0.65, negativeProb);
              
              // Generate returns between -1.17% and 0.92%
              let dailyReturn;
              if (isNegative) {
                // Negative return between -1.17% and 0%
                dailyReturn = -1.17 + (random() * 1.17);
                negativeDaysCount++;
              } else {
                // Positive return between 0% and 0.92%
                dailyReturn = random() * 0.92;
                positiveDaysCount++;
              }
              
              // Round to 2 decimal places
              dailyReturn = Math.round(dailyReturn * 100) / 100;
              
              // Add to return array
              dailyReturns.push(dailyReturn);
              
              // Calculate portfolio value using compound returns
              const prevValue = portfolioValues[portfolioValues.length - 1];
              const newValue = prevValue * (1 + dailyReturn / 100);
              portfolioValues.push(newValue);
              
              // Add to daily data array
              dailyData.push({
                date: dateStr,
                return: dailyReturn,
                value: newValue
              });
            }
            
            // Calculate net profit (sum of all daily returns)
            const netProfit = dailyReturns.reduce((sum, val) => sum + val, 0);
            
            // Calculate max drawdown (between -30% and -55%)
            const maxDrawdownValue = -(30 + random() * 25);
            
            // Calculate Sharpe Ratio (between -1.2 and -0.3)
            const sharpeRatioValue = -(0.3 + random() * 0.9);
            
            // Calculate win rate (actual percentage of positive days)
            const winRateValue = (positiveDaysCount / totalDays) * 100;
            
            // Generate results object
            const results: BacktestResults = {
              netProfit: netProfit.toFixed(2) + '%',
              maxDrawdown: maxDrawdownValue.toFixed(2) + '%',
              sharpeRatio: sharpeRatioValue.toFixed(2),
              winRate: winRateValue.toFixed(2) + '%',
              trades: Math.floor(random() * 50) + 20,
              dailyReturns: dailyReturns,
              portfolioValues: portfolioValues,
              days: backtestDays,
              dailyData: dailyData
            }
            
            setBacktestResults(results)
            setBacktestRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error processing backtest payment:', error)
      alert('An error occurred while processing your request. Please try again.')
    }
  }
  
  // Load a sample Pine Script for testing
  const loadSamplePineScript = () => {
    const sampleScript = `
// This Pine Script™ code is subject to the terms of the Mozilla Public License 2.0.
// © TradingView

//@version=5
strategy("Sample Strategy with Multiple Input Types", overlay=true)

// Numeric inputs
factor = input.float(2.0, title="Volatility Factor", minval=0.5, maxval=5.0)
length = input.int(14, title="RSI Length", minval=1, maxval=50)
threshold = input(70, title="Threshold")

// Boolean inputs
useATR = input.bool(true, title="Use ATR for Stop Loss")
showLabels = input.bool(false, title="Show Labels")

// String/enum inputs
sourceType = input.string("close", title="Source", options=["open", "high", "low", "close", "hl2", "hlc3", "ohlc4"])
maType = input.string("SMA", title="MA Type", options=["SMA", "EMA", "WMA"])

// Time inputs
startTime = input.time(timestamp("2020-01-01"), title="Backtest Start")
endTime = input.time(timestamp("2023-01-01"), title="Backtest End")

// Color inputs
bullColor = input.color(color.green, title="Bullish Color")
bearColor = input.color(color.red, title="Bearish Color")

// Source type
src = input(close, title="Source")

// Strategy logic
rsi = ta.rsi(close, length)
atr = ta.atr(14)
upper = ta.sma(high, 20) + atr * factor
lower = ta.sma(low, 20) - atr * factor

if rsi > threshold and useATR
    strategy.entry("Long", strategy.long)

if rsi < 100 - threshold
    strategy.close("Long")

plotchar(showLabels ? rsi : na, "RSI Value", "•", location.absolute, bullColor, size=size.tiny)
    `;
    
    setPineScript(sampleScript);
  }
  
  // Get days difference for backtest date range
  const getDaysDifference = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  
  // Function to scroll to element
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  return (
    <div className="space-y-12 max-w-5xl mx-auto font-mono bg-black min-h-screen relative">
      {/* Grid background overlay */}
      {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div> */}
      
      {/* Validation Error Dialog */}
      <ServiceValidationError 
        isOpen={validationError}
        onClose={() => setValidationError(false)}
        service="backtest"
        requiredCoins={errorDetails.requiredCoins}
        currentBalance={errorDetails.currentBalance}
      />
      
      {/* Step indicator */}
      <div className="flex items-center justify-between px-6 mb-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded border font-mono text-sm ${activeStep >= 1 ? "bg-zinc-950 text-white border-zinc-800" : "border-zinc-900 text-zinc-600 bg-black"}`}>01</div>
          <span className="mt-2 text-xs uppercase tracking-wider text-zinc-500">Input</span>
        </div>
        <div className={`flex-1 h-px mx-2 ${activeStep >= 2 ? "bg-zinc-800" : "bg-zinc-900"}`}></div>
        <div className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded border font-mono text-sm ${activeStep >= 2 ? "bg-zinc-950 text-white border-zinc-800" : "border-zinc-900 text-zinc-600 bg-black"}`}>02</div>
          <span className="mt-2 text-xs uppercase tracking-wider text-zinc-500">Settings</span>
        </div>
        <div className={`flex-1 h-px mx-2 ${activeStep >= 3 ? "bg-zinc-800" : "bg-zinc-900"}`}></div>
        <div className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded border font-mono text-sm ${activeStep >= 3 ? "bg-zinc-950 text-white border-zinc-800" : "border-zinc-900 text-zinc-600 bg-black"}`}>03</div>
          <span className="mt-2 text-xs uppercase tracking-wider text-zinc-500">Results</span>
        </div>
      </div>

      {/* Step 1: Pine Script Input */}
      <section id="pine-script-section" className="mb-12 relative z-10 px-6">
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
            <CpuIcon className="w-3 h-3 text-white" />
          </div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-white">SCRIPT_INPUT</h2>
          {parsedScript && (
            <div className="ml-3 flex items-center text-[10px] font-mono bg-zinc-950 text-white px-2 py-0.5 border border-zinc-800 uppercase">
              <CheckIcon className="w-3 h-3 mr-1" /> VALIDATED
            </div>
          )}
        </div>
        <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <CardContent className="p-4">
            {/* Pine Script Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs uppercase tracking-wider text-zinc-500 font-mono">PINE SCRIPT:</Label>
                <Button 
                  onClick={loadSamplePineScript}
                  variant="outline" 
                  className="text-xs font-mono uppercase tracking-wider h-6 py-0 px-2 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                >
                  Load Sample
                </Button>
              </div>
              <Textarea
                placeholder={`Enter your Pine Script code here...\n\ne.g., strategy("My Strategy",...)`}
                value={pineScript}
                onChange={(e) => setPineScript(e.target.value)}
                className="h-72 bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:border-zinc-700 focus:ring-0"
              />
            </div>
            
            {!parsedScript ? (
              <Button 
                onClick={handleConvertPineScript}
                className="bg-zinc-950 hover:bg-zinc-900 text-white mt-4 border border-zinc-800 font-mono text-xs uppercase tracking-wider"
              >
                PARSE_SCRIPT()
              </Button>
            ) : (
              <div className="flex items-center text-xs font-mono text-zinc-400 mt-4 border-l-2 border-zinc-800 pl-2">
                <CheckIcon className="w-3 h-3 mr-2 text-white" /> 
                <span className="text-white mr-1">STATUS:</span> SCRIPT_VALIDATED | <span className="text-white mr-1 ml-1">STRATEGY:</span> {parsedScript.strategy}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      
      {/* Step 2: Backtest Settings */}
      {parsedScript && (
        <section id="backtest-settings-section" className="mb-12 relative z-10 px-6">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
              <ServerIcon className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-white">BACKTEST_PARAMETERS</h2>
          </div>
          <div className="space-y-8">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider bg-zinc-950 border-l-2 border-zinc-800 pl-2 py-1 mb-4 text-zinc-400">
                <span className="text-white mr-1">CONFIG:</span> MARKET_CONDITIONS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Symbol Selector */}
                <div>
                  <label className="text-xs uppercase tracking-wider block mb-2 text-zinc-500 font-mono">SYMBOL:</label>
                  <SymbolSearch 
                    onSelect={(selectedSymbol) => setSymbol(selectedSymbol.DISPLAY_NAME)}
                    placeholder="Search for symbols..."
                    className="w-full"
                  />
                  {symbol && (
                    <div className="mt-2 text-xs text-zinc-400 font-mono flex items-center">
                      <span className="text-zinc-500 mr-2">SELECTED:</span>
                      <span className="text-white bg-zinc-800 px-2 py-1 rounded">{symbol}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Strategy Settings Panel */}
              <StrategySettingsPanel 
                isBacktest={true}
                onSettingsChange={handleStrategySettingsChange}
              />
            </div>
            
            <Button 
              onClick={handleStartBacktest}
              disabled={!symbol || !strategySettings?.timeframe}
              className="w-full bg-zinc-950 hover:bg-zinc-900 text-white mt-4 border border-zinc-800 font-mono text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              START_BACKTEST()
              <div className="ml-auto">
                <ServicePriceInfo service="backtest" />
              </div>
            </Button>
          </div>
        </section>
      )}
      
      {/* Step 3: Backtest Results */}
      {activeStep === 3 && (
        <section id="results-section" className="mb-12 relative z-10">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
              <BarChartIcon className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-white">RESULTS</h2>
          </div>
          
          <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <CardContent className="p-6">
              {backtestRunning ? (
                <div className="text-center py-20">
                  <div className="inline-block w-16 h-16 border-2 border-t-transparent border-zinc-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-zinc-400 font-mono mb-1">Running Backtest...</p>
                  <p className="text-xl font-mono text-white mb-4">{countdownTime}s</p>
                </div>
              ) : backtestResults ? (
                <>
                  {/* Results Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                      <div className="text-xs text-zinc-500 font-mono uppercase mb-1">Net Profit</div>
                      <div className={`text-2xl font-mono ${parseFloat(backtestResults.netProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {backtestResults.netProfit}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                      <div className="text-xs text-zinc-500 font-mono uppercase mb-1">Max Drawdown</div>
                      <div className="text-2xl font-mono text-red-500">
                        {backtestResults.maxDrawdown}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                      <div className="text-xs text-zinc-500 font-mono uppercase mb-1">Sharpe Ratio</div>
                      <div className="text-2xl font-mono text-red-500">
                        {backtestResults.sharpeRatio}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                      <div className="text-xs text-zinc-500 font-mono uppercase mb-1">Win Rate</div>
                      <div className="text-2xl font-mono text-zinc-300">
                        {backtestResults.winRate}
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart */}
                  <div className="mb-8">
                    <div className="text-xs text-zinc-500 font-mono uppercase mb-2">PORTFOLIO VALUE</div>
                    <div className="rounded border border-zinc-800 w-full" style={{ height: "500px" }}>
                      <PortfolioChart 
                        portfolioValues={backtestResults.portfolioValues} 
                        days={backtestResults.days} 
                      />
                    </div>
                  </div>
                  
                  {/* Daily Results Table */}
                  <div className="mb-8">
                    <div className="text-xs text-zinc-500 font-mono uppercase mb-2">DAILY RESULTS</div>
                    <div className="bg-zinc-900 rounded border border-zinc-800 overflow-auto max-h-96">
                      <table className="w-full min-w-full divide-y divide-zinc-800 font-mono text-xs">
                        <thead className="bg-zinc-950">
                          <tr>
                            <th className="px-4 py-2 text-left text-zinc-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-right text-zinc-500 uppercase tracking-wider">Return</th>
                            <th className="px-4 py-2 text-right text-zinc-500 uppercase tracking-wider">Portfolio Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {backtestResults.dailyData?.map((day, index) => (
                            <tr key={index} className="hover:bg-zinc-800/30">
                              <td className="px-4 py-2 text-zinc-400">{day.date}</td>
                              <td className={`px-4 py-2 text-right ${day.return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {day.return >= 0 ? '+' : ''}{day.return.toFixed(2)}%
                              </td>
                              <td className="px-4 py-2 text-right text-zinc-300">
                                {day.value.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 text-xs text-zinc-500 font-mono">
                      <span className="text-zinc-400">Note:</span> This is a simulated backtest. Results are randomly generated based on 
                      the specified parameters for demonstration purposes. Real backtests would use historical market data and apply your 
                      strategy logic.
                    </div>
                  </div>
                  
                  {/* Optimization Panel */}
                  <div className="mb-8 bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-lg border border-zinc-800 p-6 shadow-lg relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
                      <div className="mb-4 md:mb-0 md:mr-6">
                        <h3 className="text-lg font-mono text-white mb-2 tracking-tight">Want to improve your strategy?</h3>
                        <p className="text-sm text-zinc-400 max-w-md">
                          Our AI-powered optimization engine can help you find the best parameters for your strategy to maximize returns and minimize risk.
                        </p>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => window.location.href = "/optimization"}
                          className="bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 font-mono text-xs uppercase tracking-wider px-6 py-2"
                        >
                          OPTIMIZE_STRATEGY()
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      onClick={() => {
                        setActiveStep(2);
                        setBacktestResults(null);
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 font-mono text-xs uppercase tracking-wider"
                    >
                      Back to Settings
                    </Button>
                    
                    <Button
                      onClick={handleStartBacktest}
                      className="bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 font-mono text-xs uppercase tracking-wider"
                    >
                      Run Again
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </section>
      )}
      
      {/* Terminal footer */}
      <div className="border-t border-zinc-900 p-2 text-zinc-600 text-[10px] font-mono bg-zinc-950 sticky bottom-0 z-10 flex justify-between">
        <div>[SYSTEM v1.0.4]</div>
        <div>STATUS: {backtestRunning ? "PROCESSING" : (backtestResults ? "COMPLETED" : "READY")}</div>
      </div>
      
      {/* Add CSS for the loading animation */}
      <style jsx global>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
} 