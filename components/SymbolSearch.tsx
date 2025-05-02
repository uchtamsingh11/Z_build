"use client"

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Search, ChevronRight, X, Info, Star } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Type definitions
type Symbol = {
  id: number
  EXCH_ID: string
  SECURITY_ID: number
  DISPLAY_NAME: string
}

type GroupedSymbols = {
  [key: string]: Symbol[]
}

type SymbolSearchProps = {
  onSelect?: (symbol: Symbol) => void
  placeholder?: string
  className?: string
  showFavorites?: boolean
  favoriteSymbols?: Symbol[]
  onToggleFavorite?: (symbol: Symbol) => void
}

// Categories for organizing symbols
const SYMBOL_CATEGORIES: Record<string, string[]> = {
  'STOCKS': ['NSE_EQ', 'BSE_EQ', 'NSE', 'BSE'],
  'FUTURES': ['NSE_FNO', 'BSE_FNO'],
  'COMMODITIES': ['MCX'],
  'ALL': ['NSE_EQ', 'BSE_EQ', 'NSE', 'BSE', 'NSE_FNO', 'BSE_FNO', 'MCX']
}

// Exchange ID to display label mapping
const EXCHANGE_LABELS: Record<string, string> = {
  'NSE': 'India NSE Index',
  'NSE_EQ': 'NSE Equity',
  'NSE_FNO': 'NSE F&O',
  'BSE': 'India BSE Index',
  'BSE_EQ': 'BSE Equity',
  'BSE_FNO': 'BSE F&O',
  'MCX': 'MCX Commodities'
}

// Exchange to country code mapping for flags
const EXCHANGE_COUNTRY: Record<string, string> = {
  'NSE': 'in',
  'NSE_EQ': 'in',
  'NSE_FNO': 'in',
  'BSE': 'in',
  'BSE_EQ': 'in',
  'BSE_FNO': 'in',
  'MCX': 'in'
}

export function SymbolSearch({ 
  onSelect, 
  placeholder = "Search symbols...",
  className = "",
  showFavorites = false,
  favoriteSymbols = [],
  onToggleFavorite
}: SymbolSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [groupedSymbols, setGroupedSymbols] = useState<GroupedSymbols>({})
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch symbols from Supabase
  useEffect(() => {
    const fetchSymbols = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('symbols')
          .select('*')
          .limit(500) // Limit for performance
        
        if (error) throw error
        if (data) setSymbols(data)
      } catch (error) {
        console.error('Error fetching symbols:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSymbols()
  }, [])

  // Group symbols by exchange when they change
  useEffect(() => {
    const grouped = symbols.reduce((acc: GroupedSymbols, symbol) => {
      const key = symbol.EXCH_ID
      if (!acc[key]) acc[key] = []
      acc[key].push(symbol)
      return acc
    }, {})
    
    setGroupedSymbols(grouped)
  }, [symbols])

  // Filter symbols based on search query and active category
  const filteredSymbols = React.useMemo(() => {
    // Get exchanges for the active category
    const categoryExchanges = activeCategory !== 'FAVORITES' 
      ? SYMBOL_CATEGORIES[activeCategory] || SYMBOL_CATEGORIES.ALL
      : Object.keys(groupedSymbols)
    
    // Start with all symbols in the selected category
    let filteredByCategory: GroupedSymbols = {}
    
    categoryExchanges.forEach(exchange => {
      if (groupedSymbols[exchange]) {
        filteredByCategory[exchange] = groupedSymbols[exchange]
      }
    })
    
    // If favorites category and we have favorite symbols
    if (activeCategory === 'FAVORITES' && favoriteSymbols.length > 0) {
      const favoritesByExchange: GroupedSymbols = {}
      
      favoriteSymbols.forEach(symbol => {
        if (!favoritesByExchange[symbol.EXCH_ID]) {
          favoritesByExchange[symbol.EXCH_ID] = []
        }
        favoritesByExchange[symbol.EXCH_ID].push(symbol)
      })
      
      filteredByCategory = favoritesByExchange
    }
    
    // If no search query, return category-filtered results
    if (!searchQuery.trim()) return filteredByCategory
    
    // Apply search query filter
    const query = searchQuery.toLowerCase()
    const filtered: GroupedSymbols = {}
    
    Object.entries(filteredByCategory).forEach(([key, values]) => {
      const matchedSymbols = values.filter(
        symbol => symbol.DISPLAY_NAME.toLowerCase().includes(query)
      )
      
      if (matchedSymbols.length > 0) {
        filtered[key] = matchedSymbols
      }
    })
    
    return filtered
  }, [searchQuery, groupedSymbols, activeCategory, favoriteSymbols])

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Flatten the filtered symbols for keyboard navigation
    const flatSymbols = Object.values(filteredSymbols).flatMap(symbols => symbols)
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < flatSymbols.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : flatSymbols.length - 1))
        break
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < flatSymbols.length) {
          handleSelectSymbol(flatSymbols[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && resultsRef.current) {
      const highlightedElement = resultsRef.current.querySelector(`[data-index="${highlightedIndex}"]`)
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle symbol selection
  const handleSelectSymbol = (symbol: Symbol) => {
    if (onSelect) onSelect(symbol)
    setIsOpen(false)
    setSearchQuery(symbol.DISPLAY_NAME)
  }

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true)
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('')
    setIsOpen(true)
    inputRef.current?.focus()
  }

  // Check if a symbol is in favorites
  const isFavorite = (symbol: Symbol) => {
    return favoriteSymbols.some(fav => 
      fav.EXCH_ID === symbol.EXCH_ID && fav.SECURITY_ID === symbol.SECURITY_ID
    )
  }

  // Handle toggle favorite
  const handleToggleFavorite = (e: React.MouseEvent, symbol: Symbol) => {
    e.stopPropagation() // Prevent symbol selection
    if (onToggleFavorite) {
      onToggleFavorite(symbol)
    }
  }

  // Count total results
  const totalResults = Object.values(filteredSymbols).reduce(
    (sum, symbols) => sum + symbols.length, 0
  )

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 bg-zinc-900 border-zinc-700 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg">
          {/* Category Tabs */}
          <Tabs 
            defaultValue="ALL" 
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-full"
          >
            <div className="border-b border-zinc-800">
              <TabsList className="w-full h-10 bg-zinc-900 rounded-none">
                <TabsTrigger 
                  value="ALL" 
                  className="flex-1 data-[state=active]:bg-zinc-800"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="STOCKS" 
                  className="flex-1 data-[state=active]:bg-zinc-800"
                >
                  Stocks
                </TabsTrigger>
                <TabsTrigger 
                  value="FUTURES" 
                  className="flex-1 data-[state=active]:bg-zinc-800"
                >
                  Futures
                </TabsTrigger>
                {showFavorites && (
                  <TabsTrigger 
                    value="FAVORITES" 
                    className="flex-1 data-[state=active]:bg-zinc-800"
                  >
                    <Star className="h-3.5 w-3.5 mr-1" />
                    Favorites
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            
            <div className="py-1 px-3 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
              <span>
                {loading ? 'Loading...' : `${totalResults} results`}
              </span>
              <div className="flex items-center gap-1.5">
                <span>↑↓ to navigate</span>
                <span>Enter to select</span>
              </div>
            </div>

            <TabsContent value={activeCategory} className="m-0 p-0">
              {loading ? (
                <div className="p-4 text-center text-gray-400">Loading symbols...</div>
              ) : Object.keys(filteredSymbols).length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  {activeCategory === 'FAVORITES' && favoriteSymbols.length === 0 
                    ? 'No favorites added yet'
                    : 'No symbols found'
                  }
                </div>
              ) : (
                <ScrollArea className="h-[400px] overflow-auto" ref={resultsRef}>
                  {Object.entries(filteredSymbols).map(([exchangeId, symbols]) => (
                    <div key={exchangeId} className="mb-2">
                      <div className="sticky top-0 bg-zinc-800 px-3 py-2 text-xs font-semibold text-gray-400 flex items-center">
                        <span className="flex items-center">
                          {EXCHANGE_COUNTRY[exchangeId] && (
                            <div className="mr-2 rounded overflow-hidden w-4 h-4 flex items-center justify-center bg-zinc-700">
                              <Image 
                                src={`/flags/${EXCHANGE_COUNTRY[exchangeId]}.svg`} 
                                alt={exchangeId}
                                width={16}
                                height={16}
                                className="min-w-[16px]"
                              />
                            </div>
                          )}
                          {EXCHANGE_LABELS[exchangeId] || exchangeId}
                        </span>
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </div>
                      
                      <div>
                        {symbols.slice(0, 100).map((symbol, idx) => {
                          // Find the index in the flattened list
                          const flatIndex = Object.entries(filteredSymbols)
                            .slice(0, Object.keys(filteredSymbols).indexOf(exchangeId))
                            .reduce((acc, [_, syms]) => acc + syms.length, 0) + idx
                          
                          return (
                            <div
                              key={`${symbol.EXCH_ID}-${symbol.SECURITY_ID}`}
                              data-index={flatIndex}
                              className={`px-3 py-2 hover:bg-zinc-800 cursor-pointer flex items-center justify-between ${
                                flatIndex === highlightedIndex ? 'bg-zinc-800' : ''
                              }`}
                              onClick={() => handleSelectSymbol(symbol)}
                            >
                              <div className="flex items-center">
                                <span className="font-medium">{symbol.DISPLAY_NAME}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs py-1 px-2 rounded-full bg-zinc-800 text-gray-400 border border-zinc-700">
                                  {symbol.EXCH_ID}
                                </span>
                                
                                {showFavorites && onToggleFavorite && (
                                  <button
                                    onClick={(e) => handleToggleFavorite(e, symbol)}
                                    className="p-1 rounded-full hover:bg-zinc-700"
                                  >
                                    <Star
                                      className={`h-3.5 w-3.5 ${
                                        isFavorite(symbol) 
                                          ? 'fill-yellow-400 text-yellow-400' 
                                          : 'text-gray-400'
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
} 