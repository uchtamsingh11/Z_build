# Upstox Integration - Manual Token Authentication

This document outlines how the Upstox broker integration works in our system, using a custom authentication flow without OAuth.

## Integration Overview

Unlike other broker integrations that might use OAuth, the Upstox integration uses a manual token entry approach:

1. Users manually enter their Upstox access token
2. The token is stored but not immediately verified
3. When activating the broker (toggle ON), the system verifies the token by calling Upstox's profile API

## Flow Details

### Step 1: Save Access Token
- In the "Available Brokers" section, users click on "Upstox"
- A modal appears where they can enter their Upstox access token
- When they click Save, the token is stored in the database without verification

### Step 2: Activate and Verify
- In the "Connected Brokers" section, users can see their saved Upstox broker with a toggle switch (default OFF)
- When they toggle the switch ON:
  - The system sends a request to verify the token by calling Upstox's profile API
  - If verification succeeds, the toggle remains ON
  - If verification fails, the toggle reverts to OFF with an error message

### Deactivation
- When users toggle the switch OFF, the broker is simply deactivated in the database
- No API calls are made to Upstox during deactivation

## API Endpoints

1. `/api/brokers/upstox/verify`: Verifies the token by making a call to Upstox's profile API
2. `/api/brokers/upstox/deactivate`: Marks the broker as inactive in the database

## Database Schema

Upstox credentials are stored in the `broker_credentials` table:

```sql
{
  id: string,
  user_id: string,
  broker_name: "Upstox",
  credentials: {
    "Access Token": "user-entered-token"
  },
  is_active: boolean,
  created_at: timestamp
}
```

## Security Considerations

- Tokens are stored securely in the database
- No OAuth client secrets are exposed in the frontend
- The verification only happens when explicitly requested by the user (when toggling ON)

## Troubleshooting

If users encounter issues with the Upstox integration:

1. Check that they have entered a valid access token
2. Verify that the token has not expired
3. Ask them to try generating a new token and updating it in the system 