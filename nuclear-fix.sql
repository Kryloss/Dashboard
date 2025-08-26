-- =====================================================
-- NUCLEAR FIX - COMPLETE TABLE RECREATION
-- Use this ONLY if the aggressive fix doesn't work
-- This will drop and recreate the profiles table completely
-- =====================================================

-- WARNING: This will delete all existing profile data
-- Only use if you're okay with losing existing profiles

-- Step 1: Backup existing data (if any)
CREATE TABLE IF NOT EXISTS profiles_backup AS 
SELECT * FROM profiles;

-- Step 2: Drop the problematic table completely
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 3: Recreate the table with NO RLS
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    username TEXT UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: IMPORTANT: Do NOT enable RLS
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; -- COMMENTED OUT

-- Step 5: Grant ALL permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO postgres;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Step 7: Test the new table
SELECT 'Testing new table...' as info;
INSERT INTO profiles (id, email, username, full_name) 
VALUES (
    gen_random_uuid(), 
    'test@example.com', 
    'testuser', 
    'Test User'
);

-- Step 8: Verify the insert worked
SELECT 'Verifying insert...' as info;
SELECT * FROM profiles WHERE email = 'test@example.com';

-- Step 9: Clean up test data
DELETE FROM profiles WHERE email = 'test@example.com';

-- Step 10: Final verification
SELECT 'Final verification:' as info;
SELECT 
    table_name,
    row_security
FROM information_schema.tables 
WHERE table_name = 'profiles';

SELECT 'RLS policies (should be 0):' as info;
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'profiles';

-- Step 11: Restore data if needed (uncomment if you had important data)
-- INSERT INTO profiles SELECT * FROM profiles_backup;
-- DROP TABLE profiles_backup;
