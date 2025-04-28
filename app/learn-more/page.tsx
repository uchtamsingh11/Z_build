'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { HeroHeader } from '@/components/hero5-header'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  BarChart2, 
  TrendingUp, 
  Copy, 
  Users, 
  Code, 
  Terminal, 
  Zap, 
  Clock, 
  Bot, 
  Shield, 
  Lightbulb, 
  PieChart,
  ChevronRight,
  ArrowRight,
  Star,
  Award,
  Cpu,
  Activity,
  LineChart,
  BarChart,
  Workflow,
  LucideIcon
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6
    }
  }
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits?: string[];
  className?: string;
}

const FeatureCard = ({ icon: Icon, title, description, benefits, className = "" }: FeatureCardProps) => {
  return (
    <motion.div
      variants={fadeInUp}
      className={`relative bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 overflow-hidden group h-full ${className}`}
    >
      <div className="absolute -right-20 -bottom-20 w-40 h-40 rounded-full bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-all duration-700"></div>
      
      <div className="flex items-center mb-4">
        <div className="bg-zinc-800 p-2 rounded-lg mr-4 group-hover:bg-zinc-700 transition-all duration-300 flex-shrink-0">
          <Icon className="h-6 w-6 text-blue-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-white font-mono uppercase leading-tight break-words text-wrap">{title}</h3>
        </div>
      </div>
      
      <p className="text-gray-300 font-mono uppercase text-sm leading-relaxed break-words text-wrap">
        {description}
      </p>
      
      {benefits && (
        <ul className="mt-4 space-y-2">
          {benefits.map((benefit: string, index: number) => (
            <li key={index} className="flex items-start text-gray-300">
              <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0 mt-1" />
              <span className="font-mono uppercase text-sm break-words text-wrap min-w-0">{benefit}</span>
            </li>
          ))}
        </ul>
      )}
      
      <div className="absolute inset-0 border border-blue-500/0 rounded-xl group-hover:border-blue-500/20 pointer-events-none transition-all duration-700"></div>
    </motion.div>
  )
}

export default function LearnMorePage() {
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="bg-black min-h-screen relative overflow-hidden">
        {/* Grid background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none"></div>
        
        {/* Gradient elements */}
        <div className="absolute top-[15%] -left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[5%] right-[5%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        
        <div className="container mx-auto px-4 sm:px-6 py-24 max-w-6xl relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-20"
          >
            {/* Hero Section */}
            <motion.div 
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <Badge variant="outline" className="mb-6 py-1.5 px-4 border-zinc-700 bg-zinc-800/50 backdrop-blur-md text-white font-mono">
                ALGOZ_TRADING_PLATFORM
              </Badge>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 font-mono uppercase tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  ALL_ABOUT_ALGOZ_TECH
                </span>
              </h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-gray-300 font-mono uppercase text-lg max-w-3xl mx-auto leading-relaxed break-words text-wrap"
              >
                THE_ALGOZ_TEAM_HAS_CREATED_A_REVOLUTIONARY_ALGORITHMIC_TRADING_PLATFORM_DESIGNED_TO_TRANSFORM_HOW_TRADERS_OPERATE_IN_TODAY'S_MARKETS.
              </motion.p>
              
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-mono rounded-xl"
                >
                  <Link href="/auth">
                    <span className="uppercase flex items-center">
                      GET_STARTED
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="border-zinc-700 text-white hover:bg-zinc-800 font-mono rounded-xl"
                >
                  <Link href="/#pricing">
                    <span className="uppercase">VIEW_PRICING</span>
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Mission Statement */}
            <motion.div 
              variants={scaleIn}
              className="relative p-8 md:p-12 bg-gradient-to-br from-zinc-900/80 to-zinc-800/20 rounded-2xl border border-zinc-800 backdrop-blur-sm overflow-hidden"
            >
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]"></div>
              
              <h2 className="text-3xl font-semibold text-white mb-6 font-mono uppercase flex items-center">
                <Shield className="h-8 w-8 text-blue-400 mr-3" />
                OUR_MISSION
              </h2>
              
              <p className="text-gray-300 font-mono uppercase text-lg leading-relaxed break-words text-wrap">
                OUR_MISSION_IS_TO_DEMOCRATIZE_ALGORITHMIC_TRADING,_MAKING_IT_ACCESSIBLE_TO_TRADERS_OF_ALL_SKILL_LEVELS._WHETHER_YOU'RE_A_BEGINNER_OR_A_SEASONED_PROFESSIONAL,_OUR_PLATFORM_PROVIDES_THE_TOOLS_AND_RESOURCES_YOU_NEED_TO_SUCCEED.
              </p>
              
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Star className="h-10 w-10 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white font-mono uppercase">EXCELLENCE</h3>
                  <p className="mt-2 text-zinc-400 font-mono uppercase break-words text-wrap">STRIVING_FOR_THE_HIGHEST_QUALITY_IN_ALL_OUR_PRODUCTS</p>
                </div>
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Cpu className="h-10 w-10 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white font-mono uppercase">INNOVATION</h3>
                  <p className="mt-2 text-zinc-400 font-mono uppercase break-words text-wrap">PIONEERING_NEW_TECHNOLOGIES_AND_TRADING_METHODS</p>
                </div>
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Users className="h-10 w-10 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white font-mono uppercase">COMMUNITY</h3>
                  <p className="mt-2 text-zinc-400 font-mono uppercase break-words text-wrap">BUILDING_A_COLLABORATIVE_ECOSYSTEM_OF_TRADERS</p>
                </div>
              </div>
            </motion.div>

            {/* Core Features Section */}
            <motion.section
              variants={fadeInUp}
              className="mb-24"
            >
              <div className="flex items-center mb-12">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-grow"></div>
                <h2 className="text-3xl font-semibold text-white mx-4 font-mono uppercase px-4 break-words text-wrap">CORE_FEATURES</h2>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-grow"></div>
              </div>
              
              <Tabs defaultValue="trading" className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 bg-zinc-900/50 rounded-xl mb-8">
                  <TabsTrigger value="trading" className="py-3 data-[state=active]:text-white data-[state=active]:bg-zinc-800 rounded-lg font-mono uppercase text-xs sm:text-sm break-words text-wrap">
                    TRADING_TOOLS
                  </TabsTrigger>
                  <TabsTrigger value="charting" className="py-3 data-[state=active]:text-white data-[state=active]:bg-zinc-800 rounded-lg font-mono uppercase text-xs sm:text-sm break-words text-wrap">
                    CHARTING
                  </TabsTrigger>
                  <TabsTrigger value="scalping" className="py-3 data-[state=active]:text-white data-[state=active]:bg-zinc-800 rounded-lg font-mono uppercase text-xs sm:text-sm break-words text-wrap">
                    SCALPING
                  </TabsTrigger>
                  <TabsTrigger value="copying" className="py-3 data-[state=active]:text-white data-[state=active]:bg-zinc-800 rounded-lg font-mono uppercase text-xs sm:text-sm break-words text-wrap">
                    COPY_TRADING
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="trading" className="mt-0 outline-none ring-0 focus:outline-none focus:ring-0">
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6 sm:gap-8"
                  >
                    <FeatureCard
                      icon={TrendingUp}
                      title="TRADINGVIEW_AUTOMATION"
                      description="SEAMLESSLY_CONVERT_YOUR_TRADINGVIEW_ALERTS_INTO_REAL_ORDERS_ACROSS_MULTIPLE_BROKERS._EXECUTE_PINE_SCRIPT_STRATEGIES_IN_REAL-TIME_WITH_ZERO_LATENCY."
                      benefits={[
                        "INSTANT_ORDER_EXECUTION_WITHOUT_HUMAN_INTERVENTION",
                        "MULTI-BROKER_SUPPORT_WITH_UNIFIED_INTERFACE",
                        "CUSTOM_ALERT_PARSING_FOR_COMPLEX_STRATEGIES",
                        "DETAILED_EXECUTION_LOGS_AND_PERFORMANCE_METRICS",
                        "AUTO-RECOVERY_SYSTEM_IN_CASE_OF_CONNECTION_ISSUES"
                      ]}
                      className="lg:col-span-2"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FeatureCard
                        icon={LineChart}
                        title="ADAPTIVE_ALGORITHMS"
                        description="IMPLEMENT_TRADING_SYSTEMS_THAT_ADAPT_TO_CHANGING_MARKET_CONDITIONS_AUTOMATICALLY,_ADJUSTING_PARAMETERS_BASED_ON_VOLATILITY_AND_TREND_STRENGTH."
                        benefits={[
                          "VOLATILITY-ADJUSTED_POSITION_SIZING",
                          "DYNAMIC_STOP-LOSS_PLACEMENT",
                          "MARKET_REGIME_DETECTION"
                        ]}
                      />
                      
                      <FeatureCard
                        icon={Activity}
                        title="RISK_MANAGEMENT"
                        description="COMPREHENSIVE_RISK_MANAGEMENT_TOOLS_TO_PROTECT_YOUR_CAPITAL_AND_ENSURE_SUSTAINABLE_TRADING_PERFORMANCE_OVER_THE_LONG_TERM."
                        benefits={[
                          "ACCOUNT-LEVEL_DRAWDOWN_PROTECTION",
                          "STRATEGY-SPECIFIC_RISK_LIMITS",
                          "EXPOSURE_MONITORING_ACROSS_MARKETS"
                        ]}
                      />
                    </div>
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="charting" className="mt-0 outline-none ring-0 focus:outline-none focus:ring-0">
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6 sm:gap-8"
                  >
                    <FeatureCard
                      icon={BarChart2}
                      title="FREE_CHARTING_SOFTWARE"
                      description="ACCESS_PROFESSIONAL-GRADE_CHARTING_TOOLS_WITHOUT_ANY_SUBSCRIPTION_FEES._ANALYZE_MARKETS_WITH_ADVANCED_INDICATORS_AND_DRAWING_TOOLS."
                      benefits={[
                        "100+_TECHNICAL_INDICATORS_WITH_CUSTOMIZABLE_PARAMETERS",
                        "MULTI-TIMEFRAME_ANALYSIS_FROM_TICK_TO_MONTHLY_CHARTS",
                        "SAVE_&_SHARE_SETUPS_WITH_THE_ALGOZ_COMMUNITY",
                        "DARK_AND_LIGHT_THEMES_WITH_CUSTOMIZABLE_COLOR_SCHEMES",
                        "MULTIPLE_CHART_LAYOUTS_AND_WORKSPACES"
                      ]}
                      className="lg:col-span-2"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FeatureCard
                        icon={BarChart}
                        title="ADVANCED_PATTERNS"
                        description="AUTOMATIC_DETECTION_OF_CHART_PATTERNS_AND_CANDLESTICK_FORMATIONS_TO_IDENTIFY_HIGH-PROBABILITY_TRADING_OPPORTUNITIES."
                        benefits={[
                          "HARMONIC_PATTERN_RECOGNITION",
                          "CANDLESTICK_PATTERN_ALERTS",
                          "SUPPORT/RESISTANCE_AUTO-DETECTION"
                        ]}
                      />
                      
                      <FeatureCard
                        icon={Workflow}
                        title="MARKET_SCANNER"
                        description="SCAN_MULTIPLE_MARKETS_AND_TIMEFRAMES_SIMULTANEOUSLY_TO_FIND_INSTRUMENTS_THAT_MATCH_YOUR_SPECIFIC_CRITERIA_AND_TRADING_RULES."
                        benefits={[
                          "REAL-TIME_MULTI-MARKET_SCANNING",
                          "CUSTOMIZABLE_SCAN_CRITERIA",
                          "INSTANT_ALERTS_FOR_MATCHING_SYMBOLS"
                        ]}
                      />
                    </div>
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="scalping" className="mt-0 outline-none ring-0 focus:outline-none focus:ring-0">
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6 sm:gap-8"
                  >
                    <FeatureCard
                      icon={Zap}
                      title="SCALPING_TOOL"
                      description="DESIGNED_FOR_HIGH-FREQUENCY_TRADERS,_OUR_SCALPING_TOOL_PROVIDES_ULTRA-FAST_ORDER_EXECUTION_AND_ADVANCED_RISK_MANAGEMENT_FEATURES."
                      benefits={[
                        "SUB-MILLISECOND_EXECUTION_WITH_OPTIMIZED_ORDER_ROUTING",
                        "ONE-CLICK_TRADING_WITH_PRESET_ORDER_PARAMETERS",
                        "CUSTOMIZABLE_HOTKEYS_FOR_RAPID_TRADE_MANAGEMENT",
                        "DOM_(DEPTH_OF_MARKET)_VISUALIZATION",
                        "PRECISE_LIMIT_ORDER_PLACEMENT_TOOLS"
                      ]}
                      className="lg:col-span-2"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FeatureCard
                        icon={Clock}
                        title="LATENCY_OPTIMIZATION"
                        description="CUTTING-EDGE_INFRASTRUCTURE_DESIGNED_TO_MINIMIZE_LATENCY_AND_EXECUTION_TIME,_CRITICAL_FOR_SUCCESSFUL_SCALPING_STRATEGIES."
                        benefits={[
                          "CO-LOCATED_SERVERS_NEAR_EXCHANGES",
                          "NETWORK_ROUTE_OPTIMIZATION",
                          "LATENCY_MONITORING_TOOLS"
                        ]}
                      />
                      
                      <FeatureCard
                        icon={Shield}
                        title="POSITION_MANAGEMENT"
                        description="SOPHISTICATED_TOOLS_TO_MANAGE_MULTIPLE_POSITIONS_SIMULTANEOUSLY,_ESSENTIAL_FOR_HIGH-FREQUENCY_TRADING_STRATEGIES."
                        benefits={[
                          "AUTOMATED_PARTIAL_PROFIT_TAKING",
                          "TRAILING_STOP_MECHANISMS",
                          "ADVANCED_BRACKETED_ORDERS"
                        ]}
                      />
                    </div>
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="copying" className="mt-0 outline-none ring-0 focus:outline-none focus:ring-0">
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6 sm:gap-8"
                  >
                    <FeatureCard
                      icon={Copy}
                      title="COPY_TRADING"
                      description="REPLICATE_TRADES_FROM_A_MASTER_ACCOUNT_TO_UP_TO_1000_SUB-ACCOUNTS_SIMULTANEOUSLY._PERFECT_FOR_FUND_MANAGERS_AND_TRADE_LEADERS."
                      benefits={[
                        "PROPORTIONAL_POSITION_SIZING_BASED_ON_ACCOUNT_BALANCE",
                        "REAL-TIME_PERFORMANCE_TRACKING_ACROSS_ALL_ACCOUNTS",
                        "CUSTOM_RISK_PARAMETERS_FOR_EACH_FOLLOWER_ACCOUNT",
                        "TRADE_FILTERING_OPTIONS_TO_SELECTIVELY_COPY_TRADES",
                        "DETAILED_ANALYTICS_DASHBOARD_FOR_TRACKING_RESULTS"
                      ]}
                      className="lg:col-span-2"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FeatureCard
                        icon={Users}
                        title="STRATEGY_PROVIDER_NETWORK"
                        description="CONNECT_WITH_EXPERT_TRADERS_AND_FOLLOW_THEIR_STRATEGIES_WITH_TRANSPARENT_PERFORMANCE_METRICS_AND_RISK_PROFILES."
                        benefits={[
                          "VERIFIED_TRADER_PROFILES",
                          "HISTORICAL_PERFORMANCE_DATA",
                          "RISK-ADJUSTED_RETURNS_METRICS"
                        ]}
                      />
                      
                      <FeatureCard
                        icon={Award}
                        title="PERFORMANCE_ANALYTICS"
                        description="COMPREHENSIVE_ANALYTICS_TO_TRACK_AND_COMPARE_PERFORMANCE_ACROSS_DIFFERENT_STRATEGIES_AND_TRADERS."
                        benefits={[
                          "COMPARATIVE_PERFORMANCE_CHARTS",
                          "DRAWDOWN_ANALYSIS_TOOLS",
                          "CORRELATION_MEASUREMENTS"
                        ]}
                      />
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </motion.section>

            {/* Advanced Capabilities */}
            <motion.section 
              variants={fadeInUp}
              className="mb-24"
            >
              <div className="flex items-center mb-12">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-grow"></div>
                <h2 className="text-3xl font-semibold text-white mx-4 font-mono uppercase px-4 break-words text-wrap">ADVANCED_CAPABILITIES</h2>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-grow"></div>
              </div>
              
              <motion.div 
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"
              >
                <FeatureCard
                  icon={Code}
                  title="PERSONALIZED_DEVELOPER"
                  description="GET_A_DEDICATED_DEVELOPER_TO_BUILD_CUSTOM_TRADING_SOLUTIONS_TAILORED_TO_YOUR_SPECIFIC_NEEDS_AND_STRATEGIES."
                  benefits={[
                    "DEDICATED_DEVELOPMENT_RESOURCES",
                    "CUSTOM_INDICATOR_CREATION",
                    "STRATEGY_IMPLEMENTATION",
                    "PERIODIC_CODE_REVIEWS_AND_OPTIMIZATION",
                    "DIRECT_COMMUNICATION_CHANNEL"
                  ]}
                />
                
                <FeatureCard
                  icon={Users}
                  title="STRATEGY_MARKPLACE"
                  description="BROWSE_AND_PURCHASE_PROVEN_TRADING_STRATEGIES_FROM_EXPERT_TRADERS._IMPLEMENT_THEM_INSTANTLY_ON_YOUR_ACCOUNTS."
                  benefits={[
                    "VETTED_STRATEGY_PROVIDERS",
                    "PERFORMANCE_HISTORY_AND_METRICS",
                    "INSTANT_DEPLOYMENT_OPTIONS",
                    "STRATEGY_CUSTOMIZATION_TOOLS",
                    "SECURE_PAYMENT_PROCESSING"
                  ]}
                />
                
                <FeatureCard
                  icon={PieChart}
                  title="BACKTESTING_&_OPTIMIZATION"
                  description="TEST_YOUR_STRATEGIES_AGAINST_HISTORICAL_DATA_AND_OPTIMIZE_PARAMETERS_FOR_MAXIMUM_PERFORMANCE_USING_OUR_ADVANCED_ANALYTICS_ENGINE."
                  benefits={[
                    "HIGH-SPEED_BACKTESTING_ENGINE",
                    "MONTE_CARLO_SIMULATIONS",
                    "PARAMETER_OPTIMIZATION_TOOLS",
                    "DETAILED_PERFORMANCE_METRICS",
                    "WALK-FORWARD_ANALYSIS"
                  ]}
                />
                
                <FeatureCard
                  icon={Lightbulb}
                  title="AI_POWERED_RESEARCH"
                  description="LEVERAGE_ARTIFICIAL_INTELLIGENCE_FOR_DEEP_MARKET_ANALYSIS,_PATTERN_RECOGNITION,_AND_PREDICTIVE_INSIGHTS_ON_MARKET_TRENDS."
                  benefits={[
                    "MACHINE_LEARNING_MODELS",
                    "NATURAL_LANGUAGE_PROCESSING_FOR_NEWS_ANALYSIS",
                    "SENTIMENT_ANALYSIS_TOOLS",
                    "ANOMALY_DETECTION_ALGORITHMS",
                    "PREDICTIVE_ANALYTICS_DASHBOARD"
                  ]}
                />
              </motion.div>
            </motion.section>
            
            {/* Support and Resources Section */}
            <motion.section 
              variants={fadeInUp}
              className="mb-24"
            >
              <div className="flex items-center mb-12">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-grow"></div>
                <h2 className="text-3xl font-semibold text-white mx-4 font-mono uppercase px-4 break-words text-wrap">SUPPORT_AND_RESOURCES</h2>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-grow"></div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                <motion.div 
                  variants={fadeInUp}
                  className="md:w-1/2"
                >
                  <Card className="bg-zinc-900/50 border-zinc-800 h-full overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-white font-mono uppercase text-lg break-words text-wrap">
                        <Bot className="h-6 w-6 text-blue-400 mr-3 flex-shrink-0" />
                        TRADING_ASSISTANT
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300 font-mono uppercase text-sm leading-relaxed break-words text-wrap">
                        OUR_AI_POWERED_ASSISTANT_HELPS_WITH_ALL_YOUR_AUTOMATION_NEEDS,_INCLUDING_VOICE_COMMANDS_FOR_HANDS-FREE_TRADING_AND_PLATFORM_NAVIGATION.
                      </p>
                      
                      <div className="mt-6 space-y-4">
                        <div className="flex items-start space-x-3">
                          <ChevronRight className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-300 font-mono uppercase text-sm break-words text-wrap">
                            VOICE-ACTIVATED_TRADING_COMMANDS_FOR_HANDSFREE_OPERATION
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <ChevronRight className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-300 font-mono uppercase text-sm break-words text-wrap">
                            NATURAL_LANGUAGE_PROCESSING_FOR_COMPLEX_TRADING_INSTRUCTIONS
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <ChevronRight className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-300 font-mono uppercase text-sm break-words text-wrap">
                            PERSONALIZED_RESPONSES_AND_RECOMMENDATIONS_BASED_ON_YOUR_TRADING_HISTORY
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <ChevronRight className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-300 font-mono uppercase text-sm break-words text-wrap">
                            CONTINUOUS_LEARNING_SYSTEM_THAT_IMPROVES_WITH_USE
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div 
                  variants={fadeInUp}
                  className="md:w-1/2 space-y-6 sm:space-y-8"
                >
                  <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-white font-mono uppercase text-lg break-words text-wrap">
                        <Clock className="h-6 w-6 text-blue-400 mr-3 flex-shrink-0" />
                        24/7_SUPPORT
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 font-mono uppercase text-sm leading-relaxed break-words text-wrap">
                        OUR_DEDICATED_SUPPORT_TEAM_IS_AVAILABLE_ROUND-THE-CLOCK_TO_HELP_WITH_ANY_TECHNICAL_ISSUES_OR_TRADING_QUERIES_YOU_MAY_HAVE.
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-between mt-6 gap-2">
                        <Badge variant="outline" className="bg-zinc-800 text-white border-zinc-700 px-3 py-1.5 font-mono text-xs">
                          LIVE_CHAT
                        </Badge>
                        <Badge variant="outline" className="bg-zinc-800 text-white border-zinc-700 px-3 py-1.5 font-mono text-xs">
                          EMAIL_SUPPORT
                        </Badge>
                        <Badge variant="outline" className="bg-zinc-800 text-white border-zinc-700 px-3 py-1.5 font-mono text-xs">
                          VIDEO_CALLS
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-white font-mono uppercase text-lg break-words text-wrap">
                        <Terminal className="h-6 w-6 text-blue-400 mr-3 flex-shrink-0" />
                        CUSTOMIZED_SOLUTIONS
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 font-mono uppercase text-sm leading-relaxed break-words text-wrap">
                        WE_BUILD_BESPOKE_TRADING_SOFTWARE_TAILORED_TO_YOUR_SPECIFIC_REQUIREMENTS,_FROM_CUSTOM_INDICATORS_TO_COMPLETE_TRADING_SYSTEMS.
                      </p>
                      
                      <Button variant="outline" className="mt-6 w-full border-zinc-700 text-white hover:bg-zinc-800 font-mono">
                        <span className="uppercase">REQUEST_CONSULTATION</span>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.section>
            
            {/* Why Choose AlgoZ */}
            <motion.section 
              variants={scaleIn}
              className="mb-24 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
              
              <div className="p-6 md:p-12 border border-zinc-800 rounded-2xl backdrop-blur-sm relative overflow-hidden">
                <h2 className="text-3xl font-semibold text-white mb-8 font-mono uppercase text-center break-words text-wrap">
                  WHY_CHOOSE_ALGOZ?
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="flex items-start">
                    <div className="bg-zinc-800 p-2 rounded-lg mr-4 flex-shrink-0 mt-1">
                      <Zap className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white font-mono uppercase mb-2 leading-tight break-words text-wrap">INDUSTRY-LEADING_SPEED</h3>
                      <p className="text-gray-300 font-mono uppercase text-sm leading-relaxed break-words text-wrap">
                        OUR_PROPRIETARY_LOW-LATENCY_INFRASTRUCTURE_ENSURES_THE_FASTEST_POSSIBLE_EXECUTION_FOR_YOUR_TRADES.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-zinc-800 p-2 rounded-lg mr-4 flex-shrink-0 mt-1">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white font-mono uppercase mb-2 leading-tight break-words text-wrap">SEAMLESS_INTEGRATION</h3>
                      <p className="text-gray-300 font-mono uppercase text-sm leading-relaxed break-words text-wrap">
                        CONNECT_WITH_ALL_MAJOR_BROKERS_AND_EXCHANGES_WORLDWIDE_THROUGH_OUR_UNIFIED_INTERFACE.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-zinc-800 p-2 rounded-lg mr-4 flex-shrink-0 mt-1">
                      <Shield className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white font-mono uppercase mb-2 leading-tight break-words text-wrap">BANK-GRADE_SECURITY</h3>
                      <p className="text-gray-300 font-mono uppercase text-sm leading-relaxed break-words text-wrap">
                        STATE-OF-THE-ART_ENCRYPTION_AND_SECURITY_PROTOCOLS_PROTECTING_YOUR_ACCOUNTS_AND_TRADING_DATA.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-zinc-800 p-2 rounded-lg mr-4 flex-shrink-0 mt-1">
                      <Award className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white font-mono uppercase mb-2 leading-tight break-words text-wrap">TRANSPARENT_PRICING</h3>
                      <p className="text-gray-300 font-mono uppercase text-sm leading-relaxed break-words text-wrap">
                        CLEAR_AND_STRAIGHTFORWARD_PRICING_WITH_NO_HIDDEN_FEES_OR_COMMISSIONS.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start md:col-span-2">
                    <div className="bg-zinc-800 p-2 rounded-lg mr-4 flex-shrink-0 mt-1">
                      <Lightbulb className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white font-mono uppercase mb-2 leading-tight break-words text-wrap">CONTINUOUS_INNOVATION</h3>
                      <p className="text-gray-300 font-mono uppercase text-sm leading-relaxed break-words text-wrap">
                        OUR_TEAM_IS_CONSTANTLY_WORKING_ON_NEW_FEATURES_AND_IMPROVEMENTS_TO_KEEP_YOU_AT_THE_CUTTING_EDGE_OF_ALGORITHMIC_TRADING.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
            
            {/* CTA Section */}
            <motion.section 
              variants={fadeInUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-mono uppercase">
                READY_TO_ELEVATE_YOUR_TRADING?
              </h2>
              
              <p className="text-gray-300 font-mono uppercase text-lg max-w-3xl mx-auto mb-8">
                JOIN_THOUSANDS_OF_TRADERS_WHO_HAVE_TRANSFORMED_THEIR_TRADING_WITH_ALGOZ'S_POWERFUL_PLATFORM.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 font-mono rounded-xl px-8"
                >
                  <Link href="/auth">
                    <span className="uppercase">GET_STARTED_NOW</span>
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="border-zinc-700 text-white hover:bg-zinc-800 font-mono rounded-xl px-8"
                >
                  <Link href="/">
                    <span className="uppercase">RETURN_TO_HOME</span>
                  </Link>
                </Button>
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>
    </>
  )
} 