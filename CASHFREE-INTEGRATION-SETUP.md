# Cashfree Integration Setup Guide

This guide will help you set up the Cashfree payment gateway integration for in-app coin purchases.

## Prerequisites

1. A Cashfree account (register at [Cashfree Payments](https://www.cashfree.com/))
2. Supabase project with the existing coin system

## Setup Steps

### 1. Database Setup

Execute the SQL script in your Supabase SQL editor to create the coin_orders table:

1. Go to your Supabase dashboard
2. Select your project
3. Navigate to SQL Editor
4. Create a new query
5. Copy and paste the contents of `coin_orders_table.sql`
6. Run the query

### 2. Environment Variables

Add these to your `.env.local` file:

```
# Cashfree Payment Gateway Credentials
CASHFREE_APP_ID=your-cashfree-app-id
CASHFREE_SECRET_KEY=your-cashfree-secret-key
```

### 3. Cashfree Account Configuration

1. Log in to your Cashfree account
2. Navigate to Developer Options > API Keys
3. Copy your App ID and Secret Key
4. In the Webhook Settings section, add your webhook URL:
   - Test Environment: `https://your-domain.com/api/webhook`
   - Production Environment: `https://your-production-domain.com/api/webhook`

### 4. Going Live

When ready to switch to production:

1. Update the Cashfree environment in the API route from SANDBOX to PRODUCTION
2. Replace the Cashfree SDK URL in the pricing page:
   - Development: `https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js`
   - Production: `https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js`

## Testing

You can test the payment flow using Cashfree's sandbox environment with these test credentials:

- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3-digit number
- Name: Any name
- OTP: 123456

## Troubleshooting

If you encounter issues:

1. Check browser console for JavaScript errors
2. Verify Cashfree credentials in your environment variables
3. Ensure webhook URL is correctly configured in Cashfree dashboard
4. Check SQL migrations executed successfully in Supabase

## Security Considerations

- All sensitive credentials are stored as environment variables
- Webhook signatures are verified to ensure requests come from Cashfree
- Idempotency checks prevent duplicate transaction processing
- Row Level Security ensures users can only access their own data 