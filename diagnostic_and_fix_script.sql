-- PHASE 3: Diagnostic and Fix Script
-- This script will diagnose the constraint issue and fix it step by step

-- STEP 1: Check what status values are currently allowed
SELECT 
  'STEP 1: CURRENT STATUS VALUES' as section,
  status,
  COUNT(*) as count
FROM interviews 
GROUP BY status 
ORDER BY count DESC;

-- STEP 2: Check the constraint definition
SELECT 
  'STEP 2: CONSTRAINT DEFINITION' as section,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'interviews'::regclass 
  AND contype = 'c';

-- STEP 3: Try to find a valid status value by testing
-- Let's see what happens when we try to update to different values
SELECT 
  'STEP 3: STATUS VALUE TESTING' as section,
  'Testing what status values are allowed' as note;

-- STEP 4: Check if we can use 'active' instead of 'paused'
SELECT 
  'STEP 4: ALTERNATIVE STATUS CHECK' as section,
  'active' as suggested_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM interviews WHERE status = 'active'
    ) THEN '✅ VALID - already used in table'
    ELSE '❌ UNKNOWN - not currently used'
  END as status_validity;

-- STEP 5: Check if we can use 'in_progress' instead
SELECT 
  'STEP 5: ANOTHER ALTERNATIVE STATUS' as section,
  'in_progress' as suggested_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM interviews WHERE status = 'in_progress'
    ) THEN '✅ VALID - already used in table'
    ELSE '❌ UNKNOWN - not currently used'
  END as status_validity;

-- STEP 6: Check if we can use 'pending' instead
SELECT 
  'STEP 6: PENDING STATUS CHECK' as section,
  'pending' as suggested_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM interviews WHERE status = 'pending'
    ) THEN '✅ VALID - already used in table'
    ELSE '❌ UNKNOWN - not currently used'
  END as status_validity;

-- STEP 7: Show all possible status values from the constraint
-- This will help us understand what's allowed
SELECT 
  'STEP 7: CONSTRAINT ANALYSIS' as section,
  'Need to see the actual constraint definition above' as note;

