-- 🚀 Essential Data Restoration Script for JasTalk AI (Fixed Version)
-- This script restores the minimum required data for the application to function

-- 1. Create a test user for development
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'jiawenzhu408@gmail.com',
    crypt('testpassword123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Jiawen Zhu", "avatar_url": null}',
    false,
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Create user subscription for the test user
INSERT INTO user_subscriptions (
    id,
    user_id,
    tier,
    status,
    interview_time_remaining,
    interview_time_total,
    created_at,
    updated_at,
    expires_at,
    leftover_seconds
) VALUES (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'pro',
    'active',
    7200, -- 2 hours in seconds
    7200,
    now(),
    now(),
    now() + interval '30 days',
    0
) ON CONFLICT (user_id, tier) DO NOTHING;

-- 3. Create additional test users if needed
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'test@jastalk.com',
    crypt('testpassword123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test User", "avatar_url": null}',
    false,
    '',
    '',
    '',
    ''
),
(
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'demo@jastalk.com',
    crypt('testpassword123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Demo User", "avatar_url": null}',
    false,
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 4. Create subscriptions for additional users
INSERT INTO user_subscriptions (
    id,
    user_id,
    tier,
    status,
    interview_time_remaining,
    interview_time_total,
    created_at,
    updated_at,
    expires_at,
    leftover_seconds
) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'free',
    'active',
    1800, -- 30 minutes
    1800,
    now(),
    now(),
    now() + interval '7 days',
    0
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'pro',
    'active',
    3600, -- 1 hour
    3600,
    now(),
    now(),
    now() + interval '14 days',
    0
) ON CONFLICT (user_id, tier) DO NOTHING;

-- 5. Create sample practice sessions for testing (using correct structure)
INSERT INTO practice_sessions (
    id,
    user_id,
    voice_agent_id,
    status,
    created_at,
    updated_at,
    call_id,
    retell_agent_id,
    retell_call_id,
    session_name,
    score,
    duration_seconds,
    metadata
) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000',
    'tech-puck',
    'completed',
    now() - interval '2 days',
    now() - interval '2 days',
    'call_sample_001',
    'analytical-kore',
    'call_sample_002',
    'Technical Interview Practice',
    85,
    1800,
    '{"interview_type": "technical", "difficulty": "intermediate", "topics": ["APIs", "programming"]}'::jsonb
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'empathetic-zephyr',
    'in-progress',
    now() - interval '1 day',
    now(),
    'call_sample_003',
    NULL,
    NULL,
    'Behavioral Interview Practice',
    NULL,
    600,
    '{"interview_type": "behavioral", "difficulty": "beginner", "topics": ["teamwork", "communication"]}'::jsonb
) ON CONFLICT DO NOTHING;

-- 6. Create sample conversation logs
INSERT INTO conversation_logs (
    id,
    created_at,
    updated_at,
    call_id,
    voice_agent_id,
    candidate_name,
    candidate_email,
    transcript,
    interview_start_time,
    interview_end_time,
    duration_seconds,
    metadata,
    is_completed,
    feedback_notes
) VALUES 
(
    gen_random_uuid(),
    now() - interval '2 days',
    now() - interval '2 days',
    'call_sample_001',
    'tech-puck',
    'Jiawen Zhu',
    'jiawenzhu408@gmail.com',
    '[
        {"role": "interviewer", "content": "Hello! Welcome to your technical interview. Let us start with a simple question: Can you explain what a REST API is?", "timestamp": "2024-01-01T10:00:00Z"},
        {"role": "candidate", "content": "A REST API is a way for different software systems to communicate over HTTP using standard methods like GET, POST, PUT, and DELETE.", "timestamp": "2024-01-01T10:00:05Z"},
        {"role": "interviewer", "content": "Excellent! That is a great explanation. Now, can you tell me about the difference between synchronous and asynchronous programming?", "timestamp": "2024-01-01T10:00:10Z"}
    ]'::jsonb,
    now() - interval '2 days',
    now() - interval '2 days' + interval '30 minutes',
    1800,
    '{"interview_type": "technical", "difficulty": "intermediate", "topics": ["APIs", "programming"]}'::jsonb,
    true,
    'Candidate showed strong technical knowledge and communication skills.'
) ON CONFLICT DO NOTHING;

-- 7. Create sample interview questions
INSERT INTO questions (
    id,
    interview_id,
    question_text,
    question_type,
    difficulty_level,
    category,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    gen_random_uuid(),
    'Can you explain the difference between a stack and a queue?',
    'technical',
    'intermediate',
    'data_structures',
    now(),
    now()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'Tell me about a time when you had to work with a difficult team member.',
    'behavioral',
    'advanced',
    'teamwork',
    now(),
    now()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'How would you approach debugging a production issue?',
    'technical',
    'advanced',
    'problem_solving',
    now(),
    now()
) ON CONFLICT DO NOTHING;

-- 8. Create sample user feedback
INSERT INTO user_feedback (
    id,
    user_id,
    feedback_type,
    feedback_text,
    rating,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'interview_experience',
    'Great interview experience! The AI interviewer was very realistic and helpful.',
    5,
    now() - interval '1 day',
    now() - interval '1 day'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'platform_usability',
    'The platform is intuitive and easy to use. Would recommend to friends.',
    4,
    now() - interval '2 days',
    now() - interval '2 days'
) ON CONFLICT DO NOTHING;

-- 9. Verify the data was created
SELECT 'Data Restoration Complete!' as status;

-- Show summary of created data
SELECT 
    'Users' as table_name,
    COUNT(*) as record_count
FROM auth.users
UNION ALL
SELECT 
    'User Subscriptions' as table_name,
    COUNT(*) as record_count
FROM user_subscriptions
UNION ALL
SELECT 
    'Practice Sessions' as table_name,
    COUNT(*) as record_count
FROM practice_sessions
UNION ALL
SELECT 
    'Conversation Logs' as table_name,
    COUNT(*) as record_count
FROM conversation_logs
UNION ALL
SELECT 
    'Questions' as table_name,
    COUNT(*) as record_count
FROM questions
UNION ALL
SELECT 
    'User Feedback' as table_name,
    COUNT(*) as record_count
FROM user_feedback;
