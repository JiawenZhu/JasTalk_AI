-- Create enhanced interviews table with AI analysis pipeline support
-- Table already exists from previous migration, skipping creation
-- CREATE TABLE IF NOT EXISTS interviews (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     interviewer_name TEXT NOT NULL,
--     status TEXT NOT NULL DEFAULT 'IN_PROGRESS' 
--         CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PROCESSING_ANALYSIS', 'ANALYSIS_COMPLETE')),
--     job_title TEXT,
--     key_skills TEXT, -- comma-separated skills
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     completed_at TIMESTAMPTZ,
--     
--     -- Additional metadata
--     agent_id TEXT,
--     total_questions INTEGER,
--     questions_answered INTEGER DEFAULT 0
-- );

-- Create utterances table for conversation logging
CREATE TABLE utterances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    speaker TEXT NOT NULL CHECK (speaker IN ('USER', 'AGENT')),
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Additional metadata for analysis
    word_count INTEGER,
    duration_seconds DECIMAL,
    confidence_score DECIMAL -- for speech recognition confidence
);

-- Create interview analysis table for storing Gemini API results
CREATE TABLE interview_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Analysis metadata
    analysis_version TEXT DEFAULT 'v1.0',
    processing_time_seconds DECIMAL,
    token_usage JSONB -- for tracking API usage
);

-- Create critical performance indexes
CREATE INDEX IF NOT EXISTS idx_utterances_interview_id ON utterances(interview_id);
CREATE INDEX IF NOT EXISTS idx_utterances_timestamp ON utterances(interview_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interview_analysis_interview_id ON interview_analysis(interview_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_analysis_updated_at ON interview_analysis;
CREATE TRIGGER update_interview_analysis_updated_at BEFORE UPDATE ON interview_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE utterances ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interviews
DROP POLICY IF EXISTS "Users can view own interviews" ON interviews;
CREATE POLICY "Users can view own interviews" ON interviews
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own interviews" ON interviews;
CREATE POLICY "Users can insert own interviews" ON interviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own interviews" ON interviews;
CREATE POLICY "Users can update own interviews" ON interviews
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Create RLS policies for utterances
DROP POLICY IF EXISTS "Users can view own utterances" ON utterances;
CREATE POLICY "Users can view own utterances" ON utterances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = utterances.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can insert own utterances" ON utterances;
CREATE POLICY "Users can insert own utterances" ON utterances
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = utterances.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

-- Create RLS policies for interview analysis
DROP POLICY IF EXISTS "Users can view own analysis" ON interview_analysis;
CREATE POLICY "Users can view own analysis" ON interview_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = interview_analysis.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can insert own analysis" ON interview_analysis;
CREATE POLICY "Users can insert own analysis" ON interview_analysis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = interview_analysis.interview_id 
            AND interviews.user_id = auth.uid()::text
        )
    );

-- Create admin policies for service operations
DROP POLICY IF EXISTS "Service role can manage all interviews" ON interviews;
CREATE POLICY "Service role can manage all interviews" ON interviews
    FOR ALL USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "Service role can manage all utterances" ON utterances;
CREATE POLICY "Service role can manage all utterances" ON utterances
    FOR ALL USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "Service role can manage all analysis" ON interview_analysis;
CREATE POLICY "Service role can manage all analysis" ON interview_analysis
    FOR ALL USING (current_setting('role') = 'service_role');

-- Create helpful views for analysis
CREATE VIEW interview_summary AS
SELECT 
    i.id,
    i.user_id,
    i.title as interviewer_name, -- Use existing title column instead of interviewer_name
    i.status,
    i.interview_type as job_title, -- Use existing interview_type column
    i.description as key_skills, -- Use existing description column
    i.created_at,
    i.updated_at,
    NULL as completed_at, -- This column doesn't exist, set to NULL
    COUNT(u.id) as total_utterances,
    COUNT(u.id) FILTER (WHERE u.speaker = 'USER') as user_utterances,
    COUNT(u.id) FILTER (WHERE u.speaker = 'AGENT') as agent_utterances,
    EXTRACT(EPOCH FROM (MAX(u.timestamp) - MIN(u.timestamp))) as duration_seconds,
    CASE WHEN ia.id IS NOT NULL THEN true ELSE false END as has_analysis
FROM interviews i
LEFT JOIN utterances u ON i.id = u.interview_id
LEFT JOIN interview_analysis ia ON i.id = ia.interview_id
GROUP BY i.id, ia.id;

-- Grant necessary permissions
GRANT ALL ON interviews TO authenticated, service_role;
GRANT ALL ON utterances TO authenticated, service_role;
GRANT ALL ON interview_analysis TO authenticated, service_role;
GRANT SELECT ON interview_summary TO authenticated, service_role;

-- Create function to calculate speaking metrics
CREATE OR REPLACE FUNCTION calculate_speaking_metrics(p_interview_id UUID)
RETURNS TABLE(
    words_per_minute DECIMAL,
    total_words INTEGER,
    total_duration_seconds DECIMAL,
    filler_word_count INTEGER
) AS $$
DECLARE
    user_utterances_text TEXT;
    total_words_count INTEGER;
    interview_duration DECIMAL;
    filler_words TEXT[] := ARRAY['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically'];
    filler_count INTEGER := 0;
    word TEXT;
BEGIN
    -- Get all user utterances as concatenated text
    SELECT STRING_AGG(u.text, ' ' ORDER BY u.timestamp)
    INTO user_utterances_text
    FROM utterances u
    WHERE u.interview_id = p_interview_id AND u.speaker = 'USER';
    
    IF user_utterances_text IS NULL THEN
        RETURN QUERY SELECT 0::DECIMAL, 0, 0::DECIMAL, 0;
        RETURN;
    END IF;
    
    -- Count total words
    total_words_count := ARRAY_LENGTH(STRING_TO_ARRAY(user_utterances_text, ' '), 1);
    
    -- Calculate interview duration in seconds
    SELECT EXTRACT(EPOCH FROM (MAX(u.timestamp) - MIN(u.timestamp)))
    INTO interview_duration
    FROM utterances u
    WHERE u.interview_id = p_interview_id;
    
    -- Count filler words
    FOREACH word IN ARRAY filler_words LOOP
        filler_count := filler_count + (
            SELECT COUNT(*)
            FROM UNNEST(STRING_TO_ARRAY(LOWER(user_utterances_text), ' ')) AS words
            WHERE words = word
        );
    END LOOP;
    
    -- Return calculated metrics
    RETURN QUERY SELECT 
        CASE 
            WHEN interview_duration > 0 THEN (total_words_count * 60.0 / interview_duration)::DECIMAL
            ELSE 0::DECIMAL
        END,
        total_words_count,
        COALESCE(interview_duration, 0)::DECIMAL,
        filler_count;
END;
$$ LANGUAGE plpgsql;

