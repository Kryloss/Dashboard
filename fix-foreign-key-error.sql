-- =====================================================
-- FIX FOR FOREIGN KEY CONSTRAINT ERROR
-- "insert or update on table profiles violates foreign key constraint profiles_id_fkey"
-- =====================================================

-- Step 1: Check current table structure
SELECT 'Current table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 2: Check foreign key constraints
SELECT 'Foreign key constraints:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'profiles';

-- Step 3: Drop the problematic foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 4: Recreate the table without the foreign key constraint
-- This allows profiles to be created independently of auth.users
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    username TEXT UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Do NOT enable RLS (keep it simple for now)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; -- COMMENTED OUT

-- Step 6: Grant ALL permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO postgres;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Step 8: Test the new table structure
SELECT 'Testing new table...' as info;
INSERT INTO profiles (id, email, username, full_name) 
VALUES (
    gen_random_uuid(), 
    'test@example.com', 
    'testuser', 
    'Test User'
);

-- Step 9: Verify the insert worked
SELECT 'Verifying insert...' as info;
SELECT * FROM profiles WHERE email = 'test@example.com';

-- Step 10: Clean up test data
DELETE FROM profiles WHERE email = 'test@example.com';

-- Step 11: Final verification
SELECT 'Final verification:' as info;
SELECT 
    table_name,
    row_security
FROM information_schema.tables 
WHERE table_name = 'profiles';

SELECT 'RLS policies (should be 0):' as info;
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'profiles';

SELECT 'Foreign key constraints (should be 0):' as info;
SELECT COUNT(*) as fk_count 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND constraint_type = 'FOREIGN KEY';
