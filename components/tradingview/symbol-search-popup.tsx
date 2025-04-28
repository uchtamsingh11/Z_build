import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Mock symbol data
const mockSymbols = [
  { symbol: "NIFTY", name: "NIFTY 50 INDEX", type: "index", exchange: "NSE" },
  { symbol: "BANKNIFTY", name: "NIFTY BANK INDEX", type: "index", exchange: "NSE" },
  { symbol: "XAUUSD", name: "GOLD", type: "commodity", exchange: "OANDA" },
  { symbol: "BTCUSD", name: "BITCOIN / U.S. DOLLAR", type: "crypto", exchange: "Bitstamp" },
  { symbol: "BTCUSDT", name: "BITCOIN / TETHERUS", type: "crypto", exchange: "Binance" },
  { symbol: "BTCUSD", name: "BITCOIN", type: "crypto", exchange: "CRYPTO" },
  { symbol: "RELIANCE", name: "RELIANCE INDUSTRIES LTD", type: "stock", exchange: "NSE" },
  { symbol: "NIFTY", name: "S&P CNX NIFTY INDEX FUTURES", type: "futures", exchange: "NSE" },
  { symbol: "XAUUSD", name: "GOLD / U.S. DOLLAR", type: "commodity", exchange: "FOREX.com" },
  { symbol: "NIFTY", name: "GIFT NIFTY 50 INDEX FUTURES", type: "futures", exchange: "NSEIX" },
  { symbol: "AAPL", name: "APPLE INC", type: "stock", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "MICROSOFT CORP", type: "stock", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "AMAZON.COM INC", type: "stock", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "ALPHABET INC", type: "stock", exchange: "NASDAQ" },
  { symbol: "META", name: "META PLATFORMS INC", type: "stock", exchange: "NASDAQ" },
];

type Filter = "All" | "Stocks" | "Crypto" | "Futures" | "Forex" | "Indices" | "Bonds" | "Economy" | "Options";

interface SymbolSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string) => void;
  isDarkMode: boolean;
}

const SymbolSearchPopup: React.FC<SymbolSearchPopupProps> = ({
  isOpen,
  onClose,
  onSelectSymbol,
  isDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filter symbols based on search and active filter
  const filteredSymbols = mockSymbols.filter((symbol) => {
    const matchesSearch = 
      searchQuery === "" || 
      symbol.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      symbol.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      activeFilter === "All" || 
      symbol.type.toLowerCase() === activeFilter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  if (!isOpen) return null;

  const filters: Filter[] = ["All", "Stocks", "Futures", "Forex", "Crypto", "Indices", "Bonds", "Economy", "Options"];

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
          {filteredSymbols.length > 0 ? (
            filteredSymbols.map((item, index) => (
              <div
                key={`${item.symbol}-${item.exchange}-${index}`}
                onClick={() => onSelectSymbol(item.symbol)}
                className={`flex cursor-pointer items-center justify-between rounded-md p-3 transition-colors ${
                  isDarkMode
                    ? "hover:bg-zinc-800"
                    : "hover:bg-zinc-100"
                }`}
              >
                <div className="flex items-center">
                  <div className={`mr-4 rounded-full p-2 ${getSymbolTypeColor(item.type, isDarkMode)}`}>
                    {getSymbolTypeIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="text-base font-medium">{item.symbol}</span>
                      <span className={`ml-3 text-sm ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                        {item.exchange}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{item.name}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-24 items-center justify-center">
              <p className={`text-base ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                No symbols found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSS for animation */}
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
    case "stock":
      return isDarkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700";
    case "crypto":
      return isDarkMode ? "bg-orange-900/30 text-orange-300" : "bg-orange-100 text-orange-700";
    case "futures":
      return isDarkMode ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-700";
    case "forex":
      return isDarkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700";
    case "index":
      return isDarkMode ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700";
    case "commodity":
      return isDarkMode ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-100 text-yellow-700";
    default:
      return isDarkMode ? "bg-gray-900/30 text-gray-300" : "bg-gray-100 text-gray-700";
  }
}

function getSymbolTypeIcon(type: string): React.ReactNode {
  switch (type.toLowerCase()) {
    case "stock":
      return <span className="text-xs">S</span>;
    case "crypto":
      return <span className="text-xs">C</span>;
    case "futures":
      return <span className="text-xs">F</span>;
    case "forex":
      return <span className="text-xs">FX</span>;
    case "index":
      return <span className="text-xs">I</span>;
    case "commodity":
      return <span className="text-xs">CM</span>;
    default:
      return <span className="text-xs">?</span>;
  }
}

export default SymbolSearchPopup; 