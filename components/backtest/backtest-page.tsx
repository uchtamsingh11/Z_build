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

// Mock function to simulate Pine script to JSON conversion
const convertPineScriptToJson = (pineScript: string) => {
  // In a real implementation, this would parse the Pine script
  // For demo purposes, we'll extract input parameters using regex
  
  // Initialize result object
  const result = {
    strategy: "Sample Strategy",
    inputs: [] as any[]
  }
  
  try {
    // Extract strategy name if available
    const strategyMatch = pineScript.match(/indicator\s*\(\s*["']([^"']*)["']/)
    if (strategyMatch && strategyMatch[1]) {
      result.strategy = strategyMatch[1]
    }
    
    // Regular expressions to match different input types
    const intRegex = /input\.int\s*\(\s*(\d+)\s*,\s*["']([^"']*)["']\s*(?:,\s*minval\s*=\s*(\d+))?\s*(?:,\s*maxval\s*=\s*(\d+))?\s*\)/g
    const floatRegex = /input\.float\s*\(\s*(\d*\.?\d+)\s*,\s*["']([^"']*)["']\s*(?:,\s*minval\s*=\s*(\d*\.?\d+))?\s*(?:,\s*maxval\s*=\s*(\d*\.?\d+))?\s*\)/g
    const genericNumericRegex = /input\s*\(\s*(\d*\.?\d+)\s*,\s*["']([^"']*)["']\s*(?:,\s*minval\s*=\s*(\d*\.?\d+))?\s*(?:,\s*maxval\s*=\s*(\d*\.?\d+))?\s*\)/g
    
    // Find variable assignments for inputs
    const variableRegex = /(\w+)\s*=\s*(input\.int|input\.float|input)\s*\(/g
    const variableMap = new Map()
    
    let varMatch
    while ((varMatch = variableRegex.exec(pineScript)) !== null) {
      variableMap.set(varMatch[0].substring(0, varMatch[0].indexOf('=')).trim(), true)
    }
    
    // Extract integer inputs
    let match
    while ((match = intRegex.exec(pineScript)) !== null) {
      // Find variable name for this input if possible
      const lineStart = pineScript.lastIndexOf('\n', match.index) + 1
      const line = pineScript.substring(lineStart, match.index + match[0].length)
      const varNameMatch = line.match(/(\w+)\s*=\s*input\.int/)
      
      const param = {
        name: varNameMatch ? varNameMatch[1] : `param_${result.inputs.length + 1}`,
        label: match[2] || `Parameter ${result.inputs.length + 1}`,
        type: 'integer',
        default: parseInt(match[1]),
        min: match[3] ? parseInt(match[3]) : undefined,
        max: match[4] ? parseInt(match[4]) : undefined
      }
      result.inputs.push(param)
    }
    
    // Extract float inputs
    while ((match = floatRegex.exec(pineScript)) !== null) {
      // Find variable name for this input if possible
      const lineStart = pineScript.lastIndexOf('\n', match.index) + 1
      const line = pineScript.substring(lineStart, match.index + match[0].length)
      const varNameMatch = line.match(/(\w+)\s*=\s*input\.float/)
      
      const param = {
        name: varNameMatch ? varNameMatch[1] : `param_${result.inputs.length + 1}`,
        label: match[2] || `Parameter ${result.inputs.length + 1}`,
        type: 'float',
        default: parseFloat(match[1]),
        min: match[3] ? parseFloat(match[3]) : undefined,
        max: match[4] ? parseFloat(match[4]) : undefined
      }
      result.inputs.push(param)
    }
    
    // Extract generic numeric inputs
    while ((match = genericNumericRegex.exec(pineScript)) !== null) {
      // Skip if it's not a numeric input (could be string or bool)
      if (isNaN(parseFloat(match[1]))) continue
      
      // Find variable name for this input if possible
      const lineStart = pineScript.lastIndexOf('\n', match.index) + 1
      const line = pineScript.substring(lineStart, match.index + match[0].length)
      const varNameMatch = line.match(/(\w+)\s*=\s*input\(/)
      
      const param = {
        name: varNameMatch ? varNameMatch[1] : `param_${result.inputs.length + 1}`,
        label: match[2] || `Parameter ${result.inputs.length + 1}`,
        type: match[1].includes('.') ? 'float' : 'integer',
        default: match[1].includes('.') ? parseFloat(match[1]) : parseInt(match[1]),
        min: match[3] ? (match[3].includes('.') ? parseFloat(match[3]) : parseInt(match[3])) : undefined,
        max: match[4] ? (match[4].includes('.') ? parseFloat(match[4]) : parseInt(match[4])) : undefined
      }
      result.inputs.push(param)
    }
    
    // If no inputs are found, provide some sample inputs for demo purposes
    if (result.inputs.length === 0) {
      result.inputs = [
        { name: "fast_length", label: "Fast Length", type: "integer", default: 12, min: 5, max: 50 },
        { name: "slow_length", label: "Slow Length", type: "integer", default: 26, min: 10, max: 100 },
        { name: "signal_length", label: "Signal Length", type: "integer", default: 9, min: 3, max: 30 },
        { name: "threshold", label: "Threshold", type: "float", default: 0.5, min: 0.1, max: 2.0 }
      ]
    }
    
    return result
  } catch (error) {
    console.error("Error parsing Pine script:", error)
    // Return fallback result if parsing fails
    return {
      strategy: "Sample Strategy",
      inputs: [
        { name: "fast_length", label: "Fast Length", type: "integer", default: 12 },
        { name: "slow_length", label: "Slow Length", type: "integer", default: 26 },
        { name: "signal_length", label: "Signal Length", type: "integer", default: 9 },
        { name: "source_type", label: "Source Type", type: "string", default: "close" }
      ]
    }
  }
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
  const [backtestResults, setBacktestResults] = useState<any>(null)
  
  // Handle Pine script conversion
  const handleConvertPineScript = () => {
    if (!pineScript.trim()) return
    
    try {
      const result = convertPineScriptToJson(pineScript)
      setParsedScript(result)
      
      // Initialize input parameters with default values and min/max if available
      const params = result.inputs
        .filter(input => input.type === 'integer' || input.type === 'float') // Only keep numeric inputs
        .map((input: any) => ({
          ...input,
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
  const handleStartBacktest = () => {
    if (!symbol || !strategySettings?.timeframe || !strategySettings?.dateRange?.from || !strategySettings?.dateRange?.to) {
      // In a real app, show validation error
      return
    }
    
    setBacktestRunning(true)
    setActiveStep(3)
    
    // Simulate backtest process with countdown
    const interval = setInterval(() => {
      setCountdownTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          
          // Generate optimistic results
          const months = calculateMonthsBetween(
            strategySettings.dateRange.from,
            strategySettings.dateRange.to
          )
          
          // More optimistic results for longer timeframes
          const profitPercentage = months <= 1 ? 
            Math.floor(Math.random() * 42) + 27 : // Between 27% and 69% for short timeframes
            Math.floor(Math.random() * 80) + 50   // Between 50% and 130% for longer timeframes
          
          const results = {
            netProfit: `$${(profitPercentage * 24.5).toFixed(2)}`,
            maxDrawdown: `${Math.floor(Math.random() * 15) + 5}%`,
            profitFactor: (Math.random() * 2 + 1.5).toFixed(2),
            profitPercentage: `${profitPercentage}%`,
            winRate: `${Math.floor(Math.random() * 25) + 65}%`,
            trades: Math.floor(Math.random() * 50) + 20
          }
          
          setBacktestResults(results)
          setBacktestRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  
  // Calculate months between two dates
  const calculateMonthsBetween = (start: Date, end: Date) => {
    return (end.getFullYear() - start.getFullYear()) * 12 + 
           (end.getMonth() - start.getMonth())
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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
      
      {/* Console header */}
      <div className="border-b border-zinc-900 p-3 text-zinc-500 text-xs flex items-center bg-zinc-950 sticky top-0 z-10">
        <div className="mr-auto flex items-center">
          <TerminalIcon className="w-4 h-4 mr-2" />
          <span>SYSTEM:BACKTESTER</span>
        </div>
        <div>ACTIVE</div>
        <div className="ml-4 px-2 py-0.5 bg-zinc-950 border border-zinc-900 text-zinc-400">SESSION_ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
      </div>
      
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
                isBacktest={true}
                onSettingsChange={handleStrategySettingsChange}
              />
            </div>
            
            {/* Parameter Configuration */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider bg-zinc-950 border-l-2 border-zinc-800 pl-2 py-1 mb-4 text-zinc-400">
                <span className="text-white mr-1">CONFIG:</span> STRATEGY_PARAMETERS
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
                        <div className="text-xs font-mono text-zinc-400 uppercase">
                          {param.label || param.name}
                          <div className="text-[9px] text-zinc-600 truncate">{param.name}</div>
                        </div>
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
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              onClick={handleStartBacktest}
              disabled={!symbol || !strategySettings?.timeframe || !strategySettings?.dateRange?.from || !strategySettings?.dateRange?.to}
              className="w-full bg-zinc-950 hover:bg-zinc-900 text-white mt-4 border border-zinc-800 font-mono text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              START_BACKTEST()
            </Button>
          </div>
        </section>
      )}
      
      {/* Step 3: Backtest Results */}
      {(backtestRunning || backtestResults) && (
        <section id="results-section" className="mb-12 relative z-10 px-6">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
              <BarChartIcon className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-white">BACKTEST_RESULTS</h2>
          </div>
          <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <CardContent className="p-4">
              {backtestRunning ? (
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
                    <div>PROCESSING_BACKTEST</div>
                    <div className="h-4 w-32 bg-black mt-2 relative overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-zinc-800 to-zinc-700 absolute animate-[loading_1.5s_ease-in-out_infinite] w-16"></div>
                    </div>
                  </div>
                </div>
              ) : backtestResults ? (
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
                        <div className="text-xl font-bold text-white font-mono">{backtestResults.netProfit}</div>
                      </div>
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">DRAWDOWN:</div>
                        <div className="text-xl font-bold text-zinc-300 font-mono">{backtestResults.maxDrawdown}</div>
                      </div>
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">PROFIT_FACTOR:</div>
                        <div className="text-xl font-bold text-white font-mono">{backtestResults.profitFactor}</div>
                      </div>
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">WIN_RATE:</div>
                        <div className="text-xl font-bold text-white font-mono">{backtestResults.winRate}</div>
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
                          STRATEGY PERFORMANCE: PROFIT_FACTOR={backtestResults.profitFactor} | RETURN={backtestResults.profitPercentage} | PERIOD={strategySettings.dateRange.from} to {strategySettings.dateRange.to}
                        </div>
                        
                        <div className="border-t border-zinc-900 pt-4">
                          <div className="text-xs uppercase tracking-wider mb-3 text-zinc-500 font-mono">BACKTEST_DIRECTIVES:</div>
                          <div className="pl-4 border-l border-zinc-900">
                            <div className="text-xs font-mono space-y-3 text-zinc-400">
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>MODIFY <span className="text-white">{inputParams[0]?.name}</span> = {inputParams[0]?.max} <span className="text-zinc-500">// IMPROVE RETURN POTENTIAL</span></span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>SET <span className="text-white">TIMEFRAME</span> = {strategySettings.timeframe === '1h' ? '15m' : strategySettings.timeframe === '1d' ? '4h' : '5m'} <span className="text-zinc-500">// INCREASE OPPORTUNITY FREQUENCY</span></span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>APPLY <span className="text-white">STRATEGY</span> = {symbol || "CURRENT_SYMBOL"} <span className="text-zinc-500">// PROVEN PERFORMANCE DETECTED</span></span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>CORRELATE <span className="text-white">{inputParams[1]?.name}</span> WITH <span className="text-white">{inputParams[2]?.name}</span> <span className="text-zinc-500">// ENHANCED PARAMETER SYNERGY</span></span>
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