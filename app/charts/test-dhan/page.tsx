"use client";

import { useState, useEffect } from "react";
import { fetchHistoricalData, formatIntervalForDhan } from "@/app/services/dhanApi";

export default function TestDhanHistoricalPage() {
  const [symbol, setSymbol] = useState("1333"); // Example: RELIANCE
  const [exchangeSegment, setExchangeSegment] = useState("NSE_EQ");
  const [interval, setInterval] = useState("1d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const formattedInterval = formatIntervalForDhan(interval);
      
      const params = {
        symbol,
        exchangeSegment,
        interval: formattedInterval,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate })
      };
      
      console.log("Fetching data with params:", params);
      
      const data = await fetchHistoricalData(params);
      setResults(data);
      
      console.log("Data received:", data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Test Dhan Historical Data API</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Security ID</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., 1333 for RELIANCE"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Exchange Segment</label>
          <select
            value={exchangeSegment}
            onChange={(e) => setExchangeSegment(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="NSE_EQ">NSE Equity</option>
            <option value="BSE_EQ">BSE Equity</option>
            <option value="NSE_FO">NSE F&O</option>
            <option value="NSE_CURR">NSE Currency</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Interval</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="1d">Daily (1D)</option>
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="25m">25 Minutes</option>
            <option value="60m">60 Minutes (1 Hour)</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">From Date (Optional)</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">To Date (Optional)</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      
      <div className="mb-6">
        <button
          onClick={handleFetchData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Loading..." : "Fetch Data"}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          <div className="p-3 bg-gray-100 border rounded">
            <div className="mb-2">
              <strong>Total Data Points:</strong> {results.data.length}
            </div>
            
            {results.data.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Sample Data (First 5 Points)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2 border">Time</th>
                        <th className="px-4 py-2 border">Open</th>
                        <th className="px-4 py-2 border">High</th>
                        <th className="px-4 py-2 border">Low</th>
                        <th className="px-4 py-2 border">Close</th>
                        <th className="px-4 py-2 border">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.data.slice(0, 5).map((point: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2 border">{new Date(point.time).toLocaleString()}</td>
                          <td className="px-4 py-2 border">{point.open}</td>
                          <td className="px-4 py-2 border">{point.high}</td>
                          <td className="px-4 py-2 border">{point.low}</td>
                          <td className="px-4 py-2 border">{point.close}</td>
                          <td className="px-4 py-2 border">{point.volume}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 