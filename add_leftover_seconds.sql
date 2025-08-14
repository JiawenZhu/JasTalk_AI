-- Add leftover_seconds field to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS leftover_seconds INTEGER DEFAULT 0;

-- Add comment to explain the field
COMMENT ON COLUMN user_subscriptions.leftover_seconds IS 'Accumulated seconds from partial interview time usage. When >= 60, converts to 1 minute and deducts from credits.';

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
AND column_name = 'leftover_seconds';
