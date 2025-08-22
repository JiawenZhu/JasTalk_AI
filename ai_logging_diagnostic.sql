-- AI Response Logging Diagnostic Script
-- This script helps diagnose why AI responses are not being logged

-- Step 1: Check if any AI responses exist at all
SELECT 
    'AI RESPONSE CHECK' as section,
    COUNT(*) as total_utterances,
    COUNT(CASE WHEN speaker = 'USER' THEN 1 END) as user_utterances,
    COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) as agent_utterances,
    CASE 
        WHEN COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) = 0 
        THEN '❌ NO AI RESPONSES LOGGED AT ALL'
        ELSE '✅ Some AI responses exist'
    END as status
FROM utterances;

-- Step 2: Check the most recent utterances to see if new ones are being added
SELECT 
    'RECENT UTTERANCES TIMELINE' as section,
    u.interview_id,
    u.speaker,
    LEFT(u.text, 50) as text_preview,
    u.timestamp,
    i.interviewer_name,
    i.status
FROM utterances u
JOIN interviews i ON u.interview_id = i.id
ORDER BY u.timestamp DESC
LIMIT 10;

-- Step 3: Check if there are any interviews with both user and AI responses
SELECT 
    'INTERVIEWS WITH BOTH SPEAKERS' as section,
    i.id,
    i.interviewer_name,
    i.status,
    COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) as user_utterances,
    COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) as agent_utterances,
    CASE 
        WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) > 0 AND COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) > 0
        THEN '✅ BOTH SPEAKERS'
        WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) > 0 AND COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0
        THEN '❌ USER ONLY'
        WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 AND COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) > 0
        THEN '❌ AGENT ONLY'
        ELSE '❌ NO UTTERANCES'
    END as conversation_status
FROM interviews i
LEFT JOIN utterances u ON i.id = u.interview_id
GROUP BY i.id, i.interviewer_name, i.status
ORDER BY i.created_at DESC;

-- Step 4: Check for any recent activity (last hour)
SELECT 
    'RECENT ACTIVITY CHECK' as section,
    COUNT(*) as total_recent_utterances,
    COUNT(CASE WHEN speaker = 'USER' THEN 1 END) as recent_user_utterances,
    COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) as recent_agent_utterances,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Recent activity detected'
        ELSE '❌ No recent activity'
    END as recent_status
FROM utterances
WHERE timestamp >= NOW() - INTERVAL '1 hour';

