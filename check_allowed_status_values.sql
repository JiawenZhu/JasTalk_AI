-- Check what status values are actually allowed in the interviews table
-- Run this first to understand the constraint

-- 1. Check the check constraint definition
SELECT 
  'CHECK CONSTRAINT INFO' as section,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'interviews'::regclass 
  AND contype = 'c';

-- 2. Check current status values in the table
SELECT 
  'CURRENT STATUS VALUES' as section,
  status,
  COUNT(*) as count
FROM interviews 
GROUP BY status 
ORDER BY count DESC;

-- 3. Try to see what the constraint allows
SELECT 
  'CONSTRAINT ANALYSIS' as section,
  'interviews_status_check' as constraint_name,
  'Need to see what values are allowed' as note;

