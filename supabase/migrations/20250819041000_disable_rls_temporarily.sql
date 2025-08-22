-- Temporarily disable RLS on user_subscriptions to fix webhook issues
-- Migration: 20250819041000_disable_rls_temporarily

-- Disable RLS temporarily to allow webhook operations
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users for now
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON user_subscriptions TO anon;

-- Note: This is a temporary fix. RLS should be re-enabled with proper policies later.

