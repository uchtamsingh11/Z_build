-- Function to atomically add coins to a user's balance
CREATE OR REPLACE FUNCTION add_coins_to_balance(
  user_id_param UUID,
  coins_amount INTEGER,
  order_id_param VARCHAR,
  description_param TEXT DEFAULT 'Coins added'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_exists INTEGER;
BEGIN
  -- Check if a transaction already exists for this order to prevent duplicates
  SELECT COUNT(*) INTO transaction_exists FROM coin_transactions 
  WHERE order_id = order_id_param AND user_id = user_id_param;
  
  -- If transaction already exists, do nothing
  IF transaction_exists > 0 THEN
    RETURN false;
  END IF;

  -- Begin transaction
  BEGIN
    -- Add coins to user's balance
    UPDATE profiles 
    SET 
      coin_balance = COALESCE(coin_balance, 0) + coins_amount,
      updated_at = NOW()
    WHERE id = user_id_param;
    
    -- Record the transaction
    INSERT INTO coin_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      order_id,
      created_at
    ) VALUES (
      user_id_param,
      coins_amount,
      'recharge',
      description_param,
      order_id_param,
      NOW()
    );
    
    RETURN true;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END;
END;
$$; 