-- PHASE 3: Initial Assessment & Analysis
-- Run this FIRST to understand the scope of incomplete interviews

-- 1. COMPREHENSIVE INCOMPLETE INTERVIEWS ANALYSIS
WITH interview_data_integrity AS (
  SELECT 
    i.id,
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
      WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 THEN 'CRITICAL'
      WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 THEN 'CRITICAL'
      WHEN COUNT(*) = 0 THEN 'CRITICAL'
      ELSE 'HEALTHY'
    END as severity
  FROM interviews i
  LEFT JOIN utterances u ON i.id = u.interview_id
  GROUP BY i.id, i.interviewer_name, i.status, i.created_at
)
SELECT 
  'COMPREHENSIVE ANALYSIS' as section,
  COUNT(*) as total_interviews,
  COUNT(CASE WHEN data_status = 'COMPLETE' THEN 1 END) as complete_interviews,
  COUNT(CASE WHEN data_status = 'MISSING_AGENT_RESPONSES' THEN 1 END) as missing_agent,
  COUNT(CASE WHEN data_status = 'MISSING_USER_RESPONSES' THEN 1 END) as missing_user,
  COUNT(CASE WHEN data_status = 'NO_UTTERANCES' THEN 1 END) as no_utterances,
  ROUND(
    (COUNT(CASE WHEN data_status = 'COMPLETE' THEN 1 END)::float / 
     GREATEST(COUNT(*), 1)::float) * 100, 2
  ) as data_integrity_percentage
FROM interview_data_integrity;

-- 2. DETAILED LIST OF INCOMPLETE INTERVIEWS
SELECT 
  'INCOMPLETE INTERVIEWS DETAIL' as section,
  id as interview_id,
  interviewer_name,
  status,
  created_at,
  user_utterances,
  agent_utterances,
  total_utterances,
  data_status,
  severity,
  CASE 
    WHEN data_status = 'MISSING_AGENT_RESPONSES' THEN 'AI responses not logged - may be recoverable'
    WHEN data_status = 'MISSING_USER_RESPONSES' THEN 'User responses not logged - likely unrecoverable'
    WHEN data_status = 'NO_UTTERANCES' THEN 'No conversation data - may be test interviews'
    ELSE 'Unknown issue'
  END as recovery_note
FROM (
  SELECT 
    i.id,
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
      WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 THEN 'CRITICAL'
      WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 THEN 'CRITICAL'
      WHEN COUNT(*) = 0 THEN 'CRITICAL'
      ELSE 'HEALTHY'
    END as severity
  FROM interviews i
  LEFT JOIN utterances u ON i.id = u.interview_id
  GROUP BY i.id, i.interviewer_name, i.status, i.created_at
) integrity_check
WHERE data_status != 'COMPLETE'
ORDER BY created_at DESC, severity DESC;

-- 3. RECOVERY FEASIBILITY ASSESSMENT
SELECT 
  'RECOVERY FEASIBILITY' as section,
  data_status,
  COUNT(*) as interview_count,
  CASE 
    WHEN data_status = 'MISSING_AGENT_RESPONSES' THEN 'HIGH - AI responses may be in logs or recoverable'
    WHEN data_status = 'MISSING_USER_RESPONSES' THEN 'LOW - User speech not captured, likely unrecoverable'
    WHEN data_status = 'NO_UTTERANCES' THEN 'MEDIUM - May be test interviews or failed sessions'
    ELSE 'UNKNOWN'
  END as recovery_likelihood,
  CASE 
    WHEN data_status = 'MISSING_AGENT_RESPONSES' THEN 'Check application logs, AI provider logs, localStorage backups'
    WHEN data_status = 'MISSING_USER_RESPONSES' THEN 'Check speech recognition logs, microphone permissions'
    WHEN data_status = 'NO_UTTERANCES' THEN 'Check interview creation logs, WebSocket connection status'
    ELSE 'Investigate further'
  END as recovery_strategy
FROM (
  SELECT 
    CASE 
      WHEN COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 THEN 'MISSING_AGENT_RESPONSES'
      WHEN COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) = 0 THEN 'MISSING_USER_RESPONSES'
      WHEN COUNT(*) = 0 THEN 'NO_UTTERANCES'
      ELSE 'COMPLETE'
    END as data_status
  FROM interviews i
  LEFT JOIN utterances u ON i.id = u.interview_id
  GROUP BY i.id
) integrity_check
WHERE data_status != 'COMPLETE'
GROUP BY data_status
ORDER BY interview_count DESC;

