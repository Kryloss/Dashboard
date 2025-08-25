# Database Issues Debugging Guide

## Current Issues Diagnosed

### 1. Profile Fetch Error: `{}`
This indicates the profile doesn't exist for the current user. The system now handles this by:
- ✅ **Auto-creating missing profiles** when users visit `/profile`
- ✅ **Better error logging** with error codes and details
- ✅ **Graceful fallback** to prevent page crashes

### 2. Permission Denied for Table Profiles
This is a Row Level Security (RLS) policy issue. The user cannot update the profiles table.

## Quick Fixes

### Fix 1: Run Complete Database Setup
Execute the `DATABASE_SETUP_COMPLETE.sql` script in your Supabase SQL Editor:

```sql
-- This script will:
-- 1. Create/update the profiles table
-- 2. Set up proper RLS policies
-- 3. Grant necessary permissions
-- 4. Create indexes for performance
```

### Fix 2: Manual RLS Policy Check
In Supabase Dashboard > Authentication > Policies, ensure you have these policies for the `profiles` table:

```sql
-- Policy 1: SELECT (View own profile)
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Policy 2: INSERT (Create own profile)
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: UPDATE (Update own profile)
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id) 
WITH CHECK (
    auth.uid() = id AND 
    (username = OLD.username OR username IS NULL OR 
     (SELECT COUNT(*) FROM public.profiles WHERE username = NEW.username AND id != NEW.id) = 0)
);
```

### Fix 3: Check RLS is Enabled
```sql
-- Run this in Supabase SQL Editor
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Should return: rowsecurity = true
```

### Fix 4: Verify User Authentication
Check if the user is properly authenticated:

```sql
-- Test this query in Supabase (should return your user ID)
SELECT auth.uid();

-- Test profile access (should return your profile or empty)
SELECT * FROM public.profiles WHERE id = auth.uid();
```

## Detailed Diagnostics

### Check Your Current Setup

1. **Verify Table Structure:**
```sql
\d public.profiles
-- Should show: id, email, username, full_name, avatar_url, created_at, updated_at
```

2. **Check Policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
-- Should show 3 policies: SELECT, INSERT, UPDATE
```

3. **Test Permissions:**
```sql
-- Try inserting a test profile
INSERT INTO public.profiles (id, email, username, full_name) 
VALUES (auth.uid(), 'test@test.com', 'testuser', 'Test User');

-- Try updating it
UPDATE public.profiles 
SET username = 'newusername' 
WHERE id = auth.uid();

-- Clean up
DELETE FROM public.profiles WHERE id = auth.uid();
```

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `PGRST116` | No rows returned | Profile doesn't exist - will be auto-created |
| `42501` | Permission denied | RLS policy issue - run database setup |
| `23505` | Unique constraint violation | Username already taken |
| `23503` | Foreign key violation | User ID doesn't exist in auth.users |

### Step-by-Step Resolution

1. **Run the Complete Setup Script** (`DATABASE_SETUP_COMPLETE.sql`)
2. **Test profile creation manually** in Supabase SQL Editor
3. **Verify RLS policies** are active and correct
4. **Check user authentication** is working
5. **Test the application** profile page

### Application-Level Improvements

The code now includes:

✅ **Automatic profile creation** when missing
✅ **Detailed error logging** with codes and details  
✅ **Graceful error handling** without page crashes
✅ **Better user feedback** for permission issues
✅ **Fallback mechanisms** for database issues

### Testing Your Fixes

After running the database setup:

1. **Sign up a new user** - should create profile automatically
2. **Visit `/profile`** - should load without "Profile fetch error"
3. **Update username** - should work without "permission denied"
4. **Use Google OAuth** - should create profile and allow updates

### Still Having Issues?

If problems persist:

1. **Check Supabase logs** in Dashboard > Logs
2. **Verify environment variables** are correct
3. **Test with a fresh user account** 
4. **Check browser console** for detailed error messages
5. **Run database queries manually** to isolate the issue

The system is now much more robust and should handle most database issues gracefully!
