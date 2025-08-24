-- Enhance existing conversation_logs table with transcript storage
-- This provides both real-time logging AND final transcript storage in one place

-- First, let's check if there are any problematic constraints and remove them
DO $$ 
BEGIN
    -- Remove any existing problematic constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'conversation_logs' AND constraint_name = 'check_conversation_logs_transcript_not_empty') THEN
        ALTER TABLE public.conversation_logs DROP CONSTRAINT check_conversation_logs_transcript_not_empty;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'conversation_logs' AND constraint_name = 'check_conversation_logs_transcript_is_array') THEN
        ALTER TABLE public.conversation_logs DROP CONSTRAINT check_conversation_logs_transcript_is_array;
    END IF;
    
    -- Also check for any other transcript-related constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'conversation_logs' AND constraint_name LIKE '%transcript%') THEN
        EXECUTE 'ALTER TABLE public.conversation_logs DROP CONSTRAINT ' || 
                (SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE table_name = 'conversation_logs' AND constraint_name LIKE '%transcript%' LIMIT 1);
    END IF;
END $$;

-- Add transcript column to conversation_logs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversation_logs' AND column_name = 'transcript') THEN
        ALTER TABLE public.conversation_logs ADD COLUMN transcript JSONB;
        COMMENT ON COLUMN public.conversation_logs.transcript IS 'Final interview transcript in structured format for recruiter review and analysis.';
    END IF;
END $$;

-- Create GIN index on transcript for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_conversation_logs_transcript_gin ON public.conversation_logs USING GIN (transcript);

-- Clean up existing data - set transcript to NULL for any problematic values
-- First, let's check what constraints exist on the transcript column
DO $$ 
BEGIN
    -- Temporarily disable any NOT NULL constraints on transcript
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'conversation_logs' 
               AND column_name = 'transcript' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE public.conversation_logs ALTER COLUMN transcript DROP NOT NULL;
    END IF;
END $$;

-- Now update the data safely
UPDATE public.conversation_logs 
SET transcript = NULL 
WHERE transcript = '[]'::jsonb 
   OR transcript = '{}'::jsonb 
   OR transcript = 'null'::jsonb
   OR transcript IS NOT NULL AND jsonb_array_length(transcript) = 0;

-- Ensure the transcript column allows NULL values
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'conversation_logs' AND column_name = 'transcript') THEN
        -- Make sure the column allows NULL values
        ALTER TABLE public.conversation_logs ALTER COLUMN transcript DROP NOT NULL;
        
        -- Add validation constraint to ensure transcript is a valid JSON array when not null
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE table_name = 'conversation_logs' AND constraint_name = 'check_conversation_logs_transcript_is_array') THEN
            ALTER TABLE public.conversation_logs 
            ADD CONSTRAINT check_conversation_logs_transcript_is_array 
            CHECK (transcript IS NULL OR jsonb_typeof(transcript) = 'array');
        END IF;
    END IF;
END $$;

-- Add comment explaining the dual purpose
COMMENT ON TABLE public.conversation_logs IS 'Enhanced conversation logging table that stores both real-time utterances and final structured transcripts for comprehensive interview analysis.';

