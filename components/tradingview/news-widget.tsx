"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface NewsWidgetProps {
  colorTheme?: "light" | "dark";
  isTransparent?: boolean;
  width?: string | number;
  height?: string | number;
  showBorder?: boolean;
  newsCategories?: string[];
  showCompact?: boolean;
  locale?: string;
}

export function NewsWidget({
  colorTheme = "dark",
  isTransparent = true,
  width = "100%",
  height = 400,
  showBorder = false,
  newsCategories = ["headlines", "stock"],
  showCompact = false,
  locale = "en",
}: NewsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing scripts to prevent duplicates
    const existingScript = document.getElementById("tradingview-news-widget");
    if (existingScript) {
      existingScript.remove();
    }

    // Create the script element
    const script = document.createElement("script");
    script.id = "tradingview-news-widget";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.async = true;
    script.type = "text/javascript";
    
    // Configure the widget
    script.innerHTML = JSON.stringify({
      colorTheme,
      isTransparent,
      displayMode: showCompact ? "compact" : "regular",
      width,
      height,
      locale,
      feedMode: "all_symbols",
      newsCategories,
      ...(showBorder && { borderColor: "#363636" }),
    });

    // Append script to container
    containerRef.current.appendChild(script);

    // Clean up on unmount
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [colorTheme, isTransparent, width, height, showBorder, newsCategories, showCompact, locale]);

  return (
    <Card className="w-full border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className="tradingview-widget-container"
        >
          <div className="tradingview-widget-container__widget"></div>
        </div>
      </CardContent>
    </Card>
  );
} 