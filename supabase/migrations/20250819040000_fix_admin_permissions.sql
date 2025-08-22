-- Fix admin permissions for webhook operations
-- Migration: 20250819040000_fix_admin_permissions

-- Add policy to allow service role to bypass RLS for admin operations
DO $$
BEGIN
    -- Drop existing restrictive policies
    DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
    DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
    
    -- Create new policies that allow both user and admin access
    CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
        FOR INSERT WITH CHECK (
            auth.uid() = user_id OR 
            auth.role() = 'service_role'
        );
    
    CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
        FOR UPDATE USING (
            auth.uid() = user_id OR 
            auth.role() = 'service_role'
        );
    
    -- Also add a policy for admin operations
    CREATE POLICY "Service role can manage all subscriptions" ON user_subscriptions
        FOR ALL USING (auth.role() = 'service_role');
        
END $$;

-- Grant additional permissions to service role
GRANT ALL ON user_subscriptions TO service_role;
GRANT ALL ON interview_sessions TO service_role;
GRANT ALL ON interviews TO service_role;
GRANT ALL ON utterances TO service_role;

