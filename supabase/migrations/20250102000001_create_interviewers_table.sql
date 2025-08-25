-- Create interviewers table
CREATE TABLE IF NOT EXISTS public.interviewers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    avatar_url TEXT,
    retell_agent_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_interviewers_name ON public.interviewers(name);

-- Add comment
COMMENT ON TABLE public.interviewers IS 'Table storing interviewer profiles and configurations';
