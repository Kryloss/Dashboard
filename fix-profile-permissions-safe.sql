-- Safe fix for profile/goals permission issues
-- Run this in Supabase SQL Editor

-- Drop ALL possible existing policies (comprehensive cleanup)
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

-- Create brand new policies with unique names
CREATE POLICY "profile_access_policy_v2"
ON user_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_access_policy_v2"
ON user_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Verify the setup
SELECT
    'Setup Complete' as status,
    'Tables: ' || COUNT(*) as result
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_profiles', 'user_goals');