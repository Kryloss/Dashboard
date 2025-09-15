-- Complete fix for session expiry issues in workout settings
-- Run this in Supabase SQL Editor

-- First, check current state
SELECT
    'Current State Check' as info,
    t.tablename,
    CASE WHEN t.rowsecurity THEN 'RLS ENABLED' ELSE 'RLS DISABLED' END as rls_status,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
AND t.tablename IN ('user_profiles', 'user_goals')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "profile_access_policy_v2" ON user_profiles;
DROP POLICY IF EXISTS "goals_access_policy_v2" ON user_goals;
DROP POLICY IF EXISTS "user_profiles_full_access_v3" ON user_profiles;
DROP POLICY IF EXISTS "user_goals_full_access_v3" ON user_goals;
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

-- Ensure tables exist with proper structure
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2),
    age INTEGER,
    height DECIMAL(5,2),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    height_unit VARCHAR(10) DEFAULT 'cm',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_goals (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_exercise_minutes INTEGER DEFAULT 30,
    weekly_exercise_sessions INTEGER DEFAULT 3,
    daily_calories INTEGER DEFAULT 2000,
    activity_level VARCHAR(20) DEFAULT 'moderate',
    sleep_hours DECIMAL(3,1) DEFAULT 8.0,
    recovery_minutes INTEGER DEFAULT 60,
    starting_weight DECIMAL(5,2),
    goal_weight DECIMAL(5,2),
    diet_type VARCHAR(20) DEFAULT 'maintenance',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create simple, effective RLS policies
CREATE POLICY "user_profiles_policy_v4"
ON user_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_goals_policy_v4"
ON user_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
SELECT
    'Final Verification' as status,
    tablename,
    policyname,
    cmd as operation,
    CASE WHEN qual IS NOT NULL THEN 'USING: ' || qual ELSE 'No USING clause' END as using_clause,
    CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check ELSE 'No WITH CHECK clause' END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals')
ORDER BY tablename, policyname;

-- Test the policies (only works if authenticated)
DO $$
DECLARE
    current_user_id uuid;
    test_result text;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'Not authenticated - sign into your app to test permissions';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing permissions for user: %', current_user_id;
    
    -- Test user_profiles permissions
    BEGIN
        -- Test INSERT
        INSERT INTO user_profiles (user_id, weight, age) 
        VALUES (current_user_id, 70.0, 25)
        ON CONFLICT (user_id) DO UPDATE SET weight = EXCLUDED.weight, age = EXCLUDED.age;
        RAISE NOTICE 'SUCCESS: Can upsert user_profiles';
        
        -- Test SELECT
        PERFORM 1 FROM user_profiles WHERE user_id = current_user_id LIMIT 1;
        RAISE NOTICE 'SUCCESS: Can read user_profiles';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: user_profiles error - %', SQLERRM;
    END;
    
    -- Test user_goals permissions
    BEGIN
        -- Test INSERT
        INSERT INTO user_goals (user_id, daily_exercise_minutes, weekly_exercise_sessions) 
        VALUES (current_user_id, 30, 3)
        ON CONFLICT (user_id) DO UPDATE SET 
            daily_exercise_minutes = EXCLUDED.daily_exercise_minutes,
            weekly_exercise_sessions = EXCLUDED.weekly_exercise_sessions;
        RAISE NOTICE 'SUCCESS: Can upsert user_goals';
        
        -- Test SELECT
        PERFORM 1 FROM user_goals WHERE user_id = current_user_id LIMIT 1;
        RAISE NOTICE 'SUCCESS: Can read user_goals';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: user_goals error - %', SQLERRM;
    END;
    
    RAISE NOTICE 'Permission test completed. Check results above.';
    
END $$;

-- Final status
SELECT
    'Setup Complete' as status,
    'user_profiles' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles') 
         THEN 'Policies: OK' 
         ELSE 'Policies: MISSING' END as policy_status,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles' AND rowsecurity = true)
         THEN 'RLS: ENABLED' 
         ELSE 'RLS: DISABLED' END as rls_status

UNION ALL

SELECT
    'Setup Complete' as status,
    'user_goals' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_goals') 
         THEN 'Policies: OK' 
         ELSE 'Policies: MISSING' END as policy_status,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_goals' AND rowsecurity = true)
         THEN 'RLS: ENABLED' 
         ELSE 'RLS: DISABLED' END as rls_status;
