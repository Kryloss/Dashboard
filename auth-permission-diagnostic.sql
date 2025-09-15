-- Authentication and Permission Diagnostic Script
-- Run this in Supabase SQL Editor to diagnose the permission issue

-- ============================================================================
-- 1. CHECK CURRENT AUTHENTICATION
-- ============================================================================

SELECT
    'Current Auth Status' as check_type,
    CASE
        WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED'
        ELSE 'AUTHENTICATED'
    END as status,
    COALESCE(auth.uid()::text, 'No user ID') as user_id,
    COALESCE(auth.email(), 'No email') as email;

-- ============================================================================
-- 2. CHECK IF TABLES EXIST
-- ============================================================================

SELECT
    'Table Existence Check' as check_type,
    t.table_name,
    CASE WHEN ist.table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (
    SELECT 'user_profiles' as table_name
    UNION ALL
    SELECT 'user_goals' as table_name
) t
LEFT JOIN information_schema.tables ist ON (
    ist.table_schema = 'public'
    AND ist.table_name = t.table_name
);

-- ============================================================================
-- 3. CHECK RLS STATUS
-- ============================================================================

SELECT
    'RLS Status Check' as check_type,
    schemaname,
    tablename,
    CASE
        WHEN rowsecurity = true THEN 'ENABLED'
        ELSE 'DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals')
ORDER BY tablename;

-- ============================================================================
-- 4. CHECK POLICIES
-- ============================================================================

SELECT
    'Policy Check' as check_type,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals')
ORDER BY tablename, policyname;

-- ============================================================================
-- 5. TEST PERMISSIONS (if authenticated)
-- ============================================================================

-- Only run if authenticated
DO $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        -- Test if we can read from user_profiles
        PERFORM COUNT(*) FROM user_profiles WHERE user_id = auth.uid();
        RAISE NOTICE 'user_profiles read permission: OK';

        -- Test if we can read from user_goals
        PERFORM COUNT(*) FROM user_goals WHERE user_id = auth.uid();
        RAISE NOTICE 'user_goals read permission: OK';

    ELSE
        RAISE NOTICE 'Cannot test permissions - not authenticated';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Permission test failed: %', SQLERRM;
END $$;

-- ============================================================================
-- 6. SUMMARY AND RECOMMENDATIONS
-- ============================================================================

SELECT
    'Summary' as section,
    CASE
        WHEN auth.uid() IS NULL THEN
            'ERROR: Not authenticated. Please sign in to your app first, then run this again.'
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'user_profiles'
        ) THEN
            'ERROR: Tables missing. Run user-profiles-goals-safe-setup.sql first.'
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'user_profiles'
            AND rowsecurity = true
        ) THEN
            'ERROR: RLS not enabled. Tables exist but Row Level Security is disabled.'
        ELSE
            'SUCCESS: Authentication and tables look good. Check app-level issues.'
    END as diagnosis,
    'Check the output above for specific issues.' as next_steps;