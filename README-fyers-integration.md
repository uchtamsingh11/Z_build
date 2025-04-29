# Fyers Integration

This document outlines the Fyers broker integration in our system, using the Fyers REST API v2.

## Integration Overview

The Fyers integration follows the same pattern as our other broker integrations:

1. Users provide their Fyers Client ID and Secret Key
2. The credentials are stored in the database
3. When the broker is activated, the system initiates OAuth authentication with Fyers's API
4. The tokens are stored and used for subsequent API calls

## Flow Details

### Step 1: Save Credentials
- In the "Available Brokers" section, users click on "Fyers"
- A modal appears where they can enter their Fyers Client ID and Secret Key
- When they click Save, the credentials are stored in the database with is_active set to false

### Step 2: Activate and Authenticate
- In the "Connected Brokers" section, users see their saved Fyers broker with a toggle switch (default OFF)
- When they toggle the switch ON:
  - The system initiates the OAuth flow, opening a popup window for Fyers authentication
  - The user logs in to their Fyers account and authorizes the application
  - If authentication succeeds, the popup window closes, tokens are stored, and the toggle remains ON
  - If authentication fails, the popup shows an error message, the window closes, and the toggle reverts to OFF

### Token Handling
- Unlike some other brokers, Fyers doesn't provide a refresh token in their standard OAuth flow
- Tokens typically expire in 24 hours
- When a token expires, the system detects the expired token when making an API call
- The user will need to re-authenticate by toggling the broker OFF and ON again

## API Endpoints

1. `/api/brokers/fyers/oauth`: Initiates the OAuth flow to authenticate with Fyers's API
2. `/api/brokers/fyers/callback`: Handles the OAuth callback from Fyers, exchanges code for tokens
3. `/api/brokers/fyers/verify`: Verifies the token by making a call to Fyers's profile API
4. `/api/brokers/fyers/deactivate`: Marks the broker as inactive in the database
5. `/api/brokers/fyers/place-order`: Places an order through Fyers
6. `/api/brokers/fyers/cancel-order`: Cancels an existing order
7. `/api/brokers/fyers/get-funds`: Fetches user's funds and margin details
8. `/api/brokers/fyers/get-positions`: Fetches user's current positions

## Database Schema

Fyers credentials are stored in the `broker_credentials` table:

```sql
{
  id: string,
  user_id: string,
  broker_name: "Fyers",
  credentials: {
    "client_id": "user-entered-client-id",
    "secret_key": "user-entered-secret-key",
    "Access Token": "token-from-authentication",
    "Token Type": "bearer",
    "Expires In": "token-expiry-time-in-seconds"
  },
  is_active: boolean,
  auth_state: string, // Used for OAuth state verification
  is_pending_auth: boolean, // Flag for pending authentication
  created_at: timestamp,
  updated_at: timestamp
}
```

## Authentication Flow

1. User provides Client ID and Secret Key
2. When activating, system generates a state parameter and redirects to Fyers OAuth
3. User authorizes the application in the popup window
4. Fyers redirects back to our callback URL with an authorization code
5. System exchanges code for access token
6. System stores the token in the credentials object and in the dedicated access_token column
7. When tokens expire (after 24 hours), the user will need to re-authenticate

## Fyers API Specifics

- Fyers requires specific transaction types: "1" for buy and "2" for sell (differ from our standard "BUY"/"SELL")
- Authentication using the app_id which should be formatted as `${clientId}-${appType}` where appType is usually "100" for API applications
- Authorization headers must use format: `Authorization: Bearer ${accessToken}`
- Product types are mapped as follows:
  - "INTRADAY" -> "INTRADAY"
  - "DELIVERY" or "CNC" -> "CNC" (Cash and Carry)
  - "MARGIN" -> "MARGIN"
  - "CO" -> "CO" (Cover Order)
  - "BO" -> "BO" (Bracket Order)
- Order types:
  - "MARKET" -> Type 2
  - "LIMIT" -> Type 1
  - "SL" -> Type 3 (Stop Loss Limit)
  - "SL-M" -> Type 4 (Stop Loss Market)

## Security Considerations

- Tokens are stored securely in the database
- No API secrets are exposed in the frontend
- State parameter is used to prevent CSRF attacks
- The authentication only happens when explicitly requested by the user (when toggling ON)
- API errors are properly handled and reported to the user

## Troubleshooting

If users encounter issues with the Fyers integration:

1. Check that they have entered a valid Client ID and Secret Key
2. Verify that their Fyers account is active and has API access enabled
3. Check if the token has expired (tokens last for 24 hours)
4. Try deactivating and reactivating the broker to get a fresh token
5. Check browser console logs for any JavaScript errors
6. Verify that the popup window is not being blocked by the browser
7. If "Missing code or state parameter" error appears, check these issues:
   - Verify the correct redirect URI is registered in Fyers Developer portal
   - Ensure the app_id parameter is correctly formatted as `${clientId}-${appType}`
   - Make sure state parameter is properly passed and tracked in the database
   - Check if there are mixed content or CORS issues in the browser console

## Environment Variables

The following environment variables should be set in the .env file:

```
FYERS_API_URL=https://api.fyers.in/api/v2
FYERS_REDIRECT_URI=https://www.algoz.tech/api/brokers/fyers/callback
FYERS_APP_TYPE=100
```

For production, the FYERS_REDIRECT_URI is already set to your production URL. Make sure this exact same URL is registered in the Fyers Developer Portal when creating your application.

## Testing

To test the Fyers integration, you can use the provided test script:

```
node test-fyers-integration.js
```

Make sure to set the environment variables with your Fyers API credentials before running the test:

```
export FYERS_CLIENT_ID=your-client-id
export FYERS_SECRET_KEY=your-secret-key
```

The test will generate an authentication URL that you can use to manually test the authentication flow. 