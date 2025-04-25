"use client";

import { Metadata } from "next"
import React, { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";



export default function AdvancedChartsPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    
    // Apply styles to hide watermark 
    const style = document.createElement('style');
    style.textContent = `
      .tv-lightweight-charts .tv-lightweight-charts__watermark {
        display: none !important;
      }
      .tv-lightweight-charts [class*="watermark"] {
        display: none !important;
      }
      .watermarka, .watermarka-label {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#000',
        attributionLogo: false,
      },
      grid: {
        vertLines: {
          color: '#eee',
        },
        horzLines: {
          color: '#eee',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {});
    // Generate one unique data point per day for 30 days
    const generateMockCandleData = () => {
      const data = [];
      const days = 30;
      let basePrice = 17000;
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - days + i + 1);
        const time = date.toISOString().slice(0, 10); // YYYY-MM-DD
        const open = basePrice + Math.random() * 10 - 5;
        const close = open + Math.random() * 10 - 5;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        data.push({
          time,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
        });
        basePrice = close;
      }
      return data;
    };
    const candleData = generateMockCandleData();
    candleSeries.setData(candleData);
    const handleResize = () => {
      chart.resize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.head.removeChild(style);
      chart.remove();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <div
        ref={chartContainerRef}
        className="chart-container"
        style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}
      />
    </div>
  );
}