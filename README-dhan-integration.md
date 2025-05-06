# Dhan API Integration

This document outlines how to set up and use the Dhan broker API for charting data in our application.

## Setup

1. Obtain a Dhan API access token from your Dhan broker account
2. Add the token to your `.env.local` file:

```
DHAN_ACCESS_TOKEN=your_dhan_access_token_here
```

3. Restart your development server to apply the changes

## Endpoints

The application uses Dhan's two main historical data endpoints:

- `https://api.dhan.co/v2/charts/historical` - For daily, weekly, and monthly candles
- `https://api.dhan.co/v2/charts/intraday` - For 1, 5, 15, 25, and 60-minute candles

## Symbol Format

Dhan uses numeric `securityId` values to identify instruments. Our application maintains a mapping between human-readable symbols (e.g., `NSE:RELIANCE`) and Dhan's internal IDs.

The supported exchange segments in Dhan are:

- `NSE_EQ` - NSE Equity
- `BSE_EQ` - BSE Equity
- `NSE_FO` - NSE Futures & Options
- `BSE_FO` - BSE Futures & Options
- `NSE_CURR` - NSE Currency
- `MCX_FO` - MCX Futures & Options

## API Structure

All Dhan API requests are proxied through our backend API routes to secure the access token:

- `/api/brokers/dhan/historical` - Daily data
- `/api/brokers/dhan/historical/intraday` - Intraday data

## Timeframe Support

The following timeframes are supported by Dhan:

- **Intraday**: 1, 5, 15, 25, and 60 minutes
- **Daily**: D (daily), W (weekly), M (monthly)

## Rate Limits and Quotas

Dhan imposes a limit of 90 days for intraday data requests. For historical daily data, you can request back to the symbol's inception date.

## Error Handling

Common error codes from Dhan API:
- 401: Authentication issues (expired token)
- 429: Rate limiting
- 400: Invalid parameters

## Testing

You can test the integration with these examples:

1. Daily data for Reliance: `NSE:RELIANCE` (securityId: 1333)
2. Intraday data for TCS: `NSE:TCS` (securityId: 11536)

## Troubleshooting

If you encounter issues:

1. Check the browser console and server logs for specific error messages
2. Verify your Dhan API token is correctly set in the environment variables
3. Ensure the security ID and exchange segment are correct for the symbol you're trying to access 