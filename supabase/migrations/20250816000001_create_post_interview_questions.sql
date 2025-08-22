-- Create post_interview_questions table
CREATE TABLE IF NOT EXISTS public.post_interview_questions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    question_text TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('feedback', 'technical', 'process', 'improvement', 'platform', 'other')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    needs_followup BOOLEAN DEFAULT FALSE,
    contact_preference TEXT DEFAULT 'none' CHECK (contact_preference IN ('none', 'email', 'platform')),
    interview_id TEXT,
    agent_name TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'acknowledged' CHECK (status IN ('acknowledged', 'pending_response', 'responded', 'closed')),
    admin_response TEXT,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_notifications table for follow-up tasks
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    read_by UUID REFERENCES auth.users(id)
);

-- Create analytics_events table for tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_interview_questions_user_id ON public.post_interview_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interview_questions_category ON public.post_interview_questions(category);
CREATE INDEX IF NOT EXISTS idx_post_interview_questions_status ON public.post_interview_questions(status);
CREATE INDEX IF NOT EXISTS idx_post_interview_questions_submitted_at ON public.post_interview_questions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_interview_questions_needs_followup ON public.post_interview_questions(needs_followup) WHERE needs_followup = true;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON public.admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON public.admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp DESC);

-- Add RLS policies
ALTER TABLE public.post_interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only view their own questions
CREATE POLICY "Users can view own questions" ON public.post_interview_questions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own questions
CREATE POLICY "Users can insert own questions" ON public.post_interview_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all questions (you may want to implement proper admin role checking)
CREATE POLICY "Admins can view all questions" ON public.post_interview_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (email LIKE '%admin%' OR raw_user_meta_data->>'role' = 'admin')
        )
    );

-- Admins can view all notifications
CREATE POLICY "Admins can view notifications" ON public.admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (email LIKE '%admin%' OR raw_user_meta_data->>'role' = 'admin')
        )
    );

-- Analytics events are service-only (no user access)
CREATE POLICY "Service only analytics" ON public.analytics_events
    FOR ALL USING (false);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_interview_questions_updated_at 
    BEFORE UPDATE ON public.post_interview_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.post_interview_questions IS 'Stores questions submitted by users after interviews';
COMMENT ON TABLE public.admin_notifications IS 'Notifications for admin team about user questions and issues';
COMMENT ON TABLE public.analytics_events IS 'General analytics events for platform usage tracking';

COMMENT ON COLUMN public.post_interview_questions.category IS 'Type of question: feedback, technical, process, improvement, platform, other';
COMMENT ON COLUMN public.post_interview_questions.rating IS 'User rating of interview experience (1-5 stars)';
COMMENT ON COLUMN public.post_interview_questions.needs_followup IS 'Whether user requested a response';
COMMENT ON COLUMN public.post_interview_questions.contact_preference IS 'How user prefers to be contacted for follow-up';
COMMENT ON COLUMN public.post_interview_questions.status IS 'Current status of the question/response cycle';

