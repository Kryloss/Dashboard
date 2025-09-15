-- Test authentication context in Supabase
-- This will help us understand why RLS is still blocking

-- 1. Check current auth state (will be null in SQL editor, but shows the functions work)
SELECT
    'Auth Functions Test' as test,
    auth.uid() as current_user_id,
    auth.email() as current_email;

-- 2. Check if policies exist and are correct
SELECT
    'Current Policies' as test,
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    SUBSTRING(qual, 1, 100) as condition_preview
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals')
ORDER BY tablename, policyname;

-- 3. Test if we can insert/select with a mock user context
-- (This simulates what your app should be doing)
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "test-user-id", "email": "test@example.com"}';

-- Try to test the RLS policies (this might fail but will show us the exact error)
DO $$
BEGIN
    -- This should work if policies are correct
    PERFORM 1 FROM user_profiles WHERE user_id = 'test-user-id' LIMIT 1;
    RAISE NOTICE 'RLS test passed - policies allow access';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'RLS test failed: %', SQLERRM;
END $$;

-- Reset role
RESET role;

-- 4. Alternative: Temporarily disable RLS to test if that's the issue
-- UNCOMMENT THESE LINES TO TEST:
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_goals DISABLE ROW LEVEL SECURITY;
--
-- After testing, re-enable with:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;