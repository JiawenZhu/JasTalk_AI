-- 🔍 Complete Table Analysis Script for JasTalk AI
-- This script analyzes ALL tables in the project to understand what data needs restoration

-- 1. Analyze public schema tables
SELECT 
    'public' as schema_name,
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables t2 WHERE t2.table_schema = 'public' AND t2.table_name = t1.table_name) as table_exists,
    (SELECT COUNT(*) FROM public."' || table_name || '"') as record_count
FROM information_schema.tables t1 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check auth schema tables
SELECT 
    'auth' as schema_name,
    table_name,
    'auth_system' as table_type,
    'managed_by_supabase' as notes
FROM information_schema.tables 
WHERE table_schema = 'auth' 
ORDER BY table_name;

-- 3. Check storage schema tables
SELECT 
    'storage' as schema_name,
    table_name,
    'storage_system' as table_type,
    'managed_by_supabase' as notes
FROM information_schema.tables 
WHERE table_schema = 'storage' 
ORDER BY table_name;

-- 4. Check table relationships and foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 5. Check which tables have data and which are empty
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC, tablename;
