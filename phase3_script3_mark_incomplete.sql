-- PHASE 3: Mark Irrecoverable Data (FIXED - No metadata column)
-- Run this THIRD to mark interviews that cannot be recovered
-- ⚠️ WARNING: This will UPDATE interview statuses

-- 1. MARK INTERVIEWS WITH MISSING AI RESPONSES AS INCOMPLETE
UPDATE interviews 
SET status = 'incomplete'
WHERE id IN (
  SELECT i.id
  FROM interviews i
  LEFT JOIN utterances u ON i.id = u.interview_id
  WHERE i.status != 'incomplete'
  GROUP BY i.id
  HAVING COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) = 0 
     AND COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) > 0
);

-- 2. MARK INTERVIEWS WITH NO UTTERANCES AS INCOMPLETE
UPDATE interviews 
SET status = 'incomplete'
WHERE id IN (
  SELECT i.id
  FROM interviews i
  LEFT JOIN utterances u ON i.id = u.interview_id
  WHERE i.status != 'incomplete'
  GROUP BY i.id
  HAVING COUNT(*) = 0
);

-- 3. VERIFY RECOVERY RESULTS
SELECT 
  'RECOVERY VERIFICATION' as section,
  COUNT(*) as total_interviews,
  COUNT(CASE WHEN status = 'incomplete' THEN 1 END) as marked_incomplete,
  COUNT(CASE WHEN status != 'incomplete' THEN 1 END) as remaining_active,
  ROUND(
    (COUNT(CASE WHEN status != 'incomplete' THEN 1 END)::float / 
     GREATEST(COUNT(*), 1)::float) * 100, 2
  ) as active_integrity_percentage
FROM interviews;

