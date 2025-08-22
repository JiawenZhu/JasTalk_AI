-- Phase 3 Script 3: Mark Irrecoverable Data (FIXED V2)
-- This script marks interviews that cannot be recovered as IN_PROGRESS
-- and adds metadata about the data integrity issues

-- Step 1: Mark interviews with missing AI responses as IN_PROGRESS
-- This preserves the interview while indicating it needs attention
UPDATE interviews 
SET 
    status = 'IN_PROGRESS',
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT i.id
    FROM interviews i
    LEFT JOIN utterances u_agent ON i.id = u_agent.interview_id AND u_agent.speaker = 'AGENT'
    LEFT JOIN utterances u_user ON i.id = u_user.interview_id AND u_user.speaker = 'USER'
    WHERE u_agent.id IS NULL  -- No AI responses
    AND u_user.id IS NOT NULL -- Has user responses
    AND i.status NOT IN ('IN_PROGRESS', 'COMPLETED')
);

-- Step 2: Verify the update worked
SELECT 
    'RECOVERY VERIFICATION' as section,
    COUNT(*) as total_interviews,
    COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as marked_in_progress,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_interviews,
    COUNT(CASE WHEN status NOT IN ('IN_PROGRESS', 'COMPLETED') THEN 1 END) as other_status,
    ROUND((COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1) AS completion_percentage
FROM interviews;

-- Step 3: Show detailed status breakdown
SELECT 
    'DETAILED STATUS BREAKDOWN' as section,
    status,
    COUNT(*) as interview_count,
    ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*)::NUMERIC FROM interviews)) * 100, 1) as percentage
FROM interviews
GROUP BY status
ORDER BY interview_count DESC;

