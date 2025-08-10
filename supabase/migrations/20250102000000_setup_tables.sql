-- Setup all tables for the interview system
-- Migration: 20250102000000_setup_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('draft', 'active', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE practice_session_status AS ENUM ('in-progress', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('behavioral', 'technical', 'system-design', 'coding', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id TEXT NOT NULL,
    interview_id UUID,
    session_name TEXT NOT NULL,
    status practice_session_status DEFAULT 'in-progress',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    score INTEGER,
    total_questions INTEGER DEFAULT 0,
    completed_questions INTEGER DEFAULT 0,
    agent_id TEXT,
    agent_name TEXT,
    call_id TEXT,
    retell_agent_id TEXT,
    retell_call_id TEXT,
    questions JSONB,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create conversation_logs table
CREATE TABLE IF NOT EXISTS conversation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    call_id TEXT NOT NULL UNIQUE,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    summary TEXT,
    detailed_summary TEXT,
    transcript JSONB NOT NULL,
    post_call_analysis JSONB,
    duration_seconds INTEGER DEFAULT 0,
    call_cost JSONB,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON practice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_retell_call_id ON practice_sessions(retell_call_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_call_id ON conversation_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_candidate_name ON conversation_logs(candidate_name);

-- Enable RLS
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own practice sessions" ON practice_sessions;
CREATE POLICY "Users can view their own practice sessions" ON practice_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own practice sessions" ON practice_sessions;
CREATE POLICY "Users can insert their own practice sessions" ON practice_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own practice sessions" ON practice_sessions;
CREATE POLICY "Users can update their own practice sessions" ON practice_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own practice sessions" ON practice_sessions;
CREATE POLICY "Users can delete their own practice sessions" ON practice_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view their own conversation logs" ON conversation_logs;
CREATE POLICY "Users can view their own conversation logs" ON conversation_logs
    FOR SELECT USING (auth.uid()::text = candidate_name);

DROP POLICY IF EXISTS "Users can insert their own conversation logs" ON conversation_logs;
CREATE POLICY "Users can insert their own conversation logs" ON conversation_logs
    FOR INSERT WITH CHECK (auth.uid()::text = candidate_name);

-- Insert sample data
INSERT INTO practice_sessions (id, user_id, session_name, status, score, total_questions, completed_questions, agent_name, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'ecfbef16-09f3-4426-986b-121813ff7779', 'Software Engineer - Google', 'completed', 85, 10, 10, 'Lisa', '2024-01-14T10:00:00Z'),
('550e8400-e29b-41d4-a716-446655440002', 'ecfbef16-09f3-4426-986b-121813ff7779', 'Product Manager - Meta', 'completed', 92, 8, 8, 'Bob', '2024-01-13T14:30:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation_logs (call_id, agent_id, agent_name, candidate_name, transcript, duration_seconds) VALUES
('call_d22f2f4813f15985d6d4d557ac4', 'agent_9e08fe6af4631b5ee94f7f036f', 'Lisa', 'jiawenzhu408@gmail.com', '[]', 300)
ON CONFLICT (call_id) DO NOTHING; 
