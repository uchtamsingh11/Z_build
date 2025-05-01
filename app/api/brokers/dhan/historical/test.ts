// This is a simple utility for testing the historical data endpoint
// Run with: npx ts-node app/api/brokers/dhan/historical/test.ts

async function testDhanHistorical() {
  // Replace with your actual environment variables or test values
  const DHAN_ACCESS_TOKEN = process.env.NEXT_PUBLIC_DHAN_ACCESS_TOKEN || 
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzQ4NTE1NDk3LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwNDUzNDE5NiJ9.NVAqIVN_G2tRdWpbUyUtzhRC_rsJIbvf_V_9oBV0sjl1lq6Zeb2afh-0M-6cle1nJRFZaI3ha-FYxoZ77v4l4g";

  // Test for daily historical data
  const dailyRequestBody = {
    securityId: "1333", // Example: RELIANCE
    exchangeSegment: "NSE_EQ",
    instrument: "EQUITY",
    fromDate: "2023-10-01",
    toDate: "2023-10-31",
    oi: false
  };

  try {
    console.log("Testing Dhan Daily Historical Data API");
    console.log("Request:", JSON.stringify(dailyRequestBody, null, 2));
    
    const dailyResponse = await fetch("https://api.dhan.co/v2/charts/historical", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": DHAN_ACCESS_TOKEN
      },
      body: JSON.stringify(dailyRequestBody)
    });

    if (!dailyResponse.ok) {
      const errorText = await dailyResponse.text();
      console.error(`Error (${dailyResponse.status}):`, errorText);
      return;
    }

    const dailyData = await dailyResponse.json();
    console.log("Daily Historical Data (sample):");
    
    // Display a few sample data points
    if (dailyData.timestamp && dailyData.timestamp.length > 0) {
      console.log(`Total data points: ${dailyData.timestamp.length}`);
      console.log("First 3 data points:");
      
      for (let i = 0; i < Math.min(3, dailyData.timestamp.length); i++) {
        console.log({
          timestamp: new Date(dailyData.timestamp[i] * 1000).toISOString(),
          open: dailyData.open[i],
          high: dailyData.high[i], 
          low: dailyData.low[i],
          close: dailyData.close[i],
          volume: dailyData.volume ? dailyData.volume[i] : 'N/A'
        });
      }
    } else {
      console.log("No data returned");
    }

    // Test for intraday data
    const intradayRequestBody = {
      securityId: "1333", // Example: RELIANCE
      exchangeSegment: "NSE_EQ",
      instrument: "EQUITY",
      interval: "5", // 5-minute candles
      fromDate: "2023-10-01 09:15:00",
      toDate: "2023-10-01 15:30:00",
      oi: false
    };

    console.log("\nTesting Dhan Intraday Historical Data API");
    console.log("Request:", JSON.stringify(intradayRequestBody, null, 2));
    
    const intradayResponse = await fetch("https://api.dhan.co/v2/charts/intraday", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": DHAN_ACCESS_TOKEN
      },
      body: JSON.stringify(intradayRequestBody)
    });

    if (!intradayResponse.ok) {
      const errorText = await intradayResponse.text();
      console.error(`Error (${intradayResponse.status}):`, errorText);
      return;
    }

    const intradayData = await intradayResponse.json();
    console.log("Intraday Data (sample):");
    
    // Display a few sample data points
    if (intradayData.timestamp && intradayData.timestamp.length > 0) {
      console.log(`Total data points: ${intradayData.timestamp.length}`);
      console.log("First 3 data points:");
      
      for (let i = 0; i < Math.min(3, intradayData.timestamp.length); i++) {
        console.log({
          timestamp: new Date(intradayData.timestamp[i] * 1000).toISOString(),
          open: intradayData.open[i],
          high: intradayData.high[i], 
          low: intradayData.low[i],
          close: intradayData.close[i],
          volume: intradayData.volume ? intradayData.volume[i] : 'N/A'
        });
      }
    } else {
      console.log("No data returned");
    }
    
  } catch (error) {
    console.error("Error testing Dhan API:", error);
  }
}

// Execute the test
testDhanHistorical(); 