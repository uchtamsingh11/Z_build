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
      instrument = "EQUITY",
      fromDate: customFromDate,
      toDate: customToDate,
      expiryCode,
      oi = false
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
    const toDateValue = customToDate || new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD format
    
    // Calculate fromDate (30 days ago) if not provided
    let fromDateValue = customFromDate;
    if (!fromDateValue) {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      fromDateValue = date.toISOString().split("T")[0];
    }

    // Determine if we need daily or intraday data based on interval
    const isIntraday = 
      interval.toLowerCase() === '1' || 
      interval.toLowerCase() === '5' || 
      interval.toLowerCase() === '15' || 
      interval.toLowerCase() === '25' || 
      interval.toLowerCase() === '60';
    
    // Construct the API endpoint based on data type
    const endpoint = isIntraday
      ? "https://api.dhan.co/v2/charts/intraday"
      : "https://api.dhan.co/v2/charts/historical";

    console.log(`[Dhan API] Making ${isIntraday ? 'intraday' : 'daily'} request to ${endpoint}`);

    // Format dates if needed
    let formattedFromDate = fromDateValue;
    let formattedToDate = toDateValue;
    
    // For intraday, ensure dates include time component (HH:MM:SS)
    if (isIntraday) {
      if (!fromDateValue.includes(":")) {
        formattedFromDate = `${fromDateValue} 09:15:00`;
      }
      
      if (!toDateValue.includes(":")) {
        formattedToDate = `${toDateValue} 15:30:00`;
      }
    }

    // Prepare request params based on Dhan API requirements
    let requestParams: DhanHistoricalRequestParams | DhanIntradayRequestParams = {
      securityId: symbol,
      exchangeSegment: exchangeSegment.toUpperCase(),
      instrument: instrument.toUpperCase(), 
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      oi: oi
    };

    // Add interval parameter for intraday requests
    if (isIntraday) {
      (requestParams as DhanIntradayRequestParams).interval = interval;
    }

    // Add expiry code if provided (for derivatives)
    if (expiryCode !== undefined) {
      requestParams.expiryCode = expiryCode;
    }

    console.log(`[Dhan API] Request params:`, requestParams);

    // Get access token from environment variables
    const accessToken = process.env.DHAN_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error("[Dhan API] Missing access token");
      return NextResponse.json(
        { error: "Authentication configuration error. Missing Dhan API token." },
        { status: 500 }
      );
    }

    // Make the API request to Dhan
    console.log(`[Dhan Debug] Sending request to ${endpoint} with params:`, requestParams);
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "access-token": accessToken
      },
      body: JSON.stringify(requestParams),
    });

    console.log(`[Dhan Debug] Response status: ${response.status} ${response.statusText}`);
    
    // Log response headers for debugging
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('[Dhan Debug] Response headers:', responseHeaders);

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
        console.error(`[Dhan API] Detailed error from Dhan API:`, errorBody);
      } catch (parseError) {
        console.error(`[Dhan API] Failed to parse error response:`, parseError);
        // Try to get response text if JSON parsing fails
        try {
          const textResponse = await response.text();
          console.error(`[Dhan API] Raw error response:`, textResponse);
        } catch (textError) {
          console.error(`[Dhan API] Could not get response text either:`, textError);
        }
      }
      
      // Handle specific error codes
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed. Dhan API token may have expired." },
          { status: 401 }
        );
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Too many requests to Dhan API." },
          { status: 429 }
        );
      }
      
      if (response.status === 400) {
        return NextResponse.json(
          { 
            error: "Invalid request parameters for Dhan API", 
            details: errorBody 
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch data from Dhan API",
          details: errorBody 
        },
        { status: response.status }
      );
    }

    // Parse and return the data
    const data = await response.json();
    console.log(`[Dhan API] Successfully fetched ${isIntraday ? 'intraday' : 'daily'} data`);
    
    // Transform the response into a more usable format for frontend charting libraries
    const transformedData = transformDhanResponse(data, symbol, interval);
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("[Dhan API] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: "An unexpected error occurred", message: errorMessage },
      { status: 500 }
    );
  }
}

// Function to transform Dhan API response into a format suitable for chart libraries
function transformDhanResponse(data: any, symbol: string, interval: string) {
  const { open, high, low, close, volume, timestamp } = data;
  
  // Check if we have valid data arrays
  if (!open || !high || !low || !close || !timestamp) {
    console.warn("[Dhan API] Invalid or empty data structure received");
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
      symbol: symbol,
      interval: interval,
      count: ohlcvData.length
    }
  };
} 