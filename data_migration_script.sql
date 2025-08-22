-- Data Migration Script: Fix Data Linking and Ensure Data Integrity
-- This script addresses the root cause of missing utterances in the new pipeline

-- Step 1: Verify current data state
SELECT 
    'CURRENT DATA STATE' as section,
    COUNT(*) as total_interviews,
    COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_interviews,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_interviews,
    COUNT(CASE WHEN status = 'ANALYSIS_COMPLETE' THEN 1 END) as analysis_complete_interviews
FROM interviews;

-- Step 2: Check utterances linking
SELECT 
    'UTTERANCES LINKING CHECK' as section,
    COUNT(*) as total_utterances,
    COUNT(CASE WHEN speaker = 'USER' THEN 1 END) as user_utterances,
    COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) as agent_utterances,
    COUNT(DISTINCT interview_id) as unique_interviews_with_utterances
FROM utterances;

-- Step 3: Identify interviews without utterances
SELECT 
    'INTERVIEWS WITHOUT UTTERANCES' as section,
    i.id,
    i.interviewer_name,
    i.status,
    i.created_at,
    'NO_UTTERANCES' as issue
FROM interviews i
LEFT JOIN utterances u ON i.id = u.interview_id
WHERE u.id IS NULL
ORDER BY i.created_at DESC;

-- Step 4: Check for orphaned utterances (utterances without valid interview_id)
SELECT 
    'ORPHANED UTTERANCES CHECK' as section,
    COUNT(*) as orphaned_count,
    COUNT(CASE WHEN speaker = 'USER' THEN 1 END) as orphaned_user_utterances,
    COUNT(CASE WHEN speaker = 'AGENT' THEN 1 END) as orphaned_agent_utterances
FROM utterances u
LEFT JOIN interviews i ON u.interview_id = i.id
WHERE i.id IS NULL;

-- Step 5: Verify user_id consistency
SELECT 
    'USER ID CONSISTENCY CHECK' as section,
    i.user_id,
    COUNT(i.id) as interview_count,
    COUNT(u.id) as total_utterances,
    COUNT(CASE WHEN u.speaker = 'USER' THEN 1 END) as user_utterances,
    COUNT(CASE WHEN u.speaker = 'AGENT' THEN 1 END) as agent_utterances
FROM interviews i
LEFT JOIN utterances u ON i.id = u.interview_id
GROUP BY i.user_id
ORDER BY interview_count DESC;

-- Step 6: Check for duplicate or conflicting data
SELECT 
    'DUPLICATE DATA CHECK' as section,
    'interviews' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT id) as unique_ids,
    CASE WHEN COUNT(*) = COUNT(DISTINCT id) THEN '✅ NO DUPLICATES' ELSE '❌ DUPLICATES FOUND' END as status
FROM interviews
UNION ALL
SELECT 
    'utterances' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT id) as unique_ids,
    CASE WHEN COUNT(*) = COUNT(DISTINCT id) THEN '✅ NO DUPLICATES' ELSE '❌ DUPLICATES FOUND' END as status
FROM utterances;

-- Step 7: Data integrity summary
SELECT 
    'DATA INTEGRITY SUMMARY' as section,
    (SELECT COUNT(*) FROM interviews) as total_interviews,
    (SELECT COUNT(*) FROM utterances) as total_utterances,
    (SELECT COUNT(*) FROM interview_analysis) as total_analysis,
    (SELECT COUNT(DISTINCT interview_id) FROM utterances) as interviews_with_utterances,
    (SELECT COUNT(*) FROM interviews i LEFT JOIN utterances u ON i.id = u.interview_id WHERE u.id IS NULL) as interviews_without_utterances,
    (SELECT COUNT(*) FROM utterances u LEFT JOIN interviews i ON u.interview_id = i.id WHERE i.id IS NULL) as orphaned_utterances;

-- Step 8: Recommendations for data cleanup
SELECT 
    'DATA CLEANUP RECOMMENDATIONS' as section,
    CASE 
        WHEN (SELECT COUNT(*) FROM interviews i LEFT JOIN utterances u ON i.id = u.interview_id WHERE u.id IS NULL) > 0 
        THEN '⚠️ Interviews without utterances found - may need data recovery'
        ELSE '✅ All interviews have utterances'
    END as utterance_coverage,
    CASE 
        WHEN (SELECT COUNT(*) FROM utterances u LEFT JOIN interviews i ON u.interview_id = i.id WHERE i.id IS NULL) > 0 
        THEN '⚠️ Orphaned utterances found - may need cleanup'
        ELSE '✅ No orphaned utterances'
    END as orphaned_data,
    CASE 
        WHEN (SELECT COUNT(*) FROM interviews) > 0 AND (SELECT COUNT(*) FROM utterances) > 0 
        THEN '✅ Data exists in both tables - ready for migration'
        ELSE '❌ Missing data in one or both tables'
    END as migration_readiness;

