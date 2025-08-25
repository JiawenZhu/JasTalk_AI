-- Fix conversation_logs table schema to support interview sessions
-- This migration adds missing columns that the interview-sessions API expects

DO $$ 
BEGIN
    -- Add agent_voice column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'agent_voice'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN agent_voice TEXT;
        RAISE NOTICE 'Added agent_voice column to conversation_logs table';
    ELSE
        RAISE NOTICE 'agent_voice column already exists in conversation_logs table';
    END IF;

    -- Add questions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'questions'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN questions JSONB DEFAULT '[]';
        RAISE NOTICE 'Added questions column to conversation_logs table';
    ELSE
        RAISE NOTICE 'questions column already exists in conversation_logs table';
    END IF;

    -- Add current_question_index column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'current_question_index'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN current_question_index INTEGER DEFAULT 0;
        RAISE NOTICE 'Added current_question_index column to conversation_logs table';
    ELSE
        RAISE NOTICE 'current_question_index column already exists in conversation_logs table';
    END IF;

    -- Add questions_completed column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'questions_completed'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN questions_completed INTEGER DEFAULT 0;
        RAISE NOTICE 'Added questions_completed column to conversation_logs table';
    ELSE
        RAISE NOTICE 'questions_completed column already exists in conversation_logs table';
    END IF;

    -- Add conversation_history column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'conversation_history'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN conversation_history JSONB DEFAULT '[]';
        RAISE NOTICE 'Added conversation_history column to conversation_logs table';
    ELSE
        RAISE NOTICE 'conversation_history column already exists in conversation_logs table';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned'));
        RAISE NOTICE 'Added status column to conversation_logs table';
    ELSE
        RAISE NOTICE 'status column already exists in conversation_logs table';
    END IF;

    -- Add time_spent column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'time_spent'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN time_spent INTEGER DEFAULT 0;
        RAISE NOTICE 'Added time_spent column to conversation_logs table';
    ELSE
        RAISE NOTICE 'time_spent column already exists in conversation_logs table';
    END IF;

    -- Add current_turn column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'current_turn'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN current_turn TEXT DEFAULT 'waiting' CHECK (current_turn IN ('user', 'ai', 'waiting'));
        RAISE NOTICE 'Added current_turn column to conversation_logs table';
    ELSE
        RAISE NOTICE 'current_turn column already exists in conversation_logs table';
    END IF;

    -- Add last_activity_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'last_activity_at'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added last_activity_at column to conversation_logs table';
    ELSE
        RAISE NOTICE 'last_activity_at column already exists in conversation_logs table';
    END IF;

    -- Add completed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added completed_at column to conversation_logs table';
    ELSE
        RAISE NOTICE 'completed_at column already exists in conversation_logs table';
    END IF;

    -- Add estimated_duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'estimated_duration'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN estimated_duration INTEGER;
        RAISE NOTICE 'Added estimated_duration column to conversation_logs table';
    ELSE
        RAISE NOTICE 'estimated_duration column already exists in conversation_logs table';
    END IF;

    -- Add last_ai_response column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'last_ai_response'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN last_ai_response TEXT;
        RAISE NOTICE 'Added last_ai_response column to conversation_logs table';
    ELSE
        RAISE NOTICE 'last_ai_response column already exists in conversation_logs table';
    END IF;

    -- Add last_user_response column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_logs' 
        AND column_name = 'last_user_response'
    ) THEN
        ALTER TABLE conversation_logs ADD COLUMN last_user_response TEXT;
        RAISE NOTICE 'Added last_user_response column to conversation_logs table';
    ELSE
        RAISE NOTICE 'last_user_response column already exists in conversation_logs table';
    END IF;

END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_logs_status ON conversation_logs(status);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_last_activity ON conversation_logs(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_status ON conversation_logs(candidate_name, status);

-- Update existing records to have default values
UPDATE conversation_logs SET status = 'active' WHERE status IS NULL;
UPDATE conversation_logs SET current_turn = 'waiting' WHERE current_turn IS NULL;
UPDATE conversation_logs SET last_activity_at = COALESCE(updated_at, created_at, NOW()) WHERE last_activity_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN conversation_logs.agent_voice IS 'Voice configuration for the AI agent';
COMMENT ON COLUMN conversation_logs.questions IS 'Array of interview questions for this session';
COMMENT ON COLUMN conversation_logs.current_question_index IS 'Index of the current question being asked';
COMMENT ON COLUMN conversation_logs.questions_completed IS 'Number of questions completed in this session';
COMMENT ON COLUMN conversation_logs.conversation_history IS 'Array of conversation entries between user and AI';
COMMENT ON COLUMN conversation_logs.status IS 'Current status of the interview session';
COMMENT ON COLUMN conversation_logs.time_spent IS 'Time spent in the interview session in seconds';
COMMENT ON COLUMN conversation_logs.current_turn IS 'Whose turn it is to speak next';
COMMENT ON COLUMN conversation_logs.last_activity_at IS 'Timestamp of last activity in the session';
COMMENT ON COLUMN conversation_logs.completed_at IS 'Timestamp when the session was completed';
COMMENT ON COLUMN conversation_logs.estimated_duration IS 'Estimated duration of the session in minutes';
COMMENT ON COLUMN conversation_logs.last_ai_response IS 'Last response from the AI interviewer';
COMMENT ON COLUMN conversation_logs.last_user_response IS 'Last response from the user';
