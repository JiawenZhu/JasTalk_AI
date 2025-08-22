-- PHASE 3: Data Recovery Attempts
-- Run this SECOND to attempt recovery of missing AI responses

-- 1. IDENTIFY INTERVIEWS WITH MISSING AI RESPONSES (HIGH RECOVERY POTENTIAL)
SELECT 
  'INTERVIEWS WITH MISSING AI RESPONSES' as section,
  i.id as interview_id,
  i.interviewer_name,
  i.created_at,
  COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) as user_utterances,
  COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) as agent_utterances,
  'HIGH RECOVERY POTENTIAL' as recovery_priority
FROM interviews i
LEFT JOIN utterances u ON i.id = u.interview_id
WHERE i.status != 'incomplete'  -- Skip already marked incomplete
GROUP BY i.id, i.interviewer_name, i.created_at
HAVING COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 
   AND COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) > 0
ORDER BY i.created_at DESC;

-- 2. CHECK FOR ANY ORPHANED UTTERANCES (potential recovery)
SELECT 
  'ORPHANED UTTERANCES CHECK' as section,
  COUNT(*) as orphaned_count,
  COUNT(CASE WHEN speaker = 'USER' THEN 1 END) as orphaned_user_utterances,
  COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) as orphaned_agent_utterances
FROM utterances u
LEFT JOIN interviews i ON u.interview_id = i.id
WHERE i.id IS NULL;

-- 3. CHECK FOR INTERVIEWS WITH PARTIAL AI RESPONSES
SELECT 
  'PARTIAL AI RESPONSES CHECK' as section,
  i.id as interview_id,
  i.interviewer_name,
  i.created_at,
  COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) as user_utterances,
  COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) as agent_utterances,
  CASE 
    WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) > 0 THEN 'PARTIAL_AI_DATA'
    ELSE 'NO_AI_DATA'
  END as ai_data_status
FROM interviews i
LEFT JOIN utterances u ON i.id = u.interview_id
WHERE i.status != 'incomplete'
GROUP BY i.id, i.interviewer_name, i.created_at
HAVING COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) > 0 
   AND COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) < COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END)
ORDER BY i.created_at DESC;

