-- Check valid status values and constraints on interviews table
-- Run this to see what status values are allowed

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

-- 3. Check if we can use a different status value
SELECT 
  'ALTERNATIVE STATUS CHECK' as section,
  'paused' as suggested_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM interviews WHERE status = 'paused'
    ) THEN '✅ VALID - already used in table'
    ELSE '❌ UNKNOWN - not currently used'
  END as status_validity;

-- 4. Show table structure for status field
SELECT 
  'TABLE STRUCTURE' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'interviews' 
  AND column_name = 'status';

