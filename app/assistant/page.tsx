"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createClient } from '@/lib/supabase/client'
import { CoinBalanceDisplay } from "@/components/coin-balance-display"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, Paperclip, Send, Download, Mic, Settings, X, FileText, Sparkles, Check, AlertCircle } from "lucide-react"
import styles from '@/components/ChatUI.module.css'
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Message type definition
type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: File[]
  model?: "gemini" | "perplexity"
}

// AI Model type
type AIModel = {
  id: "gemini" | "perplexity"
  name: string
  description: string
}

// Suggested prompts
const SUGGESTED_PROMPTS = [
  "Summarize this article",
  "Draft a professional email",
  "Explain a complex topic simply",
  "Create a travel itinerary"
]

export default function AssistantPage() {
  const [userMessage, setUserMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState("User")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<"gemini" | "perplexity">("gemini")
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Define available AI models
  const aiModels: AIModel[] = [
    {
      id: "gemini",
      name: "Gemini",
      description: "Google's AI assistant with strong reasoning capabilities"
    },
    {
      id: "perplexity",
      name: "Perplexity",
      description: "AI with advanced information retrieval and analysis"
    }
  ]
  
  // Client-side auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser()
      
      if (error || !data?.user) {
        router.push('/auth/login')
      }
    }
    
    checkAuth()
  }, [router])

  // Fetch user's name and set time of day
  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase.auth.getUser()
      
      if (!error && data?.user) {
        const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
        setUserName(name)
      }
    }
    
    fetchUserData()

    // Set time of day
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setTimeOfDay("morning")
    } else if (hour >= 12 && hour < 18) {
      setTimeOfDay("afternoon")
    } else {
      setTimeOfDay("evening")
    }
  }, [])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Call AI API
  const processAIRequest = async (message: string, model: "gemini" | "perplexity"): Promise<string> => {
    try {
      // Call our secure API endpoint
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          model,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error details:', errorData);
        
        // Handle specific API errors with user-friendly messages
        if (errorData?.error?.includes('API configuration error')) {
          toast.error("API Configuration Error", {
            description: "The AI service is not properly configured. Please contact support."
          });
        } else if (errorData?.error?.includes('Perplexity API error')) {
          toast.error("Perplexity API Error", {
            description: "There was an issue connecting to Perplexity. Switching to Gemini for now."
          });
          // Auto-switch to Gemini on Perplexity error
          if (model === "perplexity") {
            setSelectedModel("gemini");
            return processAIRequest(message, "gemini");
          }
        } else if (errorData?.error?.includes('Gemini API error')) {
          toast.error("Gemini API Error", {
            description: "There was an issue connecting to Gemini. Switching to Perplexity for now."
          });
          // Auto-switch to Perplexity on Gemini error
          if (model === "gemini") {
            setSelectedModel("perplexity");
            return processAIRequest(message, "perplexity");
          }
        }
        
        throw new Error(errorData?.error || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error: any) {
      console.error("Error calling AI API:", error);
      toast.error("AI Service Unavailable", {
        description: "We're having trouble connecting to our AI service. Please try again later."
      });
      return "Sorry, I encountered an error processing your request. Please try again later.";
    }
  };

  // Handle message submission
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return
      
    // Add user message to chat
    const userMsg: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
      files: files.length > 0 ? [...files] : undefined
    }
    
    setMessages(prev => [...prev, userMsg])
    setUserMessage("")
    setFiles([])
    setIsLoading(true)
    
    // Get assistant response from the selected AI model
    try {
      const responseText = await processAIRequest(userMessage, selectedModel)
      
      // Add assistant response to chat
      const assistantMsg: Message = {
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
        model: selectedModel
      }
      
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      console.error("Error getting AI response:", error);
    } finally {
      setIsLoading(false)
    }
  }

  // Handle selecting a suggested prompt
  const handleSuggestedPrompt = (prompt: string) => {
    setUserMessage(prompt)
  }

  // Handle file selection
  const handleFileUpload = (acceptedFiles: FileList) => {
    setFiles(Array.from(acceptedFiles))
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Download chat as text file
  const downloadChat = () => {
    if (messages.length === 0) return
    
    let content = ""
    messages.forEach(msg => {
      const sender = msg.role === "user" ? userName : `Assistant${msg.model ? ` (${msg.model})` : ''}`
      const time = formatTime(msg.timestamp)
      content += `[${time}] ${sender}: ${msg.content}\n\n`
    })
    
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chat-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Scroll to bottom button
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle model selection
  const handleModelSelection = (model: "gemini" | "perplexity") => {
    setSelectedModel(model)
    setIsModelDropdownOpen(false)
    
    toast.success(`Switched to ${model === 'gemini' ? 'Gemini' : 'Perplexity'}`, {
      description: `Now using ${model === 'gemini' ? 'Google\'s' : 'Perplexity\'s'} AI model for responses.`
    });
  }

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full grid-cols-[auto_1fr] bg-black text-white font-mono">
        <AppSidebar />
        
        {/* Main content area - with fixed header and footer */}
        <div className="h-screen flex flex-col relative">
          <div className="sticky top-0 z-30">
            {/* Main header with breadcrumb and coin display */}
            <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-zinc-900 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Assistant</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              
              <div className="flex items-center ml-auto mr-4">
                <span className="text-sm mr-2 px-3 py-1 bg-zinc-800 rounded-full">
                  {selectedModel === "gemini" ? (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Gemini
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Perplexity
                    </span>
                  )}
                </span>
              </div>
            </header>
            
            {/* Welcome header - only show when no messages */}
            {messages.length === 0 && (
              <div className="h-16 flex items-center justify-center border-b border-zinc-900/50 bg-black/95">
                <h1 className={`text-xl font-medium ${styles.gradient}`}>
                  Good {timeOfDay}, {userName}
                </h1>
              </div>
            )}
          </div>
          
          {/* Scrollable chat content area */}
          <div className="flex-1 overflow-y-auto relative" ref={messagesContainerRef}>
            {/* Grid pattern background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:20px_20px] opacity-30 pointer-events-none"></div>
            
            {/* Empty state when no messages */}
            {messages.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-center px-4 ${styles.fadeIn}`}>
                  <p className="text-zinc-400 mb-8">How can we assist you today?</p>
                  
                  {/* AI Model selector */}
                  <div className="mb-8">
                    <p className="text-sm text-zinc-500 mb-2">Choose your AI model:</p>
                    <div className="inline-flex bg-zinc-900 rounded-xl p-1 shadow-md">
                      {aiModels.map((model) => (
                        <button
                          key={model.id}
                          className={`
                            px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all
                            ${selectedModel === model.id 
                              ? "bg-zinc-800 text-white shadow-sm" 
                              : "text-zinc-400 hover:text-zinc-300"
                            }
                          `}
                          onClick={() => handleModelSelection(model.id)}
                        >
                          {model.id === "gemini" ? (
                            <Sparkles className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          {model.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Suggested prompts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                    {SUGGESTED_PROMPTS.map((prompt, index) => (
                      <button
                        key={index}
                        className="bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl shadow-md px-4 py-3 text-sm text-left transition-all"
                        onClick={() => handleSuggestedPrompt(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Messages */}
            <div className="max-w-3xl mx-auto px-4 py-8 pb-32 space-y-6">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div 
                    className={`
                      max-w-[85%] rounded-3xl px-4 py-3 shadow-lg
                      ${message.role === "assistant" 
                        ? `bg-zinc-800/90 text-white ${styles.messageIn}`
                        : `bg-zinc-900 text-white ${styles.messageOut}`
                      }
                    `}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center mb-1.5">
                      <span className="font-medium">
                        {message.role === "assistant" ? (
                          <span className="flex items-center gap-1.5">
                            {message.model === "gemini" ? (
                              <Sparkles className="h-3.5 w-3.5" />
                            ) : (
                              <FileText className="h-3.5 w-3.5" />
                            )}
                            {message.model ? `${message.model.charAt(0).toUpperCase() + message.model.slice(1)}` : "Assistant"}
                          </span>
                        ) : userName}
                      </span>
                      <span className="ml-2 text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 border-t border-zinc-700/50 pt-2">
                        <p className="text-xs font-medium">Attached files:</p>
                        <ul className="text-xs opacity-80">
                          {message.files.map((file, i) => (
                            <li key={i} className="truncate">{file.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`bg-zinc-800/90 text-white max-w-[85%] rounded-3xl px-4 py-3 shadow-lg ${styles.messageIn}`}>
                    <div className="flex items-center mb-1.5">
                      <span className="font-medium flex items-center gap-1.5">
                        {selectedModel === "gemini" ? (
                          <Sparkles className="h-3.5 w-3.5" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        {selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)}
                      </span>
                    </div>
                    <div className="flex space-x-1.5">
                      <div className={`w-2 h-2 rounded-full bg-blue-400 ${styles.pulseAnimation}`} style={{ animationDelay: "0s" }} />
                      <div className={`w-2 h-2 rounded-full bg-indigo-400 ${styles.pulseAnimation}`} style={{ animationDelay: "0.3s" }} />
                      <div className={`w-2 h-2 rounded-full bg-pink-400 ${styles.pulseAnimation}`} style={{ animationDelay: "0.6s" }} />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Scroll to bottom button */}
            {messages.length > 3 && (
              <button
                onClick={scrollToBottom}
                className="fixed bottom-24 right-6 bg-zinc-800/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg hover:bg-zinc-700 transition-all z-20"
                aria-label="Scroll to bottom"
              >
                <ArrowDown className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Fixed footer area */}
          <div className="sticky bottom-0 left-0 right-0 z-30">
            {/* Files preview area */}
            {files.length > 0 && (
              <div className={`bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800/50 px-4 py-3 ${styles.fadeIn}`}>
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Files to upload ({files.length})</span>
                    <button 
                      className="text-xs text-zinc-400 hover:text-white"
                      onClick={() => setFiles([])}
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center bg-zinc-800/80 rounded-full px-3 py-1.5 text-sm"
                        style={{ animation: `${styles.fadeIn} 0.3s ease forwards`, animationDelay: `${index * 0.05}s` }}
                      >
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button
                          className="ml-2 text-zinc-400 hover:text-white"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <span className="sr-only">Remove</span>
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Input area */}
            <div className="bg-black/95 backdrop-blur-sm border-t border-zinc-800/50 p-4">
              <div className="max-w-3xl mx-auto">
                {/* Model selector dropdown */}
                <div className="relative mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center justify-between w-full md:w-64 rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-2 text-sm shadow-lg hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {selectedModel === "gemini" ? (
                            <Sparkles className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <span>
                            {selectedModel === "gemini" ? "Gemini" : "Perplexity"}
                          </span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-full md:w-64 bg-zinc-900 border border-zinc-700">
                      {aiModels.map(model => (
                        <DropdownMenuItem
                          key={model.id}
                          className={`
                            flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-zinc-800 transition-colors
                            ${selectedModel === model.id ? "bg-zinc-800" : ""}
                          `}
                          onClick={() => handleModelSelection(model.id)}
                        >
                          <div className="flex items-center gap-2">
                            {model.id === "gemini" ? (
                              <Sparkles className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            <div className="flex flex-col items-start">
                              <span>{model.name}</span>
                              <span className="text-xs text-zinc-400">
                                {model.description}
                              </span>
                            </div>
                          </div>
                          {selectedModel === model.id && (
                            <Check className="h-4 w-4 text-blue-400" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center">
                  <div className="relative flex items-center w-full rounded-2xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-2 shadow-lg">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="*/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileUpload(e.target.files)
                        }
                      }}
                      multiple
                    />
                    <button 
                      className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Upload file"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    
                    <input 
                      type="text" 
                      placeholder={`Ask ${selectedModel === "gemini" ? "Gemini" : "Perplexity"} anything... Start typing your request or question here.`}
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 border-0 bg-transparent px-3 py-1.5 text-white focus:outline-none"
                      disabled={isLoading}
                    />
                    
                    <button 
                      className={`
                        p-1.5 rounded-full ml-1 transition-all transform hover:scale-105 active:scale-95
                        ${userMessage.trim() && !isLoading 
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md" 
                          : "text-zinc-600 bg-zinc-800 cursor-not-allowed"
                        }
                      `}
                      onClick={handleSendMessage}
                      disabled={!userMessage.trim() || isLoading}
                      aria-label="Send message"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                    
                    {/* Mic button inside input area */}
                    <button 
                      className="p-1.5 rounded-full ml-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      aria-label="Voice input"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Download button remains outside */}
                  <div className="flex ml-2">
                    <button 
                      className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      onClick={downloadChat}
                      aria-label="Download chat"
                      disabled={messages.length === 0}
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Settings popup */}
          {isSettingsOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-zinc-900 rounded-lg shadow-xl w-[90%] max-w-md p-5 mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium">Settings</h2>
                  <button 
                    className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    onClick={() => setIsSettingsOpen(false)}
                    aria-label="Close settings"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="border-t border-zinc-800 pt-4">
                  {/* AI model preferences */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">AI Model Preferences</h3>
                    
                    {aiModels.map(model => (
                      <div key={model.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          {model.id === "gemini" ? (
                            <Sparkles className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              {model.name}
                            </div>
                            <div className="text-xs text-zinc-400">{model.description}</div>
                          </div>
                        </div>
                        <button
                          className={`
                            px-2 py-1 rounded-full text-xs
                            ${selectedModel === model.id 
                              ? "bg-blue-600 text-white" 
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }
                          `}
                          onClick={() => {
                            handleModelSelection(model.id)
                            setIsSettingsOpen(false)
                          }}
                        >
                          {selectedModel === model.id ? "Selected" : "Select"}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional settings would go here */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Interface Settings</h3>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div>Show AI model icon with messages</div>
                        <div className="text-xs text-zinc-400">Display model icon next to each response</div>
                      </div>
                      <div className="w-10 h-5 bg-zinc-700 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  )
} 