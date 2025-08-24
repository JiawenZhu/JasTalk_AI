-- 🚀 Essential Production Data for JasTalk AI - agentica-ai
-- This script adds essential data to the production database

-- ========================================
-- 1. VOICE AGENTS (AI Interviewer Voices)
-- ========================================
INSERT INTO voice_agents (
    id, name, voice_id, is_active, characteristics, description, created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    'Alex Thompson',
    'confident-alex',
    true,
    ARRAY['professional', 'articulate', 'encouraging'],
    'Professional technical interviewer with 10+ years of experience in software engineering.',
    now(),
    now()
),
(
    gen_random_uuid(),
    'Sarah Chen',
    'empathetic-sarah',
    true,
    ARRAY['empathetic', 'supportive', 'insightful'],
    'Behavioral interview specialist focused on leadership and team dynamics.',
    now(),
    now()
),
(
    gen_random_uuid(),
    'Marcus Rodriguez',
    'analytical-marcus',
    true,
    ARRAY['analytical', 'methodical', 'detail-oriented'],
    'System design expert with deep knowledge of scalable architectures.',
    now(),
    now()
),
(
    gen_random_uuid(),
    'Lisa Wang',
    'enthusiastic-lisa',
    true,
    ARRAY['enthusiastic', 'energetic', 'motivating'],
    'Product management interviewer with startup and enterprise experience.',
    now(),
    now()
) ON CONFLICT (voice_id) DO NOTHING;

-- ========================================
-- 2. INTERVIEWERS (Interview Profiles)
-- ========================================
INSERT INTO interviewers (
    name, role, company, experience_years, bio, avatar_url, voice_agent_id, is_active, created_at, updated_at
) VALUES 
(
    'Alex Thompson',
    'Senior Software Engineer',
    'TechCorp',
    12,
    'Passionate about clean code and system design. Loves mentoring junior developers.',
    '/avatars/alex-thompson.jpg',
    'confident-alex',
    true,
    now(),
    now()
),
(
    'Sarah Chen',
    'Engineering Manager',
    'InnovateLabs',
    8,
    'Leadership expert focused on building high-performing teams and inclusive culture.',
    '/avatars/sarah-chen.jpg',
    'empathetic-sarah',
    true,
    now(),
    now()
),
(
    'Marcus Rodriguez',
    'Principal Architect',
    'ScaleUp Inc',
    15,
    'System architecture guru with experience scaling from startup to enterprise.',
    '/avatars/marcus-rodriguez.jpg',
    'analytical-marcus',
    true,
    now(),
    now()
),
(
    'Lisa Wang',
    'VP of Product',
    'GrowthTech',
    10,
    'Product strategy expert with a track record of launching successful products.',
    '/avatars/lisa-wang.jpg',
    'enthusiastic-lisa',
    true,
    now(),
    now()
) ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 3. USER SUBSCRIPTIONS (Credit System)
-- ========================================
-- Note: Users will be created when they sign up
-- This is just sample structure for when user_id is available

-- ========================================
-- 4. PRACTICE SESSIONS (Sample Templates)
-- ========================================
INSERT INTO practice_sessions (
    id, session_name, session_key, agent_id, agent_name, agent_voice, user_email, duration_seconds,
    questions, current_question_index, questions_completed, status, interview_type, difficulty_level,
    estimated_duration, metadata, created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    'Technical Interview Template',
    'template_technical_001',
    'template_agent',
    'Alex Thompson',
    'confident-alex',
    'template@example.com',
    3600,
    '[
        {"id": 1, "text": "Tell me about yourself and your technical background.", "type": "behavioral"},
        {"id": 2, "text": "Explain the difference between a stack and a queue.", "type": "technical"},
        {"id": 3, "text": "How would you design a URL shortening service?", "type": "system_design"},
        {"id": 4, "text": "What is the time complexity of binary search?", "type": "algorithms"},
        {"id": 5, "text": "Describe a challenging technical problem you solved.", "type": "behavioral"}
    ]'::jsonb,
    0,
    0,
    'template',
    'technical',
    'intermediate',
    3600,
    '{"isTemplate": true, "category": "software_engineering"}'::jsonb,
    now(),
    now()
),
(
    gen_random_uuid(),
    'Behavioral Interview Template',
    'template_behavioral_001',
    'template_agent',
    'Sarah Chen',
    'empathetic-sarah',
    'template@example.com',
    2700,
    '[
        {"id": 1, "text": "Tell me about a time when you had to work with a difficult team member.", "type": "behavioral"},
        {"id": 2, "text": "Describe a situation where you had to meet a tight deadline.", "type": "behavioral"},
        {"id": 3, "text": "How do you handle competing priorities?", "type": "behavioral"},
        {"id": 4, "text": "Give me an example of when you showed leadership.", "type": "behavioral"},
        {"id": 5, "text": "What motivates you in your work?", "type": "personal"}
    ]'::jsonb,
    0,
    0,
    'template',
    'behavioral',
    'intermediate',
    2700,
    '{"isTemplate": true, "category": "leadership"}'::jsonb,
    now(),
    now()
) ON CONFLICT (session_key) DO NOTHING;

-- ========================================
-- 5. LEADS (Marketing Data)
-- ========================================
INSERT INTO leads (
    id, email, name, source, ref, utm_source, utm_medium, utm_campaign, created_at
) VALUES 
(
    gen_random_uuid(),
    'demo@example.com',
    'Demo User',
    'website',
    'homepage',
    'organic',
    'direct',
    'launch',
    now()
) ON CONFLICT (email) DO NOTHING;

-- ========================================
-- 6. MODEL CONFIGURATIONS (AI Settings)
-- ========================================
INSERT INTO model_configurations (
    id, user_id, config_name, model_provider, model_name, temperature, max_tokens, 
    system_prompt, is_active, created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    NULL, -- Global configuration
    'Default Technical Interview',
    'google',
    'gemini-2.0-flash-exp',
    0.7,
    1000,
    'You are a professional technical interviewer. Conduct fair, thorough interviews while being encouraging and constructive.',
    true,
    now(),
    now()
),
(
    gen_random_uuid(),
    NULL, -- Global configuration
    'Default Behavioral Interview',
    'google',
    'gemini-2.0-flash-exp',
    0.8,
    1200,
    'You are an empathetic behavioral interviewer. Focus on understanding the candidate''s experiences, motivations, and team dynamics.',
    true,
    now(),
    now()
) ON CONFLICT (user_id, config_name) DO NOTHING;

-- ========================================
-- VERIFICATION QUERY
-- ========================================
SELECT '🎉 Essential production data inserted successfully!' as status;

-- Show table counts
SELECT 
    'voice_agents' as table_name, COUNT(*) as count FROM voice_agents
UNION ALL
SELECT 'interviewers', COUNT(*) FROM interviewers
UNION ALL
SELECT 'practice_sessions', COUNT(*) FROM practice_sessions
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'model_configurations', COUNT(*) FROM model_configurations;
