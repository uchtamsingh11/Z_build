/**
 * Service utility for interacting with Dhan API endpoints
 */

interface HistoricalDataParams {
  symbol: string;
  exchangeSegment: string;
  interval: string;
  instrument?: string;
  fromDate?: string;
  toDate?: string;
  expiryCode?: number;
  oi?: boolean;
}

interface OHLCDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HistoricalDataResponse {
  data: OHLCDataPoint[];
  meta: {
    symbol: string;
    interval: string;
    count: number;
  };
}

/**
 * Fetches historical OHLC data from Dhan API via our backend endpoint
 * 
 * @param params Parameters for historical data request
 * @returns Formatted OHLC data ready for chart display
 */
export async function fetchHistoricalData(params: HistoricalDataParams): Promise<HistoricalDataResponse> {
  try {
    const isIntraday = params.interval.toLowerCase().includes('m') || 
                        params.interval.toLowerCase().includes('h');

    // Determine the appropriate endpoint based on the interval
    const endpoint = isIntraday ? '/api/brokers/dhan/historical/intraday' : '/api/brokers/dhan/historical';
    
    // Default to EQUITY if instrument not provided
    const requestParams = {
      ...params,
      instrument: params.instrument || 'EQUITY'
    };

    console.log(`[Dhan API] Fetching ${isIntraday ? 'intraday' : 'daily'} data for ${params.symbol} (${params.exchangeSegment}) with interval ${params.interval}`);

    // Call our backend API endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestParams),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('[Dhan API] Error fetching historical data:', errorData);
      throw new Error(`Failed to fetch historical data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[Dhan API] Successfully received ${data.data?.length || 0} data points`);
    return data;
  } catch (error) {
    console.error('[Dhan API] Fetch error:', error);
    throw error;
  }
}

/**
 * Converts a frontend interval format (1d, 5m, etc.) to Dhan API format
 * 
 * @param interval Frontend interval format
 * @returns Dhan API compatible interval
 */
export function formatIntervalForDhan(interval: string): string {
  // Convert intervals like "1d", "5m", "1h" to Dhan format
  const intervalLower = interval.toLowerCase();
  
  // For daily, weekly, monthly intervals - we use the historical endpoint
  if (intervalLower.includes('d')) {
    return 'D'; // Daily candles - Dhan uses empty string for daily
  }
  
  if (intervalLower.includes('w')) {
    return 'W'; // Weekly candles
  }
  
  if (intervalLower.includes('m') && !intervalLower.match(/\d+m/)) {
    return 'M'; // Monthly candles (not to be confused with minutes)
  }
  
  // Extract the numeric part for minute intervals
  if (intervalLower.includes('m') && intervalLower.match(/\d+m/)) {
    const minutes = intervalLower.match(/\d+/)?.[0] || '1';
    // Dhan accepts 1, 5, 15, 25, 60 for intraday
    // Validate the interval is one of the supported values
    if (!['1', '5', '15', '25', '60'].includes(minutes)) {
      console.warn(`Unsupported minute interval: ${minutes}, defaulting to nearest supported value`);
      // Map to the nearest supported interval
      const minutesNum = parseInt(minutes, 10);
      if (minutesNum < 3) return '1';
      if (minutesNum < 10) return '5';
      if (minutesNum < 20) return '15';
      if (minutesNum < 43) return '25';
      return '60';
    }
    return minutes;
  }
  
  // Convert hour intervals to minutes
  if (intervalLower.includes('h')) {
    const hours = parseInt(intervalLower.match(/\d+/)?.[0] || '1', 10);
    // Convert hours to minutes (Dhan accepts 60 for 1h)
    return (hours * 60).toString();
  }
  
  // Default to 1-minute interval if format not recognized
  console.warn(`Unrecognized interval format: ${interval}, defaulting to 1-minute`);
  return '1';
}

/**
 * Maps a display symbol to Dhan's security ID format
 * Mainly used for handling symbolic references like NSE:RELIANCE vs the numeric securityId
 * 
 * @param symbol Display symbol (e.g., "NSE:RELIANCE")
 * @returns Object containing Dhan API parameters
 */
export function mapSymbolToDhan(symbol: string): { securityId: string, exchangeSegment: string } {
  // Default values
  let securityId = symbol;
  let exchangeSegment = "NSE_EQ";
  
  // If symbol contains exchange prefix (e.g. NSE:RELIANCE)
  if (symbol.includes(':')) {
    const [exchange, ticker] = symbol.split(':');
    
    // Set exchange segment based on exchange prefix
    if (exchange.toUpperCase() === 'NSE') {
      exchangeSegment = 'NSE_EQ';
    } else if (exchange.toUpperCase() === 'BSE') {
      exchangeSegment = 'BSE_EQ';
    }
    
    // For now, just return the ticker part - in a real implementation
    // you would look up the securityId from your database
    securityId = ticker;
    
    console.log(`Mapped symbol ${symbol} to securityId: ${securityId}, exchangeSegment: ${exchangeSegment}`);
  }
  
  return { securityId, exchangeSegment };
} 