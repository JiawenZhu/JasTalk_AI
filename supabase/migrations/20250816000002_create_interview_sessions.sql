-- Create interview_sessions table for progress tracking
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    session_key TEXT UNIQUE NOT NULL, -- Unique identifier for each session
    
    -- Interview Configuration
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    agent_voice TEXT,
    questions JSONB NOT NULL, -- Array of interview questions
    total_questions INTEGER NOT NULL,
    
    -- Progress Tracking
    current_question_index INTEGER DEFAULT 0,
    questions_completed INTEGER DEFAULT 0,
    conversation_history JSONB DEFAULT '[]', -- Array of conversation entries
    
    -- Session Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Session Metadata
    interview_type TEXT DEFAULT 'practice',
    difficulty_level TEXT,
    estimated_duration INTEGER, -- in minutes
    time_spent INTEGER DEFAULT 0, -- in seconds
    
    -- Resume Information
    last_ai_response TEXT,
    last_user_response TEXT,
    current_turn TEXT CHECK (current_turn IN ('user', 'ai', 'waiting')),
    
    -- Analytics
    session_data JSONB DEFAULT '{}', -- Additional session metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create interview_session_snapshots for detailed progress tracking
CREATE TABLE IF NOT EXISTS public.interview_session_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('question_start', 'question_complete', 'pause', 'resume', 'error')),
    
    -- Snapshot Data
    question_index INTEGER NOT NULL,
    conversation_state JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Context Information
    ai_response TEXT,
    user_response TEXT,
    response_time INTEGER, -- in milliseconds
    confidence_score FLOAT,
    
    -- Technical Metadata
    session_metadata JSONB DEFAULT '{}'
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON public.interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_key ON public.interview_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_last_activity ON public.interview_sessions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_status ON public.interview_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_session_snapshots_session_id ON public.interview_session_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_session_snapshots_type ON public.interview_session_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_session_snapshots_timestamp ON public.interview_session_snapshots(timestamp DESC);

-- Add RLS policies
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_session_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON public.interview_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.interview_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.interview_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access snapshots of their own sessions
CREATE POLICY "Users can view own session snapshots" ON public.interview_session_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions 
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own session snapshots" ON public.interview_session_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interview_sessions 
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

-- Admins can view all sessions (for analytics and support)
CREATE POLICY "Admins can view all sessions" ON public.interview_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (email LIKE '%admin%' OR raw_user_meta_data->>'role' = 'admin')
        )
    );

CREATE POLICY "Admins can view all snapshots" ON public.interview_session_snapshots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (email LIKE '%admin%' OR raw_user_meta_data->>'role' = 'admin')
        )
    );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_interview_sessions_updated_at 
    BEFORE UPDATE ON public.interview_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to clean up old abandoned sessions (optional)
CREATE OR REPLACE FUNCTION cleanup_abandoned_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Mark sessions as abandoned if no activity for 24 hours
    UPDATE public.interview_sessions 
    SET status = 'abandoned', updated_at = NOW()
    WHERE status = 'active' 
      AND last_activity_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Delete very old abandoned sessions (older than 30 days)
    DELETE FROM public.interview_sessions 
    WHERE status = 'abandoned' 
      AND updated_at < NOW() - INTERVAL '30 days';
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.interview_sessions IS 'Tracks ongoing and completed interview sessions with progress information';
COMMENT ON TABLE public.interview_session_snapshots IS 'Detailed snapshots of session state at key moments';

COMMENT ON COLUMN public.interview_sessions.session_key IS 'Unique identifier for session resumption';
COMMENT ON COLUMN public.interview_sessions.current_question_index IS 'Zero-based index of current question (0 = first question)';
COMMENT ON COLUMN public.interview_sessions.questions_completed IS 'Number of questions user has fully answered';
COMMENT ON COLUMN public.interview_sessions.conversation_history IS 'Complete conversation log as JSON array';
COMMENT ON COLUMN public.interview_sessions.current_turn IS 'Whose turn it is to speak (user/ai/waiting)';
COMMENT ON COLUMN public.interview_sessions.time_spent IS 'Total time spent in session (seconds)';

-- Create view for active sessions (for dashboard)
CREATE VIEW public.user_active_sessions AS
SELECT 
    s.*,
    ROUND((s.questions_completed::NUMERIC / s.total_questions::NUMERIC) * 100, 1) AS completion_percentage,
    (s.total_questions - s.questions_completed) AS questions_remaining,
    EXTRACT(EPOCH FROM (NOW() - s.last_activity_at))::INTEGER AS seconds_since_last_activity
FROM public.interview_sessions s
WHERE s.status IN ('active', 'paused')
ORDER BY s.last_activity_at DESC;
