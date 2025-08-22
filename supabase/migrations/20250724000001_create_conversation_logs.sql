-- Create conversation_logs table
CREATE TABLE IF NOT EXISTS conversation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id TEXT NOT NULL UNIQUE,
  agent_id TEXT,
  agent_name TEXT,
  candidate_name TEXT,
  duration_seconds INTEGER,
  transcript JSONB,
  post_call_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_logs_call_id ON conversation_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_candidate_name ON conversation_logs(candidate_name);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_created_at ON conversation_logs(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_logs_updated_at 
    BEFORE UPDATE ON conversation_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own conversation logs" ON conversation_logs;
CREATE POLICY "Users can view their own conversation logs" ON conversation_logs
  FOR SELECT USING (candidate_name = current_user);

DROP POLICY IF EXISTS "Users can insert their own conversation logs" ON conversation_logs;
CREATE POLICY "Users can insert their own conversation logs" ON conversation_logs
  FOR INSERT WITH CHECK (candidate_name = current_user);

DROP POLICY IF EXISTS "Users can update their own conversation logs" ON conversation_logs;
CREATE POLICY "Users can update their own conversation logs" ON conversation_logs
  FOR UPDATE USING (candidate_name = current_user);

-- Add call_id column to practice_sessions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'practice_sessions' AND column_name = 'call_id'
  ) THEN
    ALTER TABLE practice_sessions ADD COLUMN call_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_practice_sessions_call_id ON practice_sessions(call_id);
  END IF;
END $$; 
