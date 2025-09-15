-- Re-enable RLS since disabling didn't fix the issue
-- The problem is authentication, not policies

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Verify RLS is back on
SELECT 'RLS Re-enabled' as status,
       tablename,
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals');