"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface TickerTapeProps {
  symbols?: { proName: string; title: string }[];
  colorTheme?: "light" | "dark";
  isTransparent?: boolean;
  showSymbolLogo?: boolean;
  displayMode?: "regular" | "adaptive" | "compact";
  locale?: string;
}

export function TickerTape({
  symbols = [
    { proName: "NASDAQ:AAPL", title: "Apple" },
    { proName: "NASDAQ:GOOGL", title: "Google" },
    { proName: "NASDAQ:TSLA", title: "Tesla" },
    { proName: "FX_IDC:USDINR", title: "USD/INR" },
    { proName: "CRYPTOCAP:BTC", title: "Bitcoin" },
  ],
  colorTheme = "dark",
  isTransparent = true,
  showSymbolLogo = true,
  displayMode = "regular",
  locale = "en",
}: TickerTapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing scripts to prevent duplicates
    const existingScript = document.getElementById("tradingview-ticker-widget");
    if (existingScript) {
      existingScript.remove();
    }

    // Create the script element
    const script = document.createElement("script");
    script.id = "tradingview-ticker-widget";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";
    
    // Configure the widget
    script.innerHTML = JSON.stringify({
      symbols,
      colorTheme,
      isTransparent,
      showSymbolLogo,
      displayMode,
      locale,
    });

    // Append script to container
    containerRef.current.appendChild(script);

    // Clean up on unmount
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbols, colorTheme, isTransparent, showSymbolLogo, displayMode, locale]);

  return (
    <Card className="w-full overflow-hidden bg-zinc-950 border border-zinc-900 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div 
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ minHeight: "48px" }}
      >
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </Card>
  );
} 