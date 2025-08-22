-- Create only the essential missing tables for credit system
-- Migration: 20250819033408_create_only_missing_tables

-- Note: Tables already exist from previous migrations, just adding missing RLS policies

-- 7. Create basic RLS policies for existing tables
DO $$ 
BEGIN
    -- For user_subscriptions (user_id is UUID)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own subscriptions' AND tablename = 'user_subscriptions') THEN
        CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
            FOR SELECT USING (auth.uid()::uuid = user_id::uuid);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own subscriptions' AND tablename = 'user_subscriptions') THEN
        CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
            FOR UPDATE USING (auth.uid()::uuid = user_id::uuid);
    END IF;
    
    -- For interview_sessions (user_id is UUID)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own interview sessions' AND tablename = 'interview_sessions') THEN
        CREATE POLICY "Users can view their own interview sessions" ON public.interview_sessions
            FOR SELECT USING (auth.uid()::uuid = user_id::uuid);
    END IF;
    
    -- For interviews (user_id is TEXT)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own interviews' AND tablename = 'interviews') THEN
        CREATE POLICY "Users can view their own interviews" ON public.interviews
            FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view utterances from their own interviews' AND tablename = 'utterances') THEN
        CREATE POLICY "Users can view utterances from their own interviews" ON public.utterances
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.interviews
                    WHERE interviews.id = utterances.interview_id
                    AND interviews.user_id = auth.uid()::text
                )
            );
    END IF;
END $$;

-- 8. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interviews TO authenticated;
GRANT ALL ON public.utterances TO authenticated;

-- 9. Insert default subscription for existing users (only if table is empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.user_subscriptions LIMIT 1) THEN
        INSERT INTO public.user_subscriptions (user_id, tier, status, interview_time_remaining, interview_time_total)
        SELECT 
            u.id,
            'pro' as tier,
            'active' as status,
            480 as interview_time_remaining, -- 8 hours default
            480 as interview_time_total
        FROM auth.users u;
    END IF;
END $$;
