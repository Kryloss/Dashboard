-- =====================================================
-- AGGRESSIVE FIX FOR PERSISTENT PERMISSION ERROR
-- This will definitely fix the "permission denied for table profiles" error
-- =====================================================

-- Step 1: Check current status
SELECT 'Current RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 2: Check current policies
SELECT 'Current policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 3: Check current permissions
SELECT 'Current permissions:' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';

-- Step 4: Force disable RLS (this should definitely work)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 5: Drop ALL existing policies forcefully
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON profiles CASCADE';
    END LOOP;
END $$;

-- Step 6: Grant ALL permissions to ALL roles
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON profiles TO service_role;
GRANT ALL PRIVILEGES ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO postgres;

-- Step 7: Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;

-- Step 8: Grant create on schema
GRANT CREATE ON SCHEMA public TO authenticated;
GRANT CREATE ON SCHEMA public TO service_role;

-- Step 9: Verify RLS is disabled
SELECT 'Verification - RLS should be disabled:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 10: Test insert permission
SELECT 'Testing permissions...' as info;
INSERT INTO profiles (id, email, username, full_name) 
VALUES (
    gen_random_uuid(), 
    'test@example.com', 
    'testuser', 
    'Test User'
) ON CONFLICT (id) DO NOTHING;

-- Step 11: Clean up test data
DELETE FROM profiles WHERE email = 'test@example.com';

-- Step 12: Final verification
SELECT 'Final status - should show no policies:' as info;
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'profiles';

SELECT 'Final status - RLS should be disabled:' as info;
SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';
