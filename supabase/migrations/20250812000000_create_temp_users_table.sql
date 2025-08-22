-- Create temp_users table for tracking temporary users
CREATE TABLE IF NOT EXISTS temp_users (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    purpose TEXT DEFAULT 'temporary_access',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted')),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_temp_users_user_id ON temp_users(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_users_expires_at ON temp_users(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_users_status ON temp_users(status);
CREATE INDEX IF NOT EXISTS idx_temp_users_created_at ON temp_users(created_at);

-- Enable Row Level Security
ALTER TABLE temp_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for temp_users
DROP POLICY IF EXISTS "Users can view their own temp user records" ON temp_users;
CREATE POLICY "Users can view their own temp user records" ON temp_users
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own temp user records" ON temp_users;
CREATE POLICY "Users can update their own temp user records" ON temp_users
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own temp user records" ON temp_users;
CREATE POLICY "Users can delete their own temp user records" ON temp_users
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically clean up expired temp users
CREATE OR REPLACE FUNCTION cleanup_expired_temp_users()
RETURNS void AS $$
BEGIN
    -- Mark expired users as expired
    UPDATE temp_users 
    SET status = 'expired' 
    WHERE expires_at < NOW() AND status = 'active';
    
    -- Log cleanup for monitoring
    RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to get expired temp users for deletion
CREATE OR REPLACE FUNCTION get_expired_temp_users()
RETURNS TABLE(user_id UUID, username TEXT, email TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT tu.user_id, tu.username, tu.email
    FROM temp_users tu
    WHERE tu.expires_at < NOW() AND tu.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create a function to mark temp user as deleted
CREATE OR REPLACE FUNCTION mark_temp_user_deleted(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE temp_users 
    SET status = 'deleted', deleted_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (optional)
-- INSERT INTO temp_users (user_id, username, email, purpose, expires_at) VALUES
-- ('sample-user-id', 'test_temp_user', 'test@temp.jastalk.ai', 'testing', NOW() + INTERVAL '1 hour');

-- INSERT INTO temp_users (user_id, username, email, purpose, expires_at) VALUES
-- ('sample-user-id', 'test_temp_user', 'test@temp.jastalk.ai', 'testing', NOW() + INTERVAL '1 hour');

-- INSERT INTO temp_users (user_id, username, email, purpose, expires_at) VALUES
-- ('sample-user-id', 'test_temp_user', 'test@temp.jastalk.ai', 'testing', NOW() + INTERVAL '1 hour');

-- INSERT INTO temp_users (user_id, username, email, purpose, expires_at) VALUES
-- ('sample-user-id', 'test_temp_user', 'test@temp.jastalk.ai', 'testing', NOW() + INTERVAL '1 hour');

-- INSERT INTO temp_users (user_id, username, email, purpose, expires_at) VALUES
-- ('sample-user-id', 'test_temp_user', 'test@temp.jastalk.ai', 'testing', NOW() + INTERVAL '1 hour');

-- INSERT INTO temp_users (user_id, username, email, purpose, expires_at) VALUES
-- ('sample-user-id', 'test_temp_user', 'test@temp.jastalk.ai', 'testing', NOW() + INTERVAL '1 hour');

-- INSERT INTO temp_users (user_id, username, email, purpose, expires_at) VALUES
-- ('sample-user-id', 'test_temp_user', 'test@temp.jastalk.ai', 'testing', NOW() + INTERVAL '1 hour');

-- INSERT INTO temp_users (user_id, username, email, purpose, expires_at) VALUES
-- ('sample-user-id', 'test_temp_user', 'test@temp.jastalk.ai', 'testing', NOW() + INTERVAL '1 hour');
