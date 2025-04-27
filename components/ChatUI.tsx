"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowDown, Paperclip, Send, Download } from "lucide-react"
import { createClient } from '@/lib/supabase/client'
import styles from './ChatUI.module.css'

// Message type definition
type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: File[]
}

export default function ChatUI() {
  const [userMessage, setUserMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState("User")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // Fetch user's name
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

  // Basic example response function (replace with actual API call)
  const getAssistantResponse = async (message: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const responses = [
      `I understand what you're asking about. Let me explain "${message}"...`,
      `That's an interesting question about "${message}". Here's what I know...`,
      `Thanks for asking about "${message}". Here's some information that might help...`,
      `I've analyzed your question about "${message}" and here's what I found...`,
      `Let me provide some insights on "${message}"...`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

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
    
    // Get assistant response
    const responseText = await getAssistantResponse(userMessage)
    
    // Add assistant response to chat
    const assistantMsg: Message = {
      role: "assistant",
      content: responseText,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, assistantMsg])
    setIsLoading(false)
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
      const sender = msg.role === "user" ? userName : "Assistant"
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

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:20px_20px] opacity-30 pointer-events-none"></div>
      
      {/* Header - fixed at top */}
      <header className="fixed top-0 left-0 right-0 h-16 z-10 bg-black/80 backdrop-blur-sm border-b border-zinc-800/50 flex items-center px-6">
        <h1 className={`text-xl font-medium ${styles.gradient}`}>
          Hello, {userName}
        </h1>
      </header>
      
      {/* Empty state when no messages */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className={`text-center px-4 ${styles.fadeIn}`}>
            <h2 className={`text-3xl font-medium mb-3 ${styles.gradient}`}>
              Hello, {userName}
            </h2>
            <p className="text-zinc-400">Start a conversation by typing a message below.</p>
          </div>
        </div>
      )}
      
      {/* Chat messages container */}
      <div 
        ref={messagesContainerRef} 
        className={`flex-1 overflow-y-auto pt-20 pb-20 px-4 ${styles.chatContainer}`}
      >
        <div className="max-w-3xl mx-auto space-y-6">
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
                    : `bg-gradient-to-r from-blue-600 to-indigo-600 text-white ${styles.messageOut}`
                  }
                `}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center mb-1.5">
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
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <div className={`w-2 h-2 rounded-full bg-blue-400 ${styles.pulseAnimation}`} style={{ animationDelay: "0s" }} />
                    <div className={`w-2 h-2 rounded-full bg-indigo-400 ${styles.pulseAnimation}`} style={{ animationDelay: "0.3s" }} />
                    <div className={`w-2 h-2 rounded-full bg-pink-400 ${styles.pulseAnimation}`} style={{ animationDelay: "0.6s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Scroll to bottom button (only appears when not at bottom) */}
      {messages.length > 3 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 bg-zinc-800/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg hover:bg-zinc-700 transition-all z-20"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}
      
      {/* Files preview area */}
      {files.length > 0 && (
        <div className={`fixed bottom-20 left-0 right-0 bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800/50 px-4 py-3 z-10 ${styles.fadeIn}`}>
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
      
      {/* Input area - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-zinc-800/50 p-4 z-10">
        <div className="max-w-3xl mx-auto flex items-center">
          <div className="relative flex items-center w-full rounded-full border border-zinc-700/80 bg-zinc-900/80 px-4 py-2 shadow-lg">
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
              placeholder="Type your message..."
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
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1"
              onClick={downloadChat}
              aria-label="Download chat"
              disabled={messages.length === 0}
            >
              <Download className="h-5 w-5" />
            </button>
            
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
          </div>
        </div>
      </div>
    </div>
  )
} 