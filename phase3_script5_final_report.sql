-- PHASE 3: Final Status Report (FIXED - No metadata column)
-- Run this FIFTH to get comprehensive final status

-- 1. POST-RECOVERY STATUS OF ALL INTERVIEWS
SELECT 
  'POST-RECOVERY STATUS' as section,
  i.id as interview_id,
  i.interviewer_name,
  i.status,
  i.created_at,
  COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) as user_utterances,
  COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) as agent_utterances,
  COUNT(*) as total_utterances,
  CASE 
    WHEN i.status = 'incomplete' THEN 'MARKED_INCOMPLETE'
    WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 THEN 'STILL_MISSING_AGENT'
    WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 THEN 'STILL_MISSING_USER'
    WHEN COUNT(*) = 0 THEN 'STILL_NO_UTTERANCES'
    ELSE 'COMPLETE'
  END as current_data_status
FROM interviews i
LEFT JOIN utterances u ON i.id = u.interview_id
GROUP BY i.id, i.interviewer_name, i.status, i.created_at
ORDER BY i.created_at DESC;

-- 2. RECOVERY SUMMARY
SELECT 
  'RECOVERY SUMMARY' as section,
  COUNT(*) as total_interviews,
  COUNT(CASE WHEN status = 'incomplete' THEN 1 END) as incomplete_interviews,
  COUNT(CASE WHEN status != 'incomplete' THEN 1 END) as active_interviews,
  ROUND(
    (COUNT(CASE WHEN status != 'incomplete' THEN 1 END)::float / 
     GREATEST(COUNT(*), 1)::float) * 100, 2
  ) as active_integrity_percentage
FROM interviews;

-- 3. PHASE 2 FIX VALIDATION SUMMARY
SELECT 
  'PHASE 2 VALIDATION SUMMARY' as section,
  CASE 
    WHEN new_integrity >= 95 THEN '✅ EXCELLENT - Phase 2 fix working perfectly'
    WHEN new_integrity >= 80 THEN '⚠️ GOOD - Phase 2 fix mostly working'
    WHEN new_integrity >= 60 THEN '❌ POOR - Phase 2 fix partially working'
    ELSE '❌ FAILED - Phase 2 fix not working'
  END as phase2_effectiveness,
  new_integrity as new_interview_integrity_percent,
  old_integrity as old_interview_integrity_percent,
  improvement as improvement_percentage,
  CASE 
    WHEN improvement > 20 THEN '🚀 SIGNIFICANT IMPROVEMENT'
    WHEN improvement > 10 THEN '📈 MODERATE IMPROVEMENT'
    WHEN improvement > 0 THEN '📊 SLIGHT IMPROVEMENT'
    ELSE '📉 NO IMPROVEMENT'
  END as improvement_status
FROM (
  SELECT 
    -- New interviews (last 24h) integrity
    ROUND(
      (COUNT(CASE WHEN new_data_status = 'COMPLETE' THEN 1 END)::float / 
       GREATEST(COUNT(*), 1)::float) * 100, 2
    ) as new_integrity,
    
    -- Old interviews (7 days ago) integrity
    ROUND(
      (COUNT(CASE WHEN old_data_status = 'COMPLETE' THEN 1 END)::float / 
       GREATEST(COUNT(*), 1)::float) * 100, 2
    ) as old_integrity,
    
    -- Improvement calculation
    ROUND(
      ((COUNT(CASE WHEN new_data_status = 'COMPLETE' THEN 1 END)::float / 
        GREATEST(COUNT(*), 1)::float) * 100) -
       ((COUNT(CASE WHEN old_data_status = 'COMPLETE' THEN 1 END)::float / 
         GREATEST(COUNT(*), 1)::float) * 100), 2
    ) as improvement
  FROM (
    -- New interviews data
    SELECT 
      'new' as period,
      CASE 
        WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 THEN 'MISSING_AGENT_RESPONSES'
        WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 THEN 'MISSING_USER_RESPONSES'
        WHEN COUNT(*) = 0 THEN 'NO_UTTERANCES'
        ELSE 'COMPLETE'
      END as new_data_status,
      'COMPLETE' as old_data_status  -- Placeholder for comparison
    FROM interviews i
    LEFT JOIN utterances u ON i.id = u.interview_id
    WHERE i.created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY i.id
    
    UNION ALL
    
    -- Old interviews data
    SELECT 
      'old' as period,
      'COMPLETE' as new_data_status,  -- Placeholder for comparison
      CASE 
        WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 THEN 'MISSING_AGENT_RESPONSES'
        WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 THEN 'MISSING_USER_RESPONSES'
        WHEN COUNT(*) = 0 THEN 'NO_UTTERANCES'
        ELSE 'COMPLETE'
      END as old_data_status
    FROM interviews i
    LEFT JOIN utterances u ON i.id = u.interview_id
    WHERE i.created_at >= NOW() - INTERVAL '7 days'
      AND i.created_at < NOW() - INTERVAL '24 hours'
    GROUP BY i.id
  ) comparison_data
) validation_summary;

