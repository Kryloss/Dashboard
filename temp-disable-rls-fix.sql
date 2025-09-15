-- TEMPORARY fix to disable RLS and test if authentication is the issue
-- This is ONLY for testing - re-enable RLS after confirming it works

-- Temporarily disable RLS to test if the save operations work
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals DISABLE ROW LEVEL SECURITY;

-- Test that tables exist and are accessible
SELECT 'RLS Status' as test,
       tablename,
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals');

-- After testing if saves work, RE-ENABLE RLS with this:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;