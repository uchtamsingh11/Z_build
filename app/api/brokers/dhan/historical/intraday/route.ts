import { NextRequest, NextResponse } from "next/server";

interface DhanIntradayRequestParams {
  securityId: string;
  exchangeSegment: string;
  instrument: string;
  interval: string;
  expiryCode?: number;
  oi?: boolean;
  fromDate: string;
  toDate: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      symbol,
      exchangeSegment,
      interval = "1",
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

    // Validate that interval is one of the supported values by Dhan
    if (!['1', '5', '15', '25', '60'].includes(interval)) {
      return NextResponse.json(
        { error: `Unsupported interval: ${interval}. Dhan only supports 1, 5, 15, 25, 60 minutes for intraday data` }, 
        { status: 400 }
      );
    }

    // Set default date range if not provided (last 5 days for intraday)
    const toDate = customToDate || new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD format
    
    // Calculate fromDate (5 days ago) if not provided - Dhan limits intraday to 90 days
    let fromDate = customFromDate;
    if (!fromDate) {
      const date = new Date();
      date.setDate(date.getDate() - 5); // Default to 5 days for intraday data
      fromDate = date.toISOString().split("T")[0];
    }
    
    // Ensure dates have time component for intraday
    if (!fromDate.includes(":")) {
      fromDate = `${fromDate} 09:15:00`;
    }
    
    if (!toDate.includes(":")) {
      toDate = `${toDate} 15:30:00`;
    }

    // Construct the Dhan intraday API endpoint
    const endpoint = "https://api.dhan.co/v2/charts/intraday";

    console.log(`[Dhan API] Making intraday request to ${endpoint} with interval ${interval}`);

    // Prepare request params based on Dhan API requirements
    const requestParams: DhanIntradayRequestParams = {
      securityId: symbol,
      exchangeSegment: exchangeSegment.toUpperCase(),
      instrument: instrument.toUpperCase(),
      interval: interval,
      fromDate: fromDate,
      toDate: toDate,
      oi: oi
    };

    // Add expiry code if provided (for derivatives)
    if (expiryCode !== undefined) {
      requestParams.expiryCode = expiryCode;
    }

    console.log(`[Dhan API] Intraday request params:`, requestParams);

    // Get access token from environment variables
    const accessToken = process.env.DHAN_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error("[Dhan API] Missing access token for intraday request");
      return NextResponse.json(
        { error: "Authentication configuration error. Missing Dhan API token." },
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
      console.error(`[Dhan API] Intraday error response (${response.status}):`, errorData);
      
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
            error: "Invalid request parameters for Dhan intraday API", 
            details: errorData 
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch intraday data from Dhan API",
          details: errorData 
        },
        { status: response.status }
      );
    }

    // Parse and return the data
    const data = await response.json();
    console.log(`[Dhan API] Successfully fetched intraday data with ${data?.timestamp?.length || 0} candles`);
    
    // Transform the response into a more usable format for frontend charting libraries
    const transformedData = transformDhanResponse(data, symbol, interval);
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("[Dhan API] Unexpected error in intraday request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: "An unexpected error occurred during intraday data fetch", message: errorMessage },
      { status: 500 }
    );
  }
}

// Function to transform Dhan intraday API response into a format suitable for chart libraries
function transformDhanResponse(data: any, symbol: string, interval: string) {
  const { open, high, low, close, volume, timestamp } = data;
  
  // Check if we have valid data arrays
  if (!open || !high || !low || !close || !timestamp) {
    console.warn("[Dhan API] Invalid or empty intraday data structure received");
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