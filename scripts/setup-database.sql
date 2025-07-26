-- Database Setup Script for FoloUp Interview Platform
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for interview status
CREATE TYPE interview_status AS ENUM ('draft', 'active', 'completed', 'archived');

-- Create enum for practice session status
CREATE TYPE practice_session_status AS ENUM ('in-progress', 'completed', 'abandoned');

-- Create enum for question types
CREATE TYPE question_type AS ENUM ('behavioral', 'technical', 'system-design', 'coding', 'general');

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
CREATE POLICY "Users can view their own interviews" ON interviews
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own interviews" ON interviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own interviews" ON interviews
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own interviews" ON interviews
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for practice_sessions
CREATE POLICY "Users can view their own practice sessions" ON practice_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own practice sessions" ON practice_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own practice sessions" ON practice_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own practice sessions" ON practice_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for questions
CREATE POLICY "Users can view questions for their interviews" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert questions for their interviews" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update questions for their interviews" ON questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete questions for their interviews" ON questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

-- Create RLS policies for practice_responses
CREATE POLICY "Users can view their own practice responses" ON practice_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM practice_sessions 
            WHERE practice_sessions.id = practice_responses.practice_session_id 
            AND practice_sessions.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert their own practice responses" ON practice_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM practice_sessions 
            WHERE practice_sessions.id = practice_responses.practice_session_id 
            AND practice_sessions.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update their own practice responses" ON practice_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM practice_sessions 
            WHERE practice_sessions.id = practice_responses.practice_session_id 
            AND practice_sessions.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete their own practice responses" ON practice_responses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM practice_sessions 
            WHERE practice_sessions.id = practice_responses.practice_session_id 
            AND practice_sessions.user_id = auth.uid()::text
        )
    );

-- Insert some sample data for testing
INSERT INTO interviews (user_id, title, description, interview_type, question_count, is_practice, agent_name)
VALUES 
    ('test-user-123', 'Software Engineer Interview', 'Technical interview for software engineering position', 'technical', 5, true, 'Bob'),
    ('test-user-123', 'Product Manager Interview', 'Behavioral interview for product management role', 'behavioral', 4, true, 'Lisa')
ON CONFLICT DO NOTHING;

-- Insert sample questions
INSERT INTO questions (interview_id, question_text, question_type, difficulty, category, order_index)
SELECT 
    i.id,
    q.question_text,
    q.question_type::question_type,
    q.difficulty,
    q.category,
    q.order_index
FROM (
    VALUES 
        ('Tell me about a challenging technical problem you solved recently.', 'behavioral', 'medium', 'Problem Solving', 0),
        ('How would you design a scalable web application?', 'system-design', 'hard', 'System Design', 1),
        ('Describe a time when you had to make a difficult product decision.', 'behavioral', 'medium', 'Leadership', 2),
        ('What is your approach to handling conflicting requirements?', 'behavioral', 'medium', 'Communication', 3)
) AS q(question_text, question_type, difficulty, category, order_index)
CROSS JOIN interviews i
WHERE i.user_id = 'test-user-123'
ON CONFLICT DO NOTHING; 
