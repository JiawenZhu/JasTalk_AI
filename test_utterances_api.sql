-- Test script to check utterances logging
-- This will help us understand why utterances are not being saved

-- Check if there are any recent interviews
SELECT 
    'RECENT INTERVIEWS' as section,
    id,
    interviewer_name,
    status,
    created_at,
    updated_at
FROM interviews
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any utterances at all
SELECT 
    'UTTERANCES CHECK' as section,
    COUNT(*) as total_utterances,
    COUNT(CASE WHEN speaker = 'USER' THEN 1 END) as user_utterances,
    COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) as agent_utterances
FROM utterances;

-- Check if there are any recent API calls or errors
-- (This would require checking application logs, but we can see the data state)

-- Check interview status distribution
SELECT 
    'INTERVIEW STATUS DISTRIBUTION' as section,
    status,
    COUNT(*) as count,
    ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*)::NUMERIC FROM interviews)) * 100, 1) as percentage
FROM interviews
GROUP BY status
ORDER BY count DESC;

