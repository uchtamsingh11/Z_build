# Upstox Integration

This document outlines the Upstox broker integration in our system, using the Upstox REST API v2.

## Integration Overview

The Upstox integration follows the same pattern as our other broker integrations:

1. Users provide their Upstox API Key and Secret Key
2. The credentials are stored in the database
3. When the broker is activated, the system initiates OAuth authentication with Upstox's API
4. The tokens are stored and used for subsequent API calls

## Flow Details

### Step 1: Save Credentials
- In the "Available Brokers" section, users click on "Upstox"
- A modal appears where they can enter their Upstox API Key and Secret Key
- When they click Save, the credentials are stored in the database with is_active set to false

### Step 2: Activate and Authenticate
- In the "Connected Brokers" section, users see their saved Upstox broker with a toggle switch (default OFF)
- When they toggle the switch ON:
  - The system initiates the OAuth flow, opening a popup window for Upstox authentication
  - The user logs in to their Upstox account and authorizes the application
  - If authentication succeeds, the popup window closes, tokens are stored, and the toggle remains ON
  - If authentication fails, the popup shows an error message, the window closes, and the toggle reverts to OFF

### Token Refresh
- When tokens expire, the system automatically attempts to refresh them using the refresh token
- If token refresh succeeds, the new tokens are stored and the operation continues
- If token refresh fails, the user is prompted to re-authenticate

## API Endpoints

1. `/api/brokers/upstox/oauth`: Initiates the OAuth flow to authenticate with Upstox's API
2. `/api/brokers/upstox/callback`: Handles the OAuth callback from Upstox, exchanges code for tokens
3. `/api/brokers/upstox/verify`: Verifies the token by making a call to Upstox's profile API and handles token refresh
4. `/api/brokers/upstox/deactivate`: Marks the broker as inactive in the database
5. `/api/brokers/upstox/place-order`: Places an order through Upstox
6. `/api/brokers/upstox/cancel-order`: Cancels an existing order
7. `/api/brokers/upstox/get-funds`: Fetches user's funds and margin details
8. `/api/brokers/upstox/get-positions`: Fetches user's current positions

## Database Schema

Upstox credentials are stored in the `broker_credentials` table:

```sql
{
  id: string,
  user_id: string,
  broker_name: "Upstox",
  credentials: {
    "API Key": "user-entered-api-key",
    "Secret Key": "user-entered-secret-key",
    "Access Token": "token-from-authentication",
    "Refresh Token": "refresh-token-from-authentication",
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

1. User provides API Key and Secret Key
2. When activating, system generates a state parameter and redirects to Upstox OAuth
3. User authorizes the application in the popup window
4. Upstox redirects back to our callback URL with an authorization code
5. System exchanges code for access and refresh tokens
6. System stores these tokens in the credentials object
7. When tokens expire, the system uses the refresh token to get new tokens

## Security Considerations

- Tokens are stored securely in the database
- No API secrets are exposed in the frontend
- State parameter is used to prevent CSRF attacks
- The authentication only happens when explicitly requested by the user (when toggling ON)
- Token refresh is handled automatically
- API errors are properly handled and reported to the user

## Troubleshooting

If users encounter issues with the Upstox integration:

1. Check that they have entered a valid API Key and Secret Key
2. Verify that their Upstox account is active and has API access enabled
3. Check if the tokens have expired and failed to refresh
4. Try deactivating and reactivating the broker to get fresh tokens
5. Check browser console logs for any JavaScript errors
6. Verify that the popup window is not being blocked by the browser

## Environment Variables

The following environment variables should be set in the .env file:

```
UPSTOX_API_URL=https://api.upstox.com/v2
UPSTOX_LOGIN_URL=https://api.upstox.com/v2/login/authorization/dialog
UPSTOX_REDIRECT_URI=https://www.algoz.tech/api/brokers/upstox/callback
```

For production, the UPSTOX_REDIRECT_URI is already set to your production URL. Make sure this exact same URL is registered in the Upstox Developer Portal. 