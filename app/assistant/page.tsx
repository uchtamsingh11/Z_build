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
import { Bot, Mic, ArrowRight, Paperclip, UserCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dropzone, DropzoneEmptyState } from "@/components/ui/dropzone"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

// Message type definition
type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: File[]
}

export default function AssistantPage() {
  const [userMessage, setUserMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  // Client-side auth check
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      
      if (error || !data?.user) {
        router.push('/auth/login')
      }
    }
    
    checkAuth()
  }, [router])

  // User's name (client-side)
  const [userName, setUserName] = useState('User')
  
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      
      if (!error && data?.user) {
        const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
        setUserName(name)
      }
    }
    
    fetchUserData()
  }, [])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hi there! I'm your assistant powered by Gemini. How can I help you today?",
          timestamp: new Date()
        }
      ])
    }
  }, [messages])

  // Function to call Gemini API
  const callGeminiAPI = async (prompt: string, conversationHistory: Message[]) => {
    try {
      const apiKey = "AIzaSyDPfMxPkHsHre9HJzgfLqC_fPBUJB4UXJc"
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"
      
      // Format the conversation history for the API
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }))
      
      // Add the current prompt
      const requestBody = {
        contents: [
          ...formattedHistory,
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }
      
      console.log("Sending request to Gemini API:", JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Response Error:", response.status, errorText)
        return `Sorry, I encountered an error (${response.status}). Please try again later.`
      }
      
      const data = await response.json()
      console.log("API Response:", JSON.stringify(data, null, 2))
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text
      } else if (data.error) {
        const errorMessage = typeof data.error === 'object' 
          ? JSON.stringify(data.error) 
          : String(data.error)
        console.error("API Error:", errorMessage)
        return "Sorry, I encountered an error. Please try again later."
      } else {
        console.error("Unexpected API response structure")
        return "Sorry, I couldn't process that request. Please try again."
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      return "Sorry, something went wrong. Please try again later."
    }
  }

  // Handle text input submission
  const handleSendMessage = async () => {
    if (userMessage.trim()) {
      // Add user message to chat
      const userMsg: Message = {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
        files: files.length > 0 ? [...files] : undefined
      }
      
      setMessages(prev => [...prev, userMsg])
      setUserMessage('')
      setFiles([])
      setIsLoading(true)
      
      // Get response from Gemini
      const assistantResponse = await callGeminiAPI(
        userMessage, 
        // Only send last 10 messages to avoid token limits
        messages.slice(-10)
      )
      
      // Add assistant response to chat
      const assistantMsg: Message = {
        role: "assistant",
        content: assistantResponse,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMsg])
      setIsLoading(false)
    }
  }

  // Handle file uploads
  const handleFileUpload = (acceptedFiles: File[]) => {
    // Filter to only accept images and PDFs
    const filteredFiles = acceptedFiles.filter(
      file => file.type.startsWith('image/') || file.type === 'application/pdf'
    )
    
    if (filteredFiles.length > 0) {
      setFiles(filteredFiles)
    }
  }

  // Handle speech-to-text
  const handleSpeechToText = () => {
    // Check if browser supports SpeechRecognition
    if (typeof window !== 'undefined') {
      // Using window.any to accommodate the browsers' different implementations
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        
        recognition.lang = 'en-US'
        recognition.interimResults = false
        
        if (!isListening) {
          // Start listening
          recognition.start()
          setIsListening(true)
          
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setUserMessage(prev => prev + ' ' + transcript)
            setIsListening(false)
          }
          
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error)
            setIsListening(false)
            
            // Handle specific error types
            if (event.error === 'network') {
              alert("Network error occurred. Please check your internet connection and try again.")
            } else if (event.error === 'not-allowed') {
              alert("Microphone access was denied. Please allow microphone access to use this feature.")
            } else if (event.error === 'aborted') {
              // User or system aborted, no need to show error
              console.log("Speech recognition aborted")
            } else {
              alert("Failed to recognize speech. Please try again.")
            }
          }
          
          recognition.onend = () => {
            setIsListening(false)
          }
        } else {
          // Stop listening
          recognition.stop()
          setIsListening(false)
        }
      } else {
        alert("Speech recognition is not supported in your browser")
      }
    }
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full grid-cols-[auto_1fr] bg-black text-white font-mono">
        <AppSidebar />
        <SidebarInset>
          {/* Header with breadcrumb and coin display */}
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-zinc-900">
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
            
            <div className="ml-auto mr-4">
              <CoinBalanceDisplay />
            </div>
          </header>
          
          {/* Assistant content */}
          <div className="flex-1 flex flex-col bg-black min-h-screen relative">
            {/* Grid background overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
            
            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col h-full">
              <h1 className="text-2xl font-bold my-6 px-4 text-white">Assistant</h1>
              
              {/* Chat messages area */}
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                    >
                      <div 
                        className={`
                          flex max-w-[80%] rounded-lg p-4
                          ${message.role === "assistant" 
                            ? "bg-zinc-800 text-white" 
                            : "bg-blue-600 text-white"
                          }
                        `}
                      >
                        <div className="flex-shrink-0 mr-4">
                          {message.role === "assistant" ? (
                            <Bot className="h-8 w-8 text-blue-400" />
                          ) : (
                            <UserCircle className="h-8 w-8 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="font-medium">
                              {message.role === "assistant" ? "Assistant" : userName}
                            </span>
                            <span className="ml-2 text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                          {message.files && message.files.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Attached files:</p>
                              <ul className="text-sm opacity-80">
                                {message.files.map((file, i) => (
                                  <li key={i}>{file.name}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex bg-zinc-800 text-white max-w-[80%] rounded-lg p-4">
                        <div className="flex-shrink-0 mr-4">
                          <Bot className="h-8 w-8 text-blue-400" />
                        </div>
                        <div className="flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-400 mr-2" />
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* For auto-scrolling */}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Files preview area */}
              {files.length > 0 && (
                <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Files to upload ({files.length})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFiles([])}
                      className="text-xs h-7"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center bg-zinc-800 rounded-md px-2 py-1 text-sm">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <span className="sr-only">Remove</span>
                          <span aria-hidden="true">&times;</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Input area */}
              <div className="p-4 border-t border-zinc-900">
                <div className="relative flex items-center w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 shadow-md">
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(Array.from(e.target.files))
                      }
                    }}
                    multiple
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload file"
                  >
                    <Paperclip className="h-5 w-5 text-zinc-400" />
                  </Button>
                  
                  <Input 
                    type="text" 
                    placeholder="Ask Assistant"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 border-0 bg-transparent px-3 py-1.5 text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={isLoading}
                  />
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full flex-shrink-0 ${!userMessage.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleSendMessage}
                    disabled={!userMessage.trim() || isLoading}
                    aria-label="Send message"
                  >
                    <ArrowRight className={`h-5 w-5 ${!userMessage.trim() || isLoading ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full flex-shrink-0 ${isListening ? 'bg-red-500/20' : ''}`}
                    onClick={handleSpeechToText}
                    disabled={isLoading}
                    aria-label="Voice input"
                  >
                    <Mic className={`h-5 w-5 ${isListening ? 'text-red-500' : 'text-zinc-400'}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 