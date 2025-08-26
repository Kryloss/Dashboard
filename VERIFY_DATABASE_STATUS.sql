-- VERIFY DATABASE STATUS
-- Run this to check what's currently working and what needs fixing

-- 1. Check if profiles table exists and its structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
        THEN '✅ Profiles table exists' 
        ELSE '❌ Profiles table missing' 
    END as table_status;

-- 2. If table exists, show its structure
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE 'Table structure:';
        RAISE NOTICE '================';
    ELSE
        RAISE NOTICE '❌ Profiles table does not exist - run COMPLETE_DATABASE_FIX.sql first';
        RETURN;
    END IF;
END $$;

-- 3. Show table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled' 
        ELSE '❌ RLS Disabled' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 5. Check existing policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '✅ Read Policy'
        WHEN cmd = 'INSERT' THEN '✅ Insert Policy'
        WHEN cmd = 'UPDATE' THEN '✅ Update Policy'
        WHEN cmd = 'DELETE' THEN '✅ Delete Policy'
        ELSE '❓ Unknown Policy'
    END as policy_type
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Check if no policies exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles') THEN
        RAISE NOTICE '❌ NO RLS POLICIES FOUND - This is why you get permission errors!';
        RAISE NOTICE '💡 Run COMPLETE_DATABASE_FIX.sql to fix this';
    ELSE
        RAISE NOTICE '✅ RLS policies found';
    END IF;
END $$;

-- 7. Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    CASE 
        WHEN event_object_table = 'users' THEN '✅ User creation trigger'
        WHEN event_object_table = 'profiles' THEN '✅ Profile update trigger'
        ELSE '❓ Unknown trigger'
    END as trigger_status
FROM information_schema.triggers 
WHERE (event_object_table = 'users' AND trigger_schema = 'auth') 
   OR (event_object_table = 'profiles' AND trigger_schema = 'public');

-- 8. Check functions
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'handle_new_user' THEN '✅ New user handler'
        WHEN routine_name = 'handle_updated_at' THEN '✅ Update timestamp handler'
        ELSE '❓ Other function'
    END as function_status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('handle_new_user', 'handle_updated_at');

-- 9. Check permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable,
    CASE 
        WHEN privilege_type = 'ALL' THEN '✅ Full access'
        WHEN privilege_type = 'SELECT' THEN '✅ Read access'
        WHEN privilege_type = 'INSERT' THEN '✅ Insert access'
        WHEN privilege_type = 'UPDATE' THEN '✅ Update access'
        WHEN privilege_type = 'DELETE' THEN '✅ Delete access'
        ELSE '❓ Other permission'
    END as permission_status
FROM information_schema.table_privileges 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- 10. Check indexes
SELECT 
    indexname,
    indexdef,
    CASE 
        WHEN indexname LIKE '%username%' THEN '✅ Username index'
        WHEN indexname LIKE '%email%' THEN '✅ Email index'
        WHEN indexname LIKE '%id%' THEN '✅ ID index'
        ELSE '❓ Other index'
    END as index_status
FROM pg_indexes 
WHERE tablename = 'profiles';

-- 11. Summary and recommendations
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DATABASE STATUS SUMMARY';
    RAISE NOTICE '========================';
    
    -- Check table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE '✅ Profiles table: EXISTS';
    ELSE
        RAISE NOTICE '❌ Profiles table: MISSING';
        RAISE NOTICE '💡 Run COMPLETE_DATABASE_FIX.sql to create it';
        RETURN;
    END IF;
    
    -- Check RLS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity) THEN
        RAISE NOTICE '✅ Row Level Security: ENABLED';
    ELSE
        RAISE NOTICE '❌ Row Level Security: DISABLED';
        RAISE NOTICE '💡 Run COMPLETE_DATABASE_FIX.sql to enable it';
    END IF;
    
    -- Check policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles') THEN
        RAISE NOTICE '✅ RLS Policies: EXIST';
    ELSE
        RAISE NOTICE '❌ RLS Policies: MISSING';
        RAISE NOTICE '💡 Run COMPLETE_DATABASE_FIX.sql to create them';
    END IF;
    
    -- Check triggers
    IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'users' AND trigger_schema = 'auth') THEN
        RAISE NOTICE '✅ User creation trigger: EXISTS';
    ELSE
        RAISE NOTICE '❌ User creation trigger: MISSING';
        RAISE NOTICE '💡 Run COMPLETE_DATABASE_FIX.sql to create it';
    END IF;
    
    -- Check functions
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') THEN
        RAISE NOTICE '✅ New user handler: EXISTS';
    ELSE
        RAISE NOTICE '❌ New user handler: MISSING';
        RAISE NOTICE '💡 Run COMPLETE_DATABASE_FIX.sql to create it';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RECOMMENDATIONS:';
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles') THEN
        RAISE NOTICE '🚨 CRITICAL: Run COMPLETE_DATABASE_FIX.sql immediately';
        RAISE NOTICE '   This will fix your permission denied errors';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') THEN
        RAISE NOTICE '⚠️  WARNING: Profiles won''t be created automatically on signup';
        RAISE NOTICE '   Run COMPLETE_DATABASE_FIX.sql to fix this';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Run COMPLETE_DATABASE_FIX.sql in your Supabase SQL Editor';
    RAISE NOTICE '2. Test the signup flow';
    RAISE NOTICE '3. Check your app health check - should show success';
    RAISE NOTICE '4. Verify welcome emails are working';
    
END $$;
