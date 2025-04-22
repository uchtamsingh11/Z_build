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
  // For demo purposes, we'll return a mock result with some inputs
  return {
    strategy: "Sample Strategy",
    inputs: [
      { name: "fast_length", type: "integer", default: 12 },
      { name: "slow_length", type: "integer", default: 26 },
      { name: "signal_length", type: "integer", default: 9 },
      { name: "source_type", type: "string", default: "close" },
    ]
  }
}

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
  
  // Handle Pine script conversion
  const handleConvertPineScript = () => {
    if (!pineScript.trim()) return
    
    try {
      const result = convertPineScriptToJson(pineScript)
      setParsedScript(result)
      
      // Initialize input parameters with default values
      const params = result.inputs.map((input: any) => ({
        ...input,
        min: typeof input.default === 'number' ? input.default * 0.5 : 1,
        max: typeof input.default === 'number' ? input.default * 2 : 100,
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
  const handleStartOptimization = () => {
    if (!symbol || !strategySettings?.timeframe) {
      // In a real app, show validation error
      return
    }
    
    setOptimizationRunning(true)
    setActiveStep(3)
    
    // Simulate optimization process with countdown
    const interval = setInterval(() => {
      setCountdownTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          
          // Generate optimistic results
          const profitPercentage = Math.floor(Math.random() * 80) + 50  // Between 50% and 130%
          
          const results = {
            netProfit: `$${(profitPercentage * 24.5).toFixed(2)}`,
            maxDrawdown: `${Math.floor(Math.random() * 15) + 5}%`,
            profitFactor: (Math.random() * 2 + 1.5).toFixed(2),
            profitPercentage: `${profitPercentage}%`,
            winRate: `${Math.floor(Math.random() * 25) + 65}%`
          }
          
          setOptimizationResults(results)
          setOptimizationRunning(false)
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
          <span>SYSTEM:OPTIMIZER</span>
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
              onClick={handleStartOptimization}
              disabled={!symbol || !strategySettings?.timeframe}
              className="w-full bg-zinc-950 hover:bg-zinc-900 text-white mt-4 border border-zinc-800 font-mono text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              START_OPTIMIZATION()
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
                        <div className="text-xl font-bold text-white font-mono">{optimizationResults.netProfit}</div>
                      </div>
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">DRAWDOWN:</div>
                        <div className="text-xl font-bold text-zinc-300 font-mono">{optimizationResults.maxDrawdown}</div>
                      </div>
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">PROFIT_FACTOR:</div>
                        <div className="text-xl font-bold text-white font-mono">{optimizationResults.profitFactor}</div>
                      </div>
                      <div className="bg-black border border-zinc-900 rounded p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,transparent_1px,#000_1px),linear-gradient(to_bottom,transparent_1px,#000_1px)] bg-[size:16px_16px] opacity-30"></div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">WIN_RATE:</div>
                        <div className="text-xl font-bold text-white font-mono">{optimizationResults.winRate}</div>
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
                          STRATEGY PERFORMANCE: PROFIT_FACTOR={optimizationResults.profitFactor} | RETURN={optimizationResults.profitPercentage} | PERIOD={strategySettings?.dateRange?.from ? strategySettings.dateRange.from.toLocaleDateString() : 'N/A'} to {strategySettings?.dateRange?.to ? strategySettings.dateRange.to.toLocaleDateString() : 'N/A'}
                        </div>
                        
                        <div className="border-t border-zinc-900 pt-4">
                          <div className="text-xs uppercase tracking-wider mb-3 text-zinc-500 font-mono">OPTIMIZATION_DIRECTIVES:</div>
                          <div className="pl-4 border-l border-zinc-900">
                            <div className="text-xs font-mono space-y-3 text-zinc-400">
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>MODIFY <span className="text-white">{inputParams[0]?.name}</span> = {inputParams[0]?.max} <span className="text-zinc-500">// IMPROVE RETURN POTENTIAL</span></span>
                              </div>
                              <div className="flex items-start">
                                <span className="inline-block text-zinc-700 mr-2">$</span>
                                <span>SET <span className="text-white">TIMEFRAME</span> = {strategySettings?.timeframe?.value === '1h' ? '15m' : strategySettings?.timeframe?.value === '1d' ? '4h' : '5m'} <span className="text-zinc-500">// INCREASE OPPORTUNITY FREQUENCY</span></span>
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