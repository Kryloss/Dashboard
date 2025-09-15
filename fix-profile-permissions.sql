-- Quick fix for profile/goals permission issues
-- Run this in Supabase SQL Editor

-- Drop all existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON user_goals;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_goals;

-- Create simple, working policies
CREATE POLICY "Allow authenticated users full access to own profile"
ON user_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users full access to own goals"
ON user_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify tables exist and RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;