import React, { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Symbol type definition
interface SymbolData {
  DISPLAY_NAME: string;
  EXCH_ID: string;
  SECURITY_ID: string | number;
}

type Filter = "All" | "Stocks" | "Crypto" | "Futures" | "Forex" | "Indices" | "Bonds" | "Economy" | "Options";

interface SymbolSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string, securityId?: string, exchangeSegment?: string) => void;
  isDarkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SymbolData[];
  isSearching: boolean;
  searchError: string;
}

const SymbolSearchPopup: React.FC<SymbolSearchPopupProps> = ({
  isOpen,
  onClose,
  onSelectSymbol,
  isDarkMode,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  searchError,
}) => {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the search input when the popup opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter already handled by the parent component via Supabase query
  // Here we just need to handle the category filter (which we could add to DB later)
  const filteredSymbols = searchResults;

  if (!isOpen) return null;

  const filters: Filter[] = ["All", "Stocks", "Futures", "Forex", "Crypto", "Indices", "Bonds", "Economy", "Options"];

  // Helper function to get symbol type from exchange ID (simplified version)
  const getSymbolType = (exchangeId: string): string => {
    const exchange = exchangeId.toLowerCase();
    if (exchange.includes('nasdaq') || exchange.includes('nyse')) return 'stock';
    if (exchange.includes('binance') || exchange.includes('coinbase')) return 'crypto';
    if (exchange.includes('fx') || exchange.includes('forex')) return 'forex';
    if (exchange.includes('future')) return 'futures';
    if (exchange.includes('index')) return 'index';
    return 'stock'; // Default category
  };

  // Helper to convert exchange ID to Dhan exchangeSegment format
  const getExchangeSegment = (exchangeId: string): string => {
    // Default to NSE_EQ if we can't determine
    if (!exchangeId) return 'NSE_EQ';
    
    const exchange = exchangeId.toUpperCase();
    
    // Handle Indian exchanges first (highest priority)
    if (exchange.includes('NSE')) {
      if (exchange.includes('FUT') || exchange.includes('OPT') || exchange.includes('FO')) {
        return 'NSE_FO';
      } else if (exchange.includes('CURR')) {
        return 'NSE_CURR';
      }
      return 'NSE_EQ';
    }
    
    if (exchange.includes('BSE')) {
      if (exchange.includes('FUT') || exchange.includes('OPT') || exchange.includes('FO')) {
        return 'BSE_FO';
      }
      return 'BSE_EQ';
    }
    
    if (exchange.includes('MCX')) {
      return 'MCX_FO';
    }
    
    // For non-Indian exchanges, map to NSE_EQ as fallback
    // In a production app, you would either filter these out
    // or map to appropriate Dhan segments
    return 'NSE_EQ';
  };

  // Helper to generate a readable display name for the exchange
  const getExchangeDisplayName = (exchangeSegment: string): string => {
    switch (exchangeSegment) {
      case 'NSE_EQ': return 'NSE';
      case 'BSE_EQ': return 'BSE';
      case 'NSE_FO': return 'NSE F&O';
      case 'BSE_FO': return 'BSE F&O';
      case 'NSE_CURR': return 'NSE Currency';
      case 'MCX_FO': return 'MCX';
      default: return exchangeSegment;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        ref={popupRef}
        className={`w-full max-w-3xl rounded-lg shadow-xl ${
          isDarkMode ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
        }`}
        style={{
          animation: "popupFadeIn 0.2s ease-out",
        }}
      >
        {/* Popup header */}
        <div className="flex items-center justify-between border-b p-5 pb-4 pt-4">
          <h3 className="text-lg font-medium">Symbol Search</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={`h-8 w-8 rounded-full ${
              isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
            }`}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Search input */}
        <div className="relative border-b p-5 pb-5 pt-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${
              isDarkMode ? "text-zinc-400" : "text-zinc-500"
            }`} />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-12 w-full pl-10 text-base ${
                isDarkMode 
                  ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400" 
                  : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-500"
              }`}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div 
          className={`flex w-full items-center overflow-x-auto border-b px-4 py-2 ${
            isDarkMode ? "border-zinc-800" : "border-zinc-200"
          }`}
        >
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium mr-2 transition-colors ${
                activeFilter === filter
                  ? isDarkMode
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-200 text-zinc-900"
                  : isDarkMode
                  ? "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Symbol list */}
        <div 
          className="max-h-[400px] overflow-y-auto p-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDarkMode ? '#4b5563 #1f2937' : '#d1d5db #f3f4f6',
          }}
        >
          {isSearching ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className={`h-6 w-6 animate-spin ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`} />
              <p className={`ml-2 text-base ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                Searching...
              </p>
            </div>
          ) : searchError ? (
            <div className="flex h-24 items-center justify-center">
              <p className={`text-base text-red-500`}>
                {searchError}
              </p>
            </div>
          ) : filteredSymbols.length > 0 ? (
            filteredSymbols.map((item, index) => {
              // Extract symbol from display name
              const symbolParts = item.DISPLAY_NAME.split(' ');
              const symbolText = symbolParts[0];
              
              // Get symbol type based on exchange
              const symbolType = getSymbolType(item.EXCH_ID || '');
              
              // Get Dhan exchange segment format
              const exchangeSegment = getExchangeSegment(item.EXCH_ID || '');
              
              // Get human-readable exchange name
              const exchangeDisplayName = getExchangeDisplayName(exchangeSegment);
              
              // Convert security ID to string
              const securityId = item.SECURITY_ID?.toString() || "";
              
              return (
                <div
                  key={`${item.SECURITY_ID}-${index}`}
                  onClick={() => onSelectSymbol(symbolText, securityId, exchangeSegment)}
                  className={`flex cursor-pointer items-center justify-between rounded-md p-3 transition-colors ${
                    isDarkMode
                      ? "hover:bg-zinc-800"
                      : "hover:bg-zinc-100"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`mr-4 rounded-full p-2 ${getSymbolTypeColor(symbolType, isDarkMode)}`}>
                      {getSymbolTypeIcon(symbolType)}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="text-base font-medium">{symbolText}</span>
                        <span className={`ml-3 text-sm ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                          {exchangeDisplayName}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.DISPLAY_NAME}
                        {securityId && <span className="ml-2 text-xs opacity-70">(ID: {securityId})</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : searchQuery.trim() ? (
            <div className="flex h-24 items-center justify-center">
              <p className={`text-base ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                No symbols found
              </p>
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center">
              <p className={`text-base ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                Type to search for symbols
              </p>
            </div>
          )}
        </div>
        
        {/* Footer with info */}
        <div className={`border-t p-4 text-center text-sm ${isDarkMode ? "border-zinc-800 text-zinc-400" : "border-zinc-200 text-zinc-500"}`}>
          Searching in Dhan-supported symbols only • Use exchange prefix for more precise results
        </div>
      </div>

      {/* Global styles for the popup animation */}
      <style jsx global>{`
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Helper functions to get colors and icons based on symbol type
function getSymbolTypeColor(type: string, isDarkMode: boolean): string {
  switch (type.toLowerCase()) {
    case 'stock':
      return isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700';
    case 'crypto':
      return isDarkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700';
    case 'forex':
      return isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700';
    case 'futures':
      return isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700';
    case 'index':
      return isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700';
    default:
      return isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700';
  }
}

function getSymbolTypeIcon(type: string): React.ReactNode {
  // You could import and use actual icons here
  switch (type.toLowerCase()) {
    case 'stock':
      return <span className="text-xs">S</span>;
    case 'crypto':
      return <span className="text-xs">C</span>;
    case 'forex':
      return <span className="text-xs">FX</span>;
    case 'futures':
      return <span className="text-xs">FU</span>;
    case 'index':
      return <span className="text-xs">I</span>;
    default:
      return <span className="text-xs">?</span>;
  }
}

export default SymbolSearchPopup; 