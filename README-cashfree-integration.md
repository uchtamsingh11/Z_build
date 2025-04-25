# Cashfree Payment Gateway Integration

This documentation outlines the integration of Cashfree Payment Gateway into your Next.js application to enable the coin purchase system.

## Prerequisites

1. A Cashfree merchant account (sign up at [https://merchant.cashfree.com/cashfree/login](https://merchant.cashfree.com/cashfree/login))
2. API keys (App ID and Secret Key) from your Cashfree dashboard
3. Webhook secret from your Cashfree dashboard

## Configuration

Add the following environment variables to your `.env.local` file:

```env
# Cashfree Payment Gateway
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## API Endpoints

The integration includes the following API endpoints:

1. **Create Order**: `/api/payment/create-order`
   - Creates an order in your database and with Cashfree
   - Redirects the user to the Cashfree payment page

2. **Webhook Handler**: `/api/payment/webhook`
   - Processes payment status updates from Cashfree
   - Updates the order status in your database
   - Adds coins to the user's balance on successful payment

3. **Verify Payment**: `/api/payment/verify`
   - Verifies the payment status with Cashfree
   - Used by the payment status page to display the correct status

## Database Tables

The integration relies on the following database tables:

1. **`coin_orders`**: Stores order information
   - See `coin_orders_table.sql` for schema details
   - Contains order ID, user ID, amount, status, etc.

2. **`coin_transactions`**: Records coin transactions
   - See `coin_system_setup.sql` for schema details
   - Automatically updates user balance through triggers

## User Flow

1. User selects a coin package on the pricing page and clicks "Buy Now"
2. The application creates an order and redirects to Cashfree's payment page
3. User completes the payment on Cashfree's platform
4. User is redirected back to your application's payment status page
5. The application verifies the payment status and updates the UI accordingly
6. On successful payment, coins are added to the user's balance

## Webhook Configuration

To set up the webhook in your Cashfree dashboard:

1. Log in to your Cashfree merchant account
2. Navigate to Settings > Webhooks
3. Add a new webhook with URL: `https://your-domain.com/api/payment/webhook`
4. Select events: Success Payment, Failed Payment, User Dropped Payment, Refund
5. Save the webhook and note the secret key

## Testing

Cashfree provides a sandbox environment for testing. Use the following test cards:

- **Success Payment**: 4111 1111 1111 1111
- **Failed Payment**: 4111 1111 1111 1111 (with any wrong details)

## Common Issues and Solutions

1. **Order creation fails**:
   - Verify your Cashfree API credentials
   - Check if the customer details are properly formed

2. **Webhook not receiving events**:
   - Ensure your webhook URL is publicly accessible
   - Verify that the webhook is properly configured in the Cashfree dashboard

3. **Payment verification issues**:
   - Check Cashfree API permissions
   - Verify signature validation implementation

## Production Considerations

1. Always verify payments server-side before updating user balances
2. Use HTTPS for all API endpoints
3. Implement proper error handling and logging
4. Set up monitoring for failed payments and webhook deliveries
5. Regularly check for payment reconciliation 