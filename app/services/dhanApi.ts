/**
 * Service utility for interacting with Dhan API endpoints
 */

interface HistoricalDataParams {
  symbol: string;
  exchangeSegment: string;
  interval: string;
  fromDate?: string;
  toDate?: string;
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
    // Call our backend API endpoint
    const response = await fetch('/api/brokers/dhan/historical', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('[Dhan API] Error fetching historical data:', errorData);
      throw new Error(`Failed to fetch historical data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
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
  
  if (intervalLower.includes('d')) {
    // Daily interval doesn't need conversion
    return intervalLower;
  }
  
  // Extract the numeric part for minute intervals
  if (intervalLower.includes('m')) {
    const minutes = intervalLower.match(/\d+/)?.[0] || '1';
    // Dhan accepts 1, 5, 15, 25, 60 for intraday
    return minutes;
  }
  
  // Convert hour intervals to minutes
  if (intervalLower.includes('h')) {
    const hours = parseInt(intervalLower.match(/\d+/)?.[0] || '1', 10);
    // Convert hours to minutes (Dhan accepts 60 for 1h)
    return (hours * 60).toString();
  }
  
  // Default to 1-minute interval if format not recognized
  return '1';
} 