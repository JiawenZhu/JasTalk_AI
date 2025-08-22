-- Create interview tables for storing user interviews and practice sessions
-- Migration: 20250724000000_create_interview_tables.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for interview status
DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('draft', 'active', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for practice session status
DO $$ BEGIN
    CREATE TYPE practice_session_status AS ENUM ('in-progress', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for question types
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('behavioral', 'technical', 'system-design', 'coding', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status interview_status DEFAULT 'draft',
    interview_type TEXT DEFAULT 'general',
    duration_minutes INTEGER DEFAULT 30,
    question_count INTEGER DEFAULT 0,
    is_practice BOOLEAN DEFAULT false,
    agent_id TEXT, -- Retell agent ID for voice interviews
    agent_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id TEXT NOT NULL,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    status practice_session_status DEFAULT 'in-progress',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    score INTEGER, -- 0-100
    total_questions INTEGER DEFAULT 0,
    completed_questions INTEGER DEFAULT 0,
    agent_id TEXT, -- Retell agent ID used
    agent_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type DEFAULT 'general',
    difficulty TEXT DEFAULT 'medium',
    category TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create practice_responses table
CREATE TABLE IF NOT EXISTS practice_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    practice_session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    user_response TEXT,
    ai_feedback TEXT,
    score INTEGER, -- 0-100 for individual question
    response_duration_seconds INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_interview_id ON practice_sessions(interview_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON practice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_questions_interview_id ON questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON questions(order_index);
CREATE INDEX IF NOT EXISTS idx_practice_responses_session_id ON practice_responses(practice_session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_sessions_updated_at BEFORE UPDATE ON practice_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interviews
DROP POLICY IF EXISTS "Users can view their own interviews" ON interviews;
CREATE POLICY "Users can view their own interviews" ON interviews
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own interviews" ON interviews;
CREATE POLICY "Users can insert their own interviews" ON interviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own interviews" ON interviews;
CREATE POLICY "Users can update their own interviews" ON interviews
    FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own interviews" ON interviews;
CREATE POLICY "Users can delete their own interviews" ON interviews
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for practice_sessions
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

-- Create RLS policies for questions
DROP POLICY IF EXISTS "Users can view questions for their interviews" ON questions;
CREATE POLICY "Users can view questions for their interviews" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can insert questions for their interviews" ON questions;
CREATE POLICY "Users can insert questions for their interviews" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can update questions for their interviews" ON questions;
CREATE POLICY "Users can update questions for their interviews" ON questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can delete questions for their interviews" ON questions;
CREATE POLICY "Users can delete questions for their interviews" ON questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

-- Create RLS policies for practice_responses
DROP POLICY IF EXISTS "Users can view their own practice responses" ON practice_responses;
CREATE POLICY "Users can view their own practice responses" ON practice_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM practice_sessions 
            WHERE practice_sessions.id = practice_responses.practice_session_id 
            AND practice_sessions.user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can insert their own practice responses" ON practice_responses;
CREATE POLICY "Users can insert their own practice responses" ON practice_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM practice_sessions 
            WHERE practice_sessions.id = practice_responses.practice_session_id 
            AND practice_sessions.user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can update their own practice responses" ON practice_responses;
CREATE POLICY "Users can update their own practice responses" ON practice_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM practice_sessions 
            WHERE practice_sessions.id = practice_responses.practice_session_id 
            AND practice_sessions.user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can delete their own practice responses" ON practice_responses;
CREATE POLICY "Users can delete their own practice responses" ON practice_responses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM practice_sessions 
            WHERE practice_sessions.id = practice_responses.practice_session_id 
            AND practice_sessions.user_id = auth.uid()::text
        )
    ); 
