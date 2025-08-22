-- PHASE 3: Mark Irrecoverable Data (FIXED - Using 'paused' instead of 'incomplete')
-- Run this THIRD to mark interviews that cannot be recovered
-- ⚠️ WARNING: This will UPDATE interview statuses

-- 1. MARK INTERVIEWS WITH MISSING AI RESPONSES AS PAUSED
UPDATE interviews 
SET status = 'paused'
WHERE id IN (
  SELECT i.id
  FROM interviews i
  LEFT JOIN utterances u ON i.id = u.interview_id
  WHERE i.status NOT IN ('paused', 'completed')  -- Skip already marked
  GROUP BY i.id
  HAVING COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 
     AND COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) > 0
);

-- 2. MARK INTERVIEWS WITH NO UTTERANCES AS PAUSED
UPDATE interviews 
SET status = 'paused'
WHERE id IN (
  SELECT i.id
  FROM interviews i
  LEFT JOIN utterances u ON i.id = u.interview_id
  WHERE i.status NOT IN ('paused', 'completed')  -- Skip already marked
  GROUP BY i.id
  HAVING COUNT(*) = 0
);

-- 3. VERIFY RECOVERY RESULTS
SELECT 
  'RECOVERY VERIFICATION' as section,
  COUNT(*) as total_interviews,
  COUNT(CASE WHEN status = 'paused' THEN 1 END) as marked_paused,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_interviews,
  COUNT(CASE WHEN status NOT IN ('paused', 'completed') THEN 1 END) as other_status,
  ROUND(
    (COUNT(CASE WHEN status = 'completed' THEN 1 END)::NUMERIC / 
     GREATEST(COUNT(*), 1)::NUMERIC) * 100, 2
  ) as completed_percentage
FROM interviews;

-- 4. DETAILED STATUS BREAKDOWN
SELECT 
  'DETAILED STATUS BREAKDOWN' as section,
  status,
  COUNT(*) as interview_count,
  ROUND(
    (COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM interviews)::NUMERIC) * 100, 2
  ) as percentage
FROM interviews 
GROUP BY status 
ORDER BY interview_count DESC;
