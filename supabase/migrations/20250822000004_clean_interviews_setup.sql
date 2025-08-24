-- Simple migration to add transcript column to existing interviews table
-- This avoids complex table dependencies and focuses on the core requirement

-- Add transcript column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interviews' AND column_name = 'transcript') THEN
        ALTER TABLE public.interviews ADD COLUMN transcript JSONB;
        COMMENT ON COLUMN public.interviews.transcript IS 'Full JSON array transcript of the interview conversation.';
    END IF;
END $$;

-- Create GIN index on transcript for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_interviews_transcript_gin ON public.interviews USING GIN (transcript);

-- Enable RLS if not already enabled
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for authenticated users
DROP POLICY IF EXISTS "authenticated_users_access" ON public.interviews;
CREATE POLICY "authenticated_users_access" ON public.interviews
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Add validation constraint to ensure transcript is a valid JSON array (if transcript column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'interviews' AND column_name = 'transcript') THEN
        -- Add validation constraint to ensure transcript is a valid JSON array
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE table_name = 'interviews' AND constraint_name = 'check_transcript_is_array') THEN
            ALTER TABLE public.interviews 
            ADD CONSTRAINT check_transcript_is_array 
            CHECK (jsonb_typeof(transcript) = 'array');
        END IF;

        -- Add validation constraint to ensure transcript array is not empty
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE table_name = 'interviews' AND constraint_name = 'check_transcript_not_empty') THEN
            ALTER TABLE public.interviews 
            ADD CONSTRAINT check_transcript_not_empty 
            CHECK (jsonb_array_length(transcript) > 0);
        END IF;
    END IF;
END $$;

