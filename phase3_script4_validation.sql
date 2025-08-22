-- PHASE 3: Validation Testing (FIXED - No metadata column)
-- Run this FOURTH to validate Phase 2 fixes are working

-- 1. TEST NEW INTERVIEW LOGGING (Last 24 hours)
SELECT 
  'NEW INTERVIEW VALIDATION (Last 24h)' as section,
  COUNT(*) as total_new_interviews,
  COUNT(CASE WHEN data_status = 'COMPLETE' THEN 1 END) as complete_interviews,
  COUNT(CASE WHEN data_status != 'COMPLETE' THEN 1 END) as incomplete_interviews,
  ROUND(
    (COUNT(CASE WHEN data_status = 'COMPLETE' THEN 1 END)::float / 
     GREATEST(COUNT(*), 1)::float) * 100, 2
  ) as new_integrity_percentage,
  CASE 
    WHEN COUNT(CASE WHEN data_status = 'COMPLETE' THEN 1 END) = COUNT(*) THEN '✅ ALL NEW INTERVIEWS COMPLETE'
    WHEN COUNT(CASE WHEN data_status = 'COMPLETE' THEN 1 END) >= COUNT(*) * 0.9 THEN '⚠️ MOSTLY COMPLETE (>90%)'
    ELSE '❌ SIGNIFICANT INCOMPLETENESS DETECTED'
  END as validation_result
FROM (
  SELECT 
    i.id,
    CASE 
      WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 THEN 'MISSING_AGENT_RESPONSES'
      WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 THEN 'MISSING_USER_RESPONSES'
      WHEN COUNT(*) = 0 THEN 'NO_UTTERANCES'
      ELSE 'COMPLETE'
    END as data_status
  FROM interviews i
  LEFT JOIN utterances u ON i.id = u.interview_id
  WHERE i.created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY i.id
) new_interviews;

-- 2. DETAILED NEW INTERVIEW ANALYSIS
SELECT 
  'NEW INTERVIEW DETAILS (Last 24h)' as section,
  i.id as interview_id,
  i.interviewer_name,
  i.status,
  i.created_at,
  COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) as user_utterances,
  COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) as agent_utterances,
  COUNT(*) as total_utterances,
  CASE 
    WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 THEN 'MISSING_AGENT_RESPONSES'
    WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 THEN 'MISSING_USER_RESPONSES'
    WHEN COUNT(*) = 0 THEN 'NO_UTTERANCES'
    ELSE 'COMPLETE'
    END as data_status,
  CASE 
    WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 THEN '❌ PHASE 2 FIX NOT WORKING'
    WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 THEN '❌ USER LOGGING ISSUE'
    WHEN COUNT(*) = 0 THEN '❌ NO CONVERSATION DATA'
    ELSE '✅ PHASE 2 FIX WORKING'
  END as phase2_status
FROM interviews i
LEFT JOIN utterances u ON i.id = u.interview_id
WHERE i.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY i.id, i.interviewer_name, i.status, i.created_at
ORDER BY i.created_at DESC;

-- 3. UTTERANCE LOGGING SUCCESS RATE
SELECT 
  'UTTERANCE LOGGING SUCCESS RATE' as section,
  COUNT(*) as total_utterances,
  COUNT(CASE WHEN speaker = 'USER' THEN 1 END) as user_utterances,
  COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) as agent_utterances,
  ROUND(
    (COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END)::float / 
     GREATEST(COUNT(CASE WHEN speaker = 'USER' THEN 1 END), 1)::float) * 100, 2
  ) as agent_response_ratio_percent,
  CASE 
    WHEN COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) >= COUNT(CASE WHEN speaker = 'USER' THEN 1 END) * 0.8 THEN '✅ EXCELLENT LOGGING SUCCESS'
    WHEN COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) >= COUNT(CASE WHEN speaker = 'USER' THEN 1 END) * 0.6 THEN '⚠️ GOOD LOGGING SUCCESS'
    ELSE '❌ POOR LOGGING SUCCESS'
  END as logging_quality
FROM utterances u
JOIN interviews i ON u.interview_id = i.id
WHERE i.created_at >= NOW() - INTERVAL '24 hours';

