-- Create question_answers table
CREATE TABLE IF NOT EXISTS public.question_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    audio_url TEXT,
    duration INTEGER DEFAULT 0,
    category TEXT DEFAULT 'General',
    difficulty TEXT DEFAULT 'medium',
    practice_session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    call_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_answers_user_email ON public.question_answers(user_email);
CREATE INDEX IF NOT EXISTS idx_question_answers_practice_session_id ON public.question_answers(practice_session_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_call_id ON public.question_answers(call_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_created_at ON public.question_answers(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own question answers" ON public.question_answers
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert their own question answers" ON public.question_answers
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update their own question answers" ON public.question_answers
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete their own question answers" ON public.question_answers
    FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_question_answers_updated_at
    BEFORE UPDATE ON public.question_answers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 
