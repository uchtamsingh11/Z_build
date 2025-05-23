# Fyers Integration

This document outlines the Fyers broker integration in our system, using the Fyers API v3.

## Integration Overview

The Fyers integration follows the same pattern as our other broker integrations:

1. Users provide their Fyers App ID and Secret Key
2. The credentials are stored in the database
3. When the broker is activated, the system initiates OAuth authentication with Fyers' API
4. The tokens are stored and used for subsequent API calls

## Flow Details

### Step 1: Save Credentials
- In the "Available Brokers" section, users click on "Fyers"
- A modal appears where they can enter their Fyers App ID and Secret Key
- When they click Save, the credentials are stored in the database with is_active set to false

### Step 2: Activate and Authenticate
- In the "Connected Brokers" section, users see their saved Fyers broker with a toggle switch (default OFF)
- When they toggle the switch ON:
  - The system initiates the OAuth flow, opening a popup window for Fyers authentication
  - The user logs in to their Fyers account and authorizes the application
  - If authentication succeeds, the popup window closes, tokens are stored, and the toggle remains ON
  - If authentication fails, the popup shows an error message, the window closes, and the toggle reverts to OFF

### Token Refresh
- When tokens expire, the system automatically attempts to refresh them using the refresh token
- If token refresh succeeds, the new tokens are stored and the operation continues
- If token refresh fails, the user is prompted to re-authenticate

## API Endpoints

1. `/api/brokers/fyers/oauth`: Initiates the OAuth flow to authenticate with Fyers' API
2. `/api/brokers/fyers/callback`: Handles the OAuth callback from Fyers, exchanges code for tokens
3. `/api/brokers/fyers/verify`: Verifies the token by making a call to Fyers' profile API and handles token refresh
4. `/api/brokers/fyers/deactivate`: Marks the broker as inactive in the database

## Database Schema

Fyers credentials are stored in the `broker_credentials` table:

```sql
CREATE TABLE broker_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_name TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  access_token TEXT,
  token_expiry TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  auth_state TEXT,
  is_pending_auth BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

## API Client

The integration includes a JavaScript/TypeScript API client (`fyers_api_client.js`) that provides a clean interface for interacting with the Fyers API. The client handles:

- Authentication and token management
- Order placement, modification, and cancellation
- Portfolio and positions retrieval
- Market data access

## Implementation Notes

### Authentication
- The Fyers API uses OAuth 2.0 for authentication
- After authorization, we receive an authorization code which is exchanged for access and refresh tokens
- Tokens are stored both in the JSONB credentials field and in a dedicated access_token column for easy access

### Error Handling
- Token expiration is handled automatically by attempting to refresh the token
- If refresh fails, the broker is marked as inactive and the user is prompted to re-authenticate
- All API errors are caught and meaningful error messages are returned to the UI

### Security Considerations
- The API Key and Secret Key are stored securely in the database
- The access token has an expiration time and is refreshed automatically
- A random state parameter is used during OAuth to prevent CSRF attacks

## Fyers API Documentation Reference
For the latest Fyers API documentation, visit: https://myapi.fyers.in/docsv3 