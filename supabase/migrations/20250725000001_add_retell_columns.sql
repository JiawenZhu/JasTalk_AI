-- Add Retell-specific columns to practice_sessions table
ALTER TABLE public.practice_sessions 
ADD COLUMN IF NOT EXISTS retell_agent_id TEXT,
ADD COLUMN IF NOT EXISTS retell_call_id TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_retell_call_id 
ON public.practice_sessions(retell_call_id);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_retell_agent_id 
ON public.practice_sessions(retell_agent_id); 
