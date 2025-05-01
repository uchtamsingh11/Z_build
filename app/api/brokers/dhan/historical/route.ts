import { NextRequest, NextResponse } from "next/server";

interface DhanHistoricalRequestParams {
  securityId: string;
  exchangeSegment: string;
  instrument: string;
  expiryCode?: number;
  oi?: boolean;
  fromDate: string;
  toDate: string;
}

interface DhanIntradayRequestParams extends DhanHistoricalRequestParams {
  interval: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      symbol,
      exchangeSegment,
      interval,
      fromDate: customFromDate,
      toDate: customToDate,
    } = body;

    // Validate required inputs
    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    if (!exchangeSegment) {
      return NextResponse.json({ error: "Exchange segment is required" }, { status: 400 });
    }

    if (!interval) {
      return NextResponse.json({ error: "Interval is required" }, { status: 400 });
    }

    // Set default date range if not provided (last 30 days)
    const toDate = customToDate || new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD format
    
    // Calculate fromDate (30 days ago) if not provided
    let fromDate = customFromDate;
    if (!fromDate) {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      fromDate = date.toISOString().split("T")[0];
    }

    // Determine if we need daily or intraday data based on interval
    const isIntraday = interval.toLowerCase().includes("m") || interval.toLowerCase().includes("h");
    
    // Construct the API endpoint based on data type
    const endpoint = isIntraday
      ? "https://api.dhan.co/v2/charts/intraday"
      : "https://api.dhan.co/v2/charts/historical";

    // Prepare request params based on Dhan API requirements
    const requestParams: DhanHistoricalRequestParams | DhanIntradayRequestParams = {
      securityId: symbol,
      exchangeSegment: exchangeSegment.toUpperCase(),
      instrument: "EQUITY", // Default to EQUITY, can be made configurable
      fromDate: fromDate,
      toDate: toDate,
      oi: false
    };

    // Add interval parameter for intraday requests
    if (isIntraday) {
      // Convert interval format (e.g., "5m" to "5")
      const intervalValue = interval.match(/\d+/)?.[0] || "1";
      (requestParams as DhanIntradayRequestParams).interval = intervalValue;
      
      // For intraday, dates need to include time (HH:MM:SS)
      if (!customFromDate?.includes(":")) {
        (requestParams as DhanIntradayRequestParams).fromDate = `${fromDate} 09:15:00`;
      }
      
      if (!customToDate?.includes(":")) {
        (requestParams as DhanIntradayRequestParams).toDate = `${toDate} 15:30:00`;
      }
    }

    console.log(`[Dhan API] Fetching ${isIntraday ? 'intraday' : 'daily'} data:`, requestParams);

    // Get access token from environment variables
    const accessToken = process.env.NEXT_PUBLIC_DHAN_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error("[Dhan API] Missing access token");
      return NextResponse.json(
        { error: "Authentication configuration error" },
        { status: 500 }
      );
    }

    // Make the API request to Dhan
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "access-token": accessToken
      },
      body: JSON.stringify(requestParams),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[Dhan API] Error response (${response.status}):`, errorData);
      
      // Handle specific error codes
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed. Token may have expired." },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch data from Dhan API",
          details: errorData 
        },
        { status: response.status }
      );
    }

    // Parse and return the data
    const data = await response.json();
    console.log("[Dhan API] Successfully fetched data");
    
    // Transform the response into a more usable format for frontend charting libraries
    const transformedData = transformDhanResponse(data);
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("[Dhan API] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Function to transform Dhan API response into a format suitable for chart libraries
function transformDhanResponse(data: any) {
  const { open, high, low, close, volume, timestamp } = data;
  
  // Check if we have valid data arrays
  if (!open || !high || !low || !close || !timestamp) {
    return { data: [] };
  }
  
  // Create an array of OHLCV objects
  const ohlcvData = timestamp.map((time: number, index: number) => {
    // Convert timestamp to milliseconds if it's in seconds
    const timeMs = time * 1000;
    
    return {
      time: timeMs,
      open: open[index],
      high: high[index],
      low: low[index],
      close: close[index],
      volume: volume ? volume[index] : 0
    };
  });
  
  return {
    data: ohlcvData,
    meta: {
      symbol: "symbol", // Could be passed from the original request if needed
      interval: "interval", // Could be passed from the original request
      count: ohlcvData.length
    }
  };
} 