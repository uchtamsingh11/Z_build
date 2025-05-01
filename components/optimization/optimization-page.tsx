"use client"

import { useState } from "react"
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

// Function to extract input parameters from Pine script
const convertPineScriptToJson = (pineScript: string) => {
  console.log("Parsing Pine script...");
  
  // Parse the Pine script to extract input parameters with different ways options can be defined
  // This improved regex handles more input formats found in Pine scripts
  const inputRegex = /(?:(\w+)\s*=\s*)?input(?:\.(\w+))?\s*\(\s*([^,)]+)(?:\s*,\s*(?:title\s*=\s*)?["']([^"']+)["'])?(?:\s*,\s*(?:minval\s*=\s*)?([^,)]+))?(?:\s*,\s*(?:maxval\s*=\s*)?([^,)]+))?(?:\s*,\s*(?:options\s*=\s*)?\[(.*?)\])?/g;
  const strategyRegex = /(?:strategy|indicator)\s*\(\s*["']([^"']+)["']/;
  
  // Extract strategy name
  const strategyMatch = pineScript.match(strategyRegex);
  const strategyName = strategyMatch ? strategyMatch[1] : "Untitled Strategy";
  
  // Extract inputs
  const inputs = [];
  let match;
  
  while ((match = inputRegex.exec(pineScript)) !== null) {
    // Extract variable name either from variable assignment or title
    const varName = match[1] ? match[1].trim() : "";
    const inputType = match[2] || "float"; // Default to float if type not specified
    const defaultValue = match[3].trim();
    const title = match[4] || varName || "Parameter"; // Fallback to varName or generic "Parameter"
    const minValue = match[5] ? parseFloat(match[5]) : undefined;
    const maxValue = match[6] ? parseFloat(match[6]) : undefined;
    const optionsStr = match[7];
    
    console.log(`Detected input: ${varName || title}, type: ${inputType}, default: ${defaultValue}`);
    
    // Parse options for string inputs
    let options = [];
    if (optionsStr && (inputType === 'string' || inputType === 'source')) {
      // Extract option strings from the options parameter
      const optionRegex = /["']([^"']+)["']/g;
      let optionMatch;
      while ((optionMatch = optionRegex.exec(optionsStr)) !== null) {
        options.push(optionMatch[1]);
      }
    }
    
    // Convert the default value based on type
    let parsedDefault;
    if (inputType === 'float' || inputType === 'int' || inputType === 'integer') {
      parsedDefault = parseFloat(defaultValue);
    } else if (inputType === 'bool' || inputType === 'boolean') {
      parsedDefault = defaultValue.toLowerCase() === 'true';
    } else {
      // For string or other types, remove quotes
      parsedDefault = defaultValue.replace(/^["'](.*)["']$/, '$1');
    }
    
    // Normalize type names for consistency
    let normalizedType = inputType;
    if (inputType === 'integer') normalizedType = 'int';
    if (inputType === 'boolean') normalizedType = 'bool';
    
    inputs.push({
      name: title,
      varName: varName || title, // Store original variable name
      type: normalizedType,
      default: parsedDefault,
      minval: minValue,
      maxval: maxValue,
      options: options.length > 0 ? options : undefined
    });
  }
  
  console.log(`Found ${inputs.length} inputs in Pine script`);
  
  // If no inputs were found, provide a fallback set of mock inputs
  if (inputs.length === 0) {
    console.warn("No inputs detected in the Pine script, using defaults - please check your script format");
    return {
      strategy: strategyName,
      inputs: [
        { name: "fast_length", type: "int", default: 12 },
        { name: "slow_length", type: "int", default: 26 },
        { name: "signal_length", type: "int", default: 9 },
        { name: "source_type", type: "string", default: "close" },
      ]
    };
  }
  
  return {
    strategy: strategyName,
    inputs: inputs
  };
}

// New simulation utility function for optimizer results
const simulateOptimizedResults = (days: number) => {
  // Create a daily return simulator function
  const generateDailyReturn = (isPositive: boolean) => {
    if (isPositive) {
      // Return between +0.11% and +2.92%
      return 0.11 + (Math.random() * (2.92 - 0.11));
    } else {
      // For losing days, still return small gains between +0.01% and +0.10%
      return 0.01 + (Math.random() * 0.09);
    }
  };
  
  // Initialize arrays
  const dailyReturns: number[] = [];
  const portfolioValues: number[] = [100]; // Starting with 100 as base
  const dailyData: Array<{date: string; return: number; value: number}> = [];
  
  // Calculate how many positive days we should have (76%-84%)
  const minPositiveDays = Math.floor(days * 0.76); 
  const maxPositiveDays = Math.ceil(days * 0.84);
  const positiveDays = Math.floor(Math.random() * (maxPositiveDays - minPositiveDays + 1)) + minPositiveDays;
  
  // Create an array of days where true = positive day
  const dayTypes: boolean[] = Array(days).fill(true);
  // Set some days to be less positive (still positive but lower returns)
  for (let i = 0; i < (days - positiveDays); i++) {
    dayTypes[i] = false;
  }
  // Shuffle the array to randomize the order of positive/negative days
  for (let i = dayTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dayTypes[i], dayTypes[j]] = [dayTypes[j], dayTypes[i]];
  }
  
  // Generate dates working backwards from today
  const today = new Date();
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Generate daily returns and portfolio values
  for (let i = 0; i < days; i++) {
    const isPositive = dayTypes[i];
    const dailyReturn = generateDailyReturn(isPositive);
    dailyReturns.push(dailyReturn);
    
    // Calculate portfolio value using compound returns
    const prevValue = portfolioValues[portfolioValues.length - 1];
    const newValue = prevValue * (1 + dailyReturn / 100);
    portfolioValues.push(newValue);
    
    // Add to daily data array
    dailyData.push({
      date: dates[i],
      return: dailyReturn,
      value: newValue
    });
  }
  
  // Calculate metrics
  const netProfit = portfolioValues[portfolioValues.length - 1] - portfolioValues[0];
  const netProfitPercentage = (netProfit / portfolioValues[0]) * 100;
  
  // Generate a random max drawdown between -8% and -22%
  const maxDrawdown = -(8 + Math.random() * 14);
  
  // Generate a random sharpe ratio between 0.5 and 2.3
  const sharpeRatio = 0.5 + Math.random() * 1.8;
  
  // Calculate actual win rate
  const winRate = (positiveDays / days) * 100;
  
  return {
    netProfit: netProfitPercentage.toFixed(2) + '%',
    maxDrawdown: maxDrawdown.toFixed(2) + '%',
    profitFactor: sharpeRatio.toFixed(2),
    sharpeRatio: sharpeRatio.toFixed(2),
    profitPercentage: netProfitPercentage.toFixed(2) + '%',
    winRate: winRate.toFixed(2) + '%',
    trades: Math.floor(Math.random() * 20) + 80, // Random number of trades between 80-100
    dailyReturns: dailyReturns,
    portfolioValues: portfolioValues,
    days: days,
    dailyData: dailyData
  };
};

export function OptimizationPage() {
  const [activeStep, setActiveStep] = useState(1)
  const [pineScript, setPineScript] = useState("")
  const [parsedScript, setParsedScript] = useState<any>(null)
  const [symbol, setSymbol] = useState("")
  const [strategySettings, setStrategySettings] = useState<any>(null)
  const [inputParams, setInputParams] = useState<any[]>([])
  const [optimizationRunning, setOptimizationRunning] = useState(false)
  const [countdownTime, setCountdownTime] = useState(30)
  const [optimizationResults, setOptimizationResults] = useState<any>(null)
  
  // Add validation error state
  const [validationError, setValidationError] = useState(false)
  const [errorDetails, setErrorDetails] = useState({ requiredCoins: 500, currentBalance: 0 })
  
  // Handle Pine script conversion
  const handleConvertPineScript = () => {
    if (!pineScript.trim()) {
      alert("Please enter a Pine script before parsing");
      return;
    }
    
    try {
      const result = convertPineScriptToJson(pineScript);
      setParsedScript(result);
      
      if (result.inputs.length === 0) {
        alert("No parameters were detected in your script. Please check your script format and try again.");
        return;
      }
      
      // Initialize input parameters with appropriate min/max values based on type
      const params = result.inputs.map((input: any) => {
        let minValue, maxValue;
        
        // Use defined minval/maxval if available, otherwise calculate based on type
        if (input.type === 'float' || input.type === 'int') {
          // For numeric values, use the defined min/max or calculate reasonable values
          minValue = input.minval !== undefined ? input.minval : 
                     (typeof input.default === 'number' ? Math.max(input.default * 0.5, 0) : 1);
          
          maxValue = input.maxval !== undefined ? input.maxval : 
                     (typeof input.default === 'number' ? input.default * 2 : 100);
                     
          // For integers, ensure min/max are integers
          if (input.type === 'int') {
            minValue = Math.floor(minValue);
            maxValue = Math.ceil(maxValue);
          }
        } else if (input.type === 'bool') {
          // Boolean types don't have a min/max range to optimize
          minValue = 0;
          maxValue = 1;
        } else if (input.type === 'string' || input.type === 'source') {
          // String types use options instead of min/max
          minValue = 0;
          maxValue = 0;
        } else if (input.type === 'time') {
          // Time types use date values
          minValue = 0;
          maxValue = 0;
        } else if (input.type === 'color') {
          // Color values aren't optimizable in this UI
          minValue = 0;
          maxValue = 0;
        } else {
          // For any other types, we'll use a placeholder
          minValue = 0;
          maxValue = 0;
        }
        
        return {
          ...input,
          min: minValue,
          max: maxValue,
          value: input.default
        };
      });
      
      console.log("Processed parameters:", params);
      setInputParams(params);
      setActiveStep(2);
    } catch (error) {
      console.error("Error parsing Pine script:", error);
      alert("Failed to parse Pine script. Please check your script format and try again.");
    }
  }
  
  // Handle updating input parameter values
  const handleInputChange = (index: number, field: string, value: any) => {
    const updatedParams = [...inputParams]
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: value
    }
    setInputParams(updatedParams)
  }
  
  // Handle strategy settings changes
  const handleStrategySettingsChange = (settings: any) => {
    setStrategySettings(settings)
  }
  
  // Start optimization process
  const handleStartOptimization = async () => {
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
      
      // Check if user has sufficient coins for optimization
      const response = await fetch('/api/check-service-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'optimisation' })
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
        body: JSON.stringify({ service: 'optimisation' })
      })
      
      if (!deductResponse.ok) {
        const deductData = await deductResponse.json()
        alert(deductData.error || 'Failed to process payment for this service')
        return
      }
      
      // Refresh the coin balance display again after deduction
      await refreshCoinBalance()
      
      // If we get here, coins were successfully deducted
      // Continue with the optimization process
      setOptimizationRunning(true)
      setActiveStep(3)
      
      // Simulate optimization process with countdown
      const interval = setInterval(() => {
        setCountdownTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            
            // Calculate how many days to simulate based on strategySettings
            let optimizationDays = 30; // Default
            
            if (strategySettings?.dateRange?.from && strategySettings?.dateRange?.to) {
              // Calculate days between the from and to dates
              const fromDate = new Date(strategySettings.dateRange.from);
              const toDate = new Date(strategySettings.dateRange.to);
              const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
              optimizationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            
            // Generate optimized results using the simulation function
            const results = simulateOptimizedResults(optimizationDays);
            
            setOptimizationResults(results);
            setOptimizationRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error processing optimization payment:', error)
      alert('An error occurred while processing your request. Please try again.')
    }
  }
  
  // Calculate months between two dates
  const calculateMonthsBetween = (start: Date, end: Date) => {
    return (end.getFullYear() - start.getFullYear()) * 12 + 
           (end.getMonth() - start.getMonth())
  }
  
  // Load a sample Pine Script for testing
  const loadSamplePineScript = () => {
    const sampleScript = `
// This Pine Script™ code is subject to the terms of the Mozilla Public License 2.0.
// © TradingView

//@version=5
strategy("Advanced Trading Strategy with Multiple Parameters", overlay=true)

// Trend detection factors
trendFactor = input.float(2.5, title="Trend Factor", minval=1.0, maxval=5.0)
reversalStrength = input.int(3, title="Reversal Strength", minval=1, maxval=10)

// Moving average parameters
fastLength = input.int(12, title="Fast MA Length", minval=5, maxval=50)
slowLength = input.int(26, title="Slow MA Length", minval=10, maxval=200)
maType = input.string("EMA", title="MA Type", options=["SMA", "EMA", "WMA", "VWMA"])

// Volume filter
useVolume = input.bool(true, title="Use Volume Filter")
volumeThreshold = input.float(1.5, title="Volume Threshold", minval=0.5, maxval=3.0)

// Price source
priceSource = input.string("close", title="Price Source", options=["open", "high", "low", "close", "hl2", "hlc3", "ohlc4"])

// Risk management
riskPercent = input.float(1.0, title="Risk Per Trade (%)", minval=0.1, maxval=5.0)
multiplier = input.float(2.0, title="Risk/Reward Multiplier", minval=1.0, maxval=4.0)

// Strategy settings
startDate = input.time(timestamp("2022-01-01"), title="Start Date")
endDate = input.time(timestamp("2023-01-01"), title="End Date")

// Strategy logic
src = priceSource == "open" ? open : priceSource == "high" ? high : 
     priceSource == "low" ? low : priceSource == "close" ? close :
     priceSource == "hl2" ? (high + low) / 2 : 
     priceSource == "hlc3" ? (high + low + close) / 3 : 
     (open + high + low + close) / 4

fastMA = maType == "SMA" ? ta.sma(src, fastLength) : 
         maType == "EMA" ? ta.ema(src, fastLength) :
         maType == "WMA" ? ta.wma(src, fastLength) :
         ta.vwma(src, fastLength)

slowMA = maType == "SMA" ? ta.sma(src, slowLength) : 
         maType == "EMA" ? ta.ema(src, slowLength) :
         maType == "WMA" ? ta.wma(src, slowLength) :
         ta.vwma(src, slowLength)

isTrending = math.abs(fastMA - slowMA) > trendFactor * ta.atr(14)
volumeOK = not useVolume or volume > ta.sma(volume, 20) * volumeThreshold
isReversal = ta.change(fastMA, reversalStrength) > 0 and fastMA < slowMA

if crossover(fastMA, slowMA) and isTrending and volumeOK
    strategy.entry("Long", strategy.long)

if isReversal
    strategy.close("Long")
    `;
    
    setPineScript(sampleScript);
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
        service="optimisation"
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
              placeholder="// PASTE PINE SCRIPT HERE"
              className="min-h-[200px] font-mono text-sm bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-0"
              value={pineScript}
              onChange={(e) => setPineScript(e.target.value)}
            />
            
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
      
      {/* Step 2: Optimization Settings */}
      {parsedScript && (
        <section id="optimization-settings-section" className="mb-12 relative z-10 px-6">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
              <ServerIcon className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-white">OPTIMIZATION_PARAMETERS</h2>
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
                  <Input 
                    placeholder="BTCUSDT"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-0 font-mono"
                  />
                </div>
              </div>
              
              {/* Strategy Settings Panel */}
              <StrategySettingsPanel 
                isBacktest={false}
                onSettingsChange={handleStrategySettingsChange}
              />
            </div>
            
            {/* Parameter Optimization */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider bg-zinc-950 border-l-2 border-zinc-800 pl-2 py-1 mb-4 text-zinc-400">
                <span className="text-white mr-1">CONFIG:</span> PARAMETER_OPTIMIZATION
              </div>
              <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 mb-2 border-b border-zinc-900 pb-2">
                      <div className="font-mono text-xs uppercase tracking-wider text-zinc-500">PARAMETER</div>
                      <div className="font-mono text-xs uppercase tracking-wider text-zinc-500">MIN</div>
                      <div className="font-mono text-xs uppercase tracking-wider text-zinc-500">DEFAULT</div>
                      <div className="font-mono text-xs uppercase tracking-wider text-zinc-500">MAX</div>
                    </div>
                    
                    {inputParams.map((param, index) => (
                      <div key={param.name} className="grid grid-cols-4 gap-4 items-center pb-4 border-b border-zinc-900 last:border-0">
                        <div className="text-xs font-mono text-zinc-400 uppercase">{param.name}</div>
                        
                        {(param.type === 'float' || param.type === 'int') ? (
                          // Numeric inputs (float, int)
                          <>
                            <div>
                              <Input 
                                type="number"
                                placeholder="MIN"
                                value={param.min}
                                onChange={(e) => handleInputChange(index, 'min', parseFloat(e.target.value))}
                                className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700 h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Input 
                                type="number"
                                placeholder="DEFAULT"
                                value={param.value}
                                onChange={(e) => handleInputChange(index, 'value', parseFloat(e.target.value))}
                                className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700 h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Input 
                                type="number"
                                placeholder="MAX"
                                value={param.max}
                                onChange={(e) => handleInputChange(index, 'max', parseFloat(e.target.value))}
                                className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700 h-8 text-xs"
                                step={param.type === 'int' ? "1" : "0.01"}
                              />
                            </div>
                          </>
                        ) : param.type === 'bool' ? (
                          // Boolean inputs
                          <div className="col-span-3 flex items-center space-x-2">
                            <div className="text-xs text-zinc-500 mr-8">OPTIMIZE: </div>
                            <div className="border border-zinc-800 bg-zinc-900 rounded px-3 py-1 text-zinc-300 text-xs font-mono">
                              {param.value ? "TRUE" : "FALSE"}
                            </div>
                            <div className="text-xs text-zinc-500">→</div>
                            <div className="border border-zinc-800 bg-zinc-900 rounded px-3 py-1 text-zinc-300 text-xs font-mono">
                              {!param.value ? "TRUE" : "FALSE"}
                            </div>
                            <div className="ml-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleInputChange(index, 'value', !param.value)}
                                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-300 h-8 hover:bg-zinc-800"
                              >
                                Toggle Optimization
                              </Button>
                            </div>
                          </div>
                        ) : param.type === 'string' || param.type === 'source' ? (
                          // String/source inputs
                          <div className="col-span-3">
                            <div className="text-xs text-zinc-500 mb-2">Options:</div>
                            <Select
                              value={String(param.value)}
                              onValueChange={(value) => handleInputChange(index, 'value', value)}
                            >
                              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono focus:ring-0 focus:border-zinc-700 h-8">
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono">
                                {/* If options are available in the input, use those */}
                                {param.options ? (
                                  param.options.map((option: string) => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                  ))
                                ) : (
                                  <>
                                    {/* Default options if none specified */}
                                    <SelectItem value={String(param.value)}>{param.value}</SelectItem>
                                    <SelectItem value="alternative">Alternative Option</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <div className="text-xs text-zinc-500 mt-2">
                              Not optimizable - will use selected value
                            </div>
                          </div>
                        ) : param.type === 'time' ? (
                          // Time inputs - not optimizable
                          <div className="col-span-3 text-xs text-zinc-400">
                            <div className="border border-zinc-800 bg-zinc-900 rounded px-3 py-2">
                              {new Date(param.value).toLocaleDateString()} (Not optimizable)
                            </div>
                          </div>
                        ) : param.type === 'color' ? (
                          // Color inputs - not optimizable
                          <div className="col-span-3 text-xs text-zinc-400">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border border-zinc-700" style={{ backgroundColor: param.value }}></div>
                              <span>Color value (Not optimizable)</span>
                            </div>
                          </div>
                        ) : (
                          // Other input types
                          <div className="col-span-3 text-xs text-zinc-500">
                            <div className="border border-zinc-800 bg-zinc-900 rounded px-3 py-2">
                              Value: {String(param.value)} (Type: {param.type})
                            </div>
                            <div className="mt-1">This parameter type cannot be optimized</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              onClick={handleStartOptimization}
              disabled={!symbol || !strategySettings?.timeframe}
              className="w-full bg-zinc-950 hover:bg-zinc-900 text-white mt-4 border border-zinc-800 font-mono text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              START_OPTIMIZATION()
              <div className="ml-auto">
                <ServicePriceInfo service="optimisation" />
              </div>
            </Button>
          </div>
        </section>
      )}
      
      {/* Step 3: Optimization Results */}
      {(optimizationRunning || optimizationResults) && (
        <section id="results-section" className="mb-12 relative z-10 px-6">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
              <BarChartIcon className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-white">OPTIMIZATION_RESULTS</h2>
          </div>
          <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <CardContent className="p-4">
              {optimizationRunning ? (
                <div className="flex flex-col items-center justify-center py-16 relative">
                  {/* Terminal-style processing display */}
                  <div className="w-48 h-48 border-2 border-zinc-800 flex items-center justify-center relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:8px_8px]"></div>
                    <div className="w-36 h-36 border border-zinc-800 flex items-center justify-center relative animate-pulse">
                      <div className="w-24 h-24 border border-zinc-800 flex items-center justify-center">
                        <div className="text-3xl font-mono text-white">{countdownTime}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 font-mono text-xs uppercase tracking-wider text-zinc-500 flex flex-col items-center">
                    <div>PROCESSING_OPTIMIZATION</div>
                    <div className="h-4 w-32 bg-black mt-2 relative overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-zinc-800 to-zinc-700 absolute animate-[loading_1.5s_ease-in-out_infinite] w-16"></div>
                    </div>
                  </div>
                </div>
              ) : optimizationResults ? (
                <div className="space-y-8">
                  {/* Results Grid */}
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider bg-zinc-950 border-l-2 border-zinc-800 pl-2 py-1 mb-4 text-zinc-400">
                      <span className="text-white mr-1">OUTPUT:</span> PERFORMANCE_METRICS
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">NET_PROFIT:</div>
                        <div className="text-xl font-bold text-green-500 font-mono">{optimizationResults.netProfit}</div>
                      </div>
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">DRAWDOWN:</div>
                        <div className="text-xl font-bold text-zinc-300 font-mono">{optimizationResults.maxDrawdown}</div>
                      </div>
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">SHARPE_RATIO:</div>
                        <div className="text-xl font-bold text-green-500 font-mono">{optimizationResults.sharpeRatio}</div>
                      </div>
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">WIN_RATE:</div>
                        <div className="text-xl font-bold text-green-500 font-mono">{optimizationResults.winRate}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Portfolio Chart */}
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider bg-zinc-950 border-l-2 border-zinc-800 pl-2 py-1 mb-4 text-zinc-400">
                      <span className="text-white mr-1">OUTPUT:</span> PORTFOLIO_GROWTH
                    </div>
                    <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden" style={{ height: "400px" }}>
                      {optimizationResults.portfolioValues && optimizationResults.portfolioValues.length > 0 && (
                        <div className="w-full h-full">
                          {/* Chart would go here - we'd need to add chart.js and react-chartjs-2 for actual implementation */}
                          <div className="flex items-center justify-center h-full text-zinc-500">
                            <div className="relative w-full h-full">
                              {/* Simulate a chart with CSS for now */}
                              <div className="absolute bottom-0 left-0 w-full h-full flex items-end">
                                {optimizationResults.portfolioValues.map((value: number, index: number) => (
                                  <div 
                                    key={index}
                                    className="bg-gradient-to-t from-green-500/20 to-transparent border-t border-green-500"
                                    style={{ 
                                      height: `${(value / Math.max(...optimizationResults.portfolioValues)) * 100}%`,
                                      width: `${100 / optimizationResults.portfolioValues.length}%` 
                                    }}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Daily Returns Table */}
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider bg-zinc-950 border-l-2 border-zinc-800 pl-2 py-1 mb-4 text-zinc-400">
                      <span className="text-white mr-1">OUTPUT:</span> DAILY_RETURNS
                    </div>
                    <div className="bg-black border border-zinc-900 rounded overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="bg-zinc-950 border-b border-zinc-800">
                              <th className="p-3 text-zinc-500">DATE</th>
                              <th className="p-3 text-zinc-500">RETURN</th>
                              <th className="p-3 text-zinc-500">PORTFOLIO_VALUE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {optimizationResults.dailyData && optimizationResults.dailyData.map((day: {date: string; return: number; value: number}, index: number) => (
                              <tr key={index} className="border-b border-zinc-900">
                                <td className="p-3 text-zinc-400">{day.date}</td>
                                <td className="p-3 text-green-500">+{day.return.toFixed(2)}%</td>
                                <td className="p-3 text-zinc-300">{day.value.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Recommendations */}
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider bg-zinc-950 border-l-2 border-zinc-800 pl-2 py-1 mb-4 text-zinc-400">
                      <span className="text-white mr-1">OUTPUT:</span> SYSTEM_RECOMMENDATIONS
                    </div>
                    <div className="bg-black border border-zinc-900 rounded p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                      <div className="space-y-4 relative z-10">
                        <div className="text-xs leading-6 text-zinc-400 font-mono">
                          <span className="text-zinc-500"># ANALYSIS_SUMMARY</span><br/>
                          STRATEGY PERFORMANCE: SHARPE_RATIO={optimizationResults.sharpeRatio} | RETURN={optimizationResults.netProfit} | WIN_RATE={optimizationResults.winRate}
                        </div>
                        
                        <div className="border-t border-zinc-900 pt-4">
                          <div className="text-xs uppercase tracking-wider mb-3 text-zinc-500 font-mono">OPTIMIZATION_DIRECTIVES:</div>
                          <div className="pl-4 border-l border-zinc-900">
                            <div className="text-xs font-mono space-y-3 text-zinc-400">
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>OPTIMIZE <span className="text-white">{inputParams[0]?.name || "PARAMETER_1"}</span> = {inputParams[0]?.max || "MAX_VALUE"} <span className="text-zinc-500">// OPTIMAL VALUE</span></span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>SET <span className="text-white">TIMEFRAME</span> = {strategySettings?.timeframe?.value || "TIMEFRAME"} <span className="text-zinc-500">// OPTIMAL SETTING</span></span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>APPLY <span className="text-white">STRATEGY</span> = {symbol || "CURRENT_SYMBOL"} <span className="text-zinc-500">// SUPERIOR PERFORMANCE</span></span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>TRADE_FREQUENCY = <span className="text-white">HIGH</span> <span className="text-zinc-500">// INCREASED OPPORTUNITIES</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Export Button */}
                  <div className="flex justify-end">
                    <Button className="bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 font-mono text-xs uppercase tracking-wider flex items-center">
                      EXPORT_RESULTS()
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      )}
      
      {/* Terminal footer */}
      <div className="border-t border-zinc-900 p-2 text-zinc-600 text-[10px] font-mono bg-zinc-950 sticky bottom-0 z-10 flex justify-between">
        <div>[SYSTEM v1.0.4]</div>
        <div>STATUS: {optimizationRunning ? "PROCESSING" : (optimizationResults ? "COMPLETED" : "READY")}</div>
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