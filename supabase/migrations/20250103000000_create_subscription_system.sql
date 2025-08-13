-- Create subscription system tables
-- This migration sets up the user subscription and session tracking system

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled')),
    interview_time_remaining INTEGER NOT NULL DEFAULT 0, -- in minutes
    interview_time_total INTEGER NOT NULL DEFAULT 0, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, tier)
);

-- Create pro_user_sessions table
CREATE TABLE IF NOT EXISTS pro_user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    cost DECIMAL(10,2) NOT NULL, -- $0.12/minute
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create free_user_sessions table
CREATE TABLE IF NOT EXISTS free_user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    time_remaining INTEGER NOT NULL, -- remaining free time in minutes
    status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pro_user_sessions_user_id ON pro_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_user_sessions_status ON pro_user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_free_user_sessions_user_id ON free_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_free_user_sessions_status ON free_user_sessions(status);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for pro_user_sessions
CREATE POLICY "Users can view their own pro sessions" ON pro_user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pro sessions" ON pro_user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pro sessions" ON pro_user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for free_user_sessions
CREATE POLICY "Users can view their own free sessions" ON free_user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own free sessions" ON free_user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own free sessions" ON free_user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
