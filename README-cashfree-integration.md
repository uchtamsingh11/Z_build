# Cashfree Payment Gateway Integration

This document provides instructions for setting up and using the Cashfree payment gateway integration in our Next.js application with Supabase backend.

## Overview

The integration allows users to purchase coins within the application using the Cashfree payment gateway. The implementation includes:

- API routes for creating payment orders and handling webhooks
- Frontend components for initiating payments
- Database tables for tracking orders and transactions
- Webhook handling for payment status updates

## Prerequisites

1. A Cashfree account (register at [Cashfree Payments](https://www.cashfree.com/))
2. Supabase project with the existing coin system setup

## Setup Instructions

### 1. Database Setup

Run the `coin_orders_table.sql` script in your Supabase SQL editor to create the necessary database tables and policies.

### 2. Environment Variables

Add the following variables to your `.env.local` file:

```
# Cashfree Payment Gateway Credentials
CASHFREE_APP_ID=your-cashfree-app-id
CASHFREE_SECRET_KEY=your-cashfree-secret-key
```

### 3. Cashfree Account Configuration

1. Log in to your Cashfree account.
2. Navigate to Developer Options > API Keys.
3. Copy your App ID and Secret Key.
4. In the Webhook Settings section, add your webhook URL:
   - Test Environment: `https://your-domain.com/api/webhook`
   - Production Environment: `https://your-production-domain.com/api/webhook`

### 4. Deploy the Application

Ensure all the components are correctly deployed:

- API Routes (`/api/create-order` and `/api/webhook`)
- Frontend Components (`BuyCoins.tsx`)
- Payment Status Page (`/payment-status`)

## Usage

1. Navigate to the coins page in the dashboard (`/dashboard/coins`).
2. Choose a coin package and click "Buy Now".
3. Complete the payment process on the Cashfree checkout page.
4. Upon successful payment, you'll be redirected back to the application.

## Testing

### Test Mode

During development, the integration is set to use Cashfree's sandbox environment. You can use the following test credentials:

- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3-digit number
- Name: Any name
- OTP: 123456

### Verifying Integration

1. Make a test purchase.
2. Check the Supabase database to verify:
   - An entry was created in the `coin_orders` table
   - The transaction was recorded in the `coin_transactions` table
   - The user's coin balance was updated

## Troubleshooting

### Common Issues

1. **Payment fails to initiate**: Check that your Cashfree credentials are correct in the `.env.local` file.
2. **Webhook not working**: Verify the webhook URL is correctly configured in your Cashfree dashboard.
3. **Order created but coins not added**: Check the server logs for webhook processing issues.

### Logs

For debugging, check:
- Next.js server logs for API-related issues
- Cashfree dashboard for payment status
- Supabase logs for database operation issues

## Going to Production

When ready to go live:

1. Update the Cashfree environment in your code from SANDBOX to PRODUCTION.
2. Replace the Cashfree SDK URL in `BuyCoins.tsx`:
   - Development: `https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js`
   - Production: `https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js`
3. Update your webhook URL in the Cashfree dashboard to your production domain.
4. Test thoroughly in the production environment with a real payment.

## Security Considerations

- All sensitive credentials are stored as environment variables
- Webhook signatures are verified to ensure requests come from Cashfree
- Idempotency checks prevent duplicate transaction processing
- Row Level Security ensures users can only access their own data 