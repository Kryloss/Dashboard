-- TEMPORARY: Disable RLS to test if that fixes the save issue
-- Run this to temporarily disable Row Level Security

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals DISABLE ROW LEVEL SECURITY;

-- Now try saving your profile/goals in the app
-- This should work if RLS was the only issue

-- After confirming it works, you can re-enable RLS with proper policies:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;