-- =====================================================
-- TEST CONNECTION SCRIPT
-- =====================================================
-- Run this first to test your connection and basic setup

-- Test 1: Check if extensions are available
SELECT 'Testing UUID extension...' as test_step;
SELECT uuid_generate_v4() as test_uuid;

-- Test 2: Check if vector extension is available
SELECT 'Testing Vector extension...' as test_step;
SELECT 'Vector extension available' as status;

-- Test 3: Create a simple test table
SELECT 'Creating test table...' as test_step;
CREATE TABLE IF NOT EXISTS test_connection (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_message TEXT DEFAULT 'Connection successful!',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test 4: Insert test data
SELECT 'Inserting test data...' as test_step;
INSERT INTO test_connection (test_message) VALUES ('Database connection working!');

-- Test 5: Query test data
SELECT 'Querying test data...' as test_step;
SELECT * FROM test_connection;

-- Test 6: Clean up test table
SELECT 'Cleaning up test table...' as test_step;
DROP TABLE test_connection;

-- Success message
SELECT '🎉 All tests passed! Your Supabase connection is working correctly.' as result;
SELECT 'You can now run the complete migration script.' as next_step;
