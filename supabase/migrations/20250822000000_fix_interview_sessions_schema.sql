-- Fix missing last_activity_at column in interview_sessions table
-- This migration adds the missing column that's causing 500 errors

-- Add the missing column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interview_sessions' 
        AND column_name = 'last_activity_at'
    ) THEN
        ALTER TABLE interview_sessions ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added last_activity_at column to interview_sessions table';
    ELSE
        RAISE NOTICE 'last_activity_at column already exists in interview_sessions table';
    END IF;
END $$;

-- Update existing records to have a last_activity_at value
UPDATE interview_sessions 
SET last_activity_at = COALESCE(updated_at, created_at, NOW())
WHERE last_activity_at IS NULL;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_interview_sessions_last_activity 
ON interview_sessions(last_activity_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN interview_sessions.last_activity_at IS 'Timestamp of last activity in the session';
