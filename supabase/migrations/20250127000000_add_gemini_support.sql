-- Add Gemini support to interviewers table
-- This migration adds fields to support both Retell and Gemini agents

-- Add new columns to interviewers table
ALTER TABLE public.interviewers 
ADD COLUMN IF NOT EXISTS agent_type text DEFAULT 'gemini' CHECK (agent_type IN ('retell', 'gemini')),
ADD COLUMN IF NOT EXISTS subscription_required text DEFAULT 'free' CHECK (subscription_required IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add gemini_config JSON column for Gemini-specific settings
ALTER TABLE public.interviewers 
ADD COLUMN IF NOT EXISTS gemini_config jsonb DEFAULT '{
  "model": "gemini-2.0-flash-exp",
  "voice": "default",
  "personality": "Professional and encouraging",
  "interview_style": "Structured but conversational"
}'::jsonb;

-- Create index for faster queries on agent_type and subscription_required
CREATE INDEX IF NOT EXISTS idx_interviewers_agent_type ON public.interviewers(agent_type);
CREATE INDEX IF NOT EXISTS idx_interviewers_subscription ON public.interviewers(subscription_required);
CREATE INDEX IF NOT EXISTS idx_interviewers_active ON public.interviewers(is_active);

-- Insert some default Gemini agents for free users
INSERT INTO public.interviewers (
  name, 
  description, 
  avatar_url, 
  agent_type, 
  subscription_required, 
  is_active,
  gemini_config,
  created_at,
  updated_at
) VALUES 
(
  'Sarah Chen',
  'A friendly and encouraging interviewer who specializes in behavioral questions and helps candidates feel comfortable while assessing their soft skills.',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  'gemini',
  'free',
  true,
  '{"model": "gemini-2.0-flash-exp", "voice": "default", "personality": "Friendly and encouraging", "interview_style": "Conversational and supportive"}',
  NOW(),
  NOW()
),
(
  'Marcus Rodriguez',
  'A technical interviewer with expertise in software engineering who asks challenging questions while maintaining a professional and respectful tone.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'gemini',
  'free',
  true,
  '{"model": "gemini-2.0-flash-exp", "voice": "default", "personality": "Professional and analytical", "interview_style": "Structured and thorough"}',
  NOW(),
  NOW()
),
(
  'Lisa Thompson',
  'A senior-level interviewer who conducts executive-style interviews, focusing on leadership, strategy, and high-level problem-solving skills.',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'gemini',
  'free',
  true,
  '{"model": "gemini-2.0-flash-exp", "voice": "default", "personality": "Executive and strategic", "interview_style": "High-level and insightful"}',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Update existing interviewers to have proper agent_type and subscription_required
UPDATE public.interviewers 
SET 
  agent_type = CASE 
    WHEN retell_agent_id IS NOT NULL THEN 'retell'
    ELSE 'gemini'
  END,
  subscription_required = CASE 
    WHEN retell_agent_id IS NOT NULL THEN 'pro'
    ELSE 'free'
  END,
  is_active = true
WHERE agent_type IS NULL OR subscription_required IS NULL;

-- Add comment to document the new structure
COMMENT ON COLUMN public.interviewers.agent_type IS 'Type of AI agent: retell (voice) or gemini (text-based)';
COMMENT ON COLUMN public.interviewers.subscription_required IS 'Required subscription level: free or pro';
COMMENT ON COLUMN public.interviewers.is_active IS 'Whether this interviewer is available for interviews';
COMMENT ON COLUMN public.interviewers.gemini_config IS 'Configuration for Gemini agents including model, personality, and interview style';
