-- Fix for existing RLS policies that are causing save failures
-- Run this in Supabase SQL Editor

-- First check what policies currently exist
SELECT
    'Current Policies' as info,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals')
ORDER BY tablename, policyname;

-- Drop the existing v2 policies if they exist
DROP POLICY IF EXISTS "profile_access_policy_v2" ON user_profiles;
DROP POLICY IF EXISTS "goals_access_policy_v2" ON user_goals;

-- Drop any other conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users full access to own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON user_goals;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_goals;
DROP POLICY IF EXISTS "Allow authenticated users full access to own goals" ON user_goals;

-- Create new comprehensive policies with unique names
CREATE POLICY "user_profiles_full_access_v3"
ON user_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_goals_full_access_v3"
ON user_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Verify the new setup
SELECT
    'New Policies Created' as status,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals')
AND policyname LIKE '%v3'
ORDER BY tablename, policyname;

-- Test permissions (only works if you're authenticated in the app)
DO $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        -- Test basic read access
        PERFORM 1 FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
        PERFORM 1 FROM user_goals WHERE user_id = auth.uid() LIMIT 1;
        RAISE NOTICE 'Permission test PASSED - Save operations should now work';
    ELSE
        RAISE NOTICE 'Not authenticated - sign into your app first to test';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Permission test FAILED: %', SQLERRM;
END $$;