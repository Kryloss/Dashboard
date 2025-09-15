-- Database Diagnostic Script for Supabase SQL Editor
-- Copy and paste this SQL into your Supabase SQL Editor to check database setup

-- ============================================================================
-- CHECK IF TABLES EXIST
-- ============================================================================

SELECT
    'Checking if tables exist...' as step,
    '' as table_name,
    '' as exists
UNION ALL
SELECT
    'user_profiles',
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'YES' ELSE 'NO' END as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'user_profiles'
UNION ALL
SELECT
    'user_goals',
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'YES' ELSE 'NO' END as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'user_goals';

-- ============================================================================
-- CHECK TABLE SCHEMAS
-- ============================================================================

-- Check user_profiles table structure
SELECT
    'user_profiles columns:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check user_goals table structure
SELECT
    'user_goals columns:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_goals'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK RLS POLICIES
-- ============================================================================

-- Check if Row Level Security is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals');

-- Check existing policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals')
ORDER BY tablename, policyname;

-- ============================================================================
-- CHECK INDEXES
-- ============================================================================

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_goals')
ORDER BY tablename, indexname;

-- ============================================================================
-- SUMMARY STATUS
-- ============================================================================

SELECT
    'SUMMARY' as section,
    'Tables created: ' ||
    COALESCE((SELECT COUNT(*)::text FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name IN ('user_profiles', 'user_goals')), '0') ||
    ' of 2' as status;