-- Data Fix Script: Restore Missing Utterances for Interviews
-- This script addresses the 7 interviews that have no utterances

-- Step 1: Show the exact interviews that need fixing
SELECT 
    'INTERVIEWS NEEDING UTTERANCES' as section,
    i.id,
    i.interviewer_name,
    i.status,
    i.created_at,
    i.job_title,
    i.key_skills
FROM interviews i
LEFT JOIN utterances u ON i.id = u.interview_id
WHERE u.id IS NULL
ORDER BY i.created_at DESC;

-- Step 2: Check if these interviews have any data in conversation_logs
-- This will help us understand if we can recover the data
SELECT 
    'CONVERSATION LOGS RECOVERY CHECK' as section,
    cl.id as conversation_log_id,
    cl.agent_name,
    cl.candidate_name,
    cl.created_at,
    CASE 
        WHEN cl.transcript IS NOT NULL THEN 'HAS_TRANSCRIPT'
        ELSE 'NO_TRANSCRIPT'
    END as transcript_status,
    CASE 
        WHEN cl.post_call_analysis IS NOT NULL THEN 'HAS_ANALYSIS'
        ELSE 'NO_ANALYSIS'
    END as analysis_status
FROM conversation_logs cl
WHERE cl.created_at >= '2025-08-17 17:00:00'  -- Recent interviews
ORDER BY cl.created_at DESC;

-- Step 3: Check for any recent utterances that might belong to these interviews
-- Look for utterances created around the same time as the interviews
SELECT 
    'RECENT UTTERANCES TIMELINE' as section,
    u.interview_id,
    u.speaker,
    LEFT(u.text, 50) as text_preview,
    u.timestamp,
    i.interviewer_name,
    i.created_at as interview_created
FROM utterances u
JOIN interviews i ON u.interview_id = i.id
WHERE u.timestamp >= '2025-08-17 17:00:00'
ORDER BY u.timestamp;

-- Step 4: Data recovery recommendations
SELECT 
    'DATA RECOVERY RECOMMENDATIONS' as section,
    CASE 
        WHEN (SELECT COUNT(*) FROM conversation_logs WHERE created_at >= '2025-08-17 17:00:00') > 0 
        THEN '✅ Conversation logs exist - can attempt data recovery'
        ELSE '❌ No recent conversation logs found'
    END as recovery_source_available,
    CASE 
        WHEN (SELECT COUNT(*) FROM interviews i LEFT JOIN utterances u ON i.id = u.interview_id WHERE u.id IS NULL) > 0 
        THEN '⚠️ Need to create placeholder utterances or recover from logs'
        ELSE '✅ All interviews have utterances'
    END as action_needed,
    'Consider migrating data from conversation_logs to new pipeline' as recommendation;

