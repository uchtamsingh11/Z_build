-- Create the coin_orders table to track payment transactions
CREATE TABLE coin_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    coin_amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on order_id for better performance
CREATE INDEX idx_coin_orders_order_id ON coin_orders(order_id);

-- Create index on user_id for better performance
CREATE INDEX idx_coin_orders_user_id ON coin_orders(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE coin_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own orders
CREATE POLICY "Users can view their own orders" ON coin_orders
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert new orders (through API)
CREATE POLICY "Service role can insert orders" ON coin_orders
    FOR INSERT TO service_role USING (true);

-- Only service role can update orders (through webhook)
CREATE POLICY "Service role can update orders" ON coin_orders
    FOR UPDATE TO service_role USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coin_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on order update
CREATE TRIGGER update_coin_orders_updated_at
BEFORE UPDATE ON coin_orders
FOR EACH ROW
EXECUTE FUNCTION update_coin_orders_updated_at(); 