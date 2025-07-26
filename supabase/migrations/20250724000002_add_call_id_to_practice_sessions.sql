-- Add call_id column to practice_sessions table
ALTER TABLE practice_sessions 
ADD COLUMN IF NOT EXISTS call_id TEXT;

-- Create index for call_id
CREATE INDEX IF NOT EXISTS idx_practice_sessions_call_id ON practice_sessions(call_id); 
