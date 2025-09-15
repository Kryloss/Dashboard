-- Debug authentication issues with save operations
-- Run this in Supabase SQL Editor WHILE LOGGED INTO YOUR APP

-- Check current auth context
SELECT
    'Auth Debug' as test_type,
    CASE
        WHEN auth.uid() IS NULL THEN 'ERROR: No auth.uid() - not authenticated'
        ELSE 'SUCCESS: User authenticated'
    END as auth_status,
    COALESCE(auth.uid()::text, 'NULL') as user_id,
    COALESCE(auth.email(), 'NULL') as email,
    COALESCE(auth.role(), 'NULL') as role;

-- Check if tables exist and have correct structure
SELECT
    'Table Structure' as test_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('user_profiles', 'user_goals')
AND column_name = 'user_id'
ORDER BY table_name;

-- Check RLS policies
SELECT
    'RLS Policies' as test_type,
    tablename,
    policyname,
    cmd,
    qual as condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals');

-- Test actual permissions with current user
DO $$
DECLARE
    current_user_id uuid;
    test_result text;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE NOTICE 'FAILED: Not authenticated - sign into your app first';
        RETURN;
    END IF;

    RAISE NOTICE 'Testing with user ID: %', current_user_id;

    -- Test SELECT on user_profiles
    BEGIN
        PERFORM 1 FROM user_profiles WHERE user_id = current_user_id LIMIT 1;
        RAISE NOTICE 'SUCCESS: Can read from user_profiles';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: Cannot read user_profiles - %', SQLERRM;
    END;

    -- Test INSERT/UPSERT on user_profiles
    BEGIN
        INSERT INTO user_profiles (user_id, weight, age)
        VALUES (current_user_id, 70, 25)
        ON CONFLICT (user_id) DO UPDATE SET
            weight = EXCLUDED.weight,
            age = EXCLUDED.age;
        RAISE NOTICE 'SUCCESS: Can upsert into user_profiles';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: Cannot upsert user_profiles - %', SQLERRM;
    END;

    -- Test SELECT on user_goals
    BEGIN
        PERFORM 1 FROM user_goals WHERE user_id = current_user_id LIMIT 1;
        RAISE NOTICE 'SUCCESS: Can read from user_goals';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: Cannot read user_goals - %', SQLERRM;
    END;

    -- Test INSERT/UPSERT on user_goals
    BEGIN
        INSERT INTO user_goals (user_id, daily_exercise_minutes, weekly_exercise_sessions)
        VALUES (current_user_id, 30, 3)
        ON CONFLICT (user_id) DO UPDATE SET
            daily_exercise_minutes = EXCLUDED.daily_exercise_minutes,
            weekly_exercise_sessions = EXCLUDED.weekly_exercise_sessions;
        RAISE NOTICE 'SUCCESS: Can upsert into user_goals';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: Cannot upsert user_goals - %', SQLERRM;
    END;

END $$;

-- Final summary
SELECT
    'Summary' as test_type,
    CASE
        WHEN auth.uid() IS NULL THEN
            'ERROR: Authentication required. Please:\n1. Sign into your app\n2. Keep the tab open\n3. Run this script again'
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
            'ERROR: No RLS policies found. Run fix-existing-policies.sql first'
        ELSE
            'Check the NOTICE messages above for specific permission test results'
    END as diagnosis;