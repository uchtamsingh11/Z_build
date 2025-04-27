# AngelOne Integration

This document outlines the AngelOne broker integration in our system, using the AngelOne REST API.

## Integration Overview

The AngelOne integration follows the same pattern as our other broker integrations:

1. Users provide their AngelOne Client ID and API Key
2. The credentials are stored in the database
3. When the broker is activated, the system authenticates with AngelOne's API to get tokens
4. The tokens are stored and used for subsequent API calls

## Flow Details

### Step 1: Save Credentials
- In the "Available Brokers" section, users click on "Angel One"
- A modal appears where they can enter their Angel One Client ID and API Key
- When they click Save, the credentials are stored in the database with is_active set to false

### Step 2: Activate and Authenticate
- In the "Connected Brokers" section, users see their saved Angel One broker with a toggle switch (default OFF)
- When they toggle the switch ON:
  - The system calls the authenticate endpoint to get tokens from AngelOne
  - If authentication succeeds, the tokens are stored and the toggle remains ON
  - If authentication fails, the toggle reverts to OFF with an error message

### Token Refresh
- When tokens expire, the system automatically attempts to refresh them using the refresh token
- If token refresh succeeds, the new tokens are stored and the operation continues
- If token refresh fails, the user is prompted to re-authenticate

## API Endpoints

1. `/api/brokers/angelone/authenticate`: Authenticates with AngelOne's API and gets tokens
2. `/api/brokers/angelone/verify`: Verifies the token by making a call to AngelOne's profile API and handles token refresh
3. `/api/brokers/angelone/deactivate`: Marks the broker as inactive in the database
4. `/api/brokers/angelone/place-order`: Places an order through AngelOne
5. `/api/brokers/angelone/cancel-order`: Cancels an existing order
6. `/api/brokers/angelone/get-funds`: Fetches user's funds and margin details
7. `/api/brokers/angelone/get-positions`: Fetches user's current positions

## Database Schema

AngelOne credentials are stored in the `broker_credentials` table:

```sql
{
  id: string,
  user_id: string,
  broker_name: "Angel One",
  credentials: {
    "Client ID": "user-entered-client-id",
    "API Key": "user-entered-api-key",
    "Access Token": "token-from-authentication",
    "Refresh Token": "refresh-token-from-authentication",
    "Feed Token": "feed-token-from-authentication"
  },
  is_active: boolean,
  created_at: timestamp
}
```

## Authentication Flow

1. User provides Client ID and API Key
2. System calls AngelOne's login API with these credentials
3. AngelOne returns JWT token, feed token, and refresh token
4. System stores these tokens in the credentials object
5. When tokens expire, the system uses the refresh token to get new tokens

## Security Considerations

- Tokens are stored securely in the database
- No API secrets are exposed in the frontend
- The authentication only happens when explicitly requested by the user (when toggling ON)
- Token refresh is handled automatically
- API errors are properly handled and reported to the user

## Troubleshooting

If users encounter issues with the AngelOne integration:

1. Check that they have entered a valid Client ID and API Key
2. Verify that their AngelOne account is active and has API access enabled
3. Check if the tokens have expired and failed to refresh
4. Try deactivating and reactivating the broker to get fresh tokens 