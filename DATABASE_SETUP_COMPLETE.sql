-- Complete Database Setup for Profile System
-- Run these commands in your Supabase SQL Editor

-- 1. Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add full_name column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;

-- 5. Create comprehensive RLS policies

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile with username uniqueness check
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (
    auth.uid() = id AND 
    (
        -- If username is not being changed, allow update
        username = OLD.username OR 
        -- If username is being set to null, allow
        username IS NULL OR 
        -- If username is being changed, ensure it's unique
        (SELECT COUNT(*) FROM public.profiles WHERE username = NEW.username AND id != NEW.id) = 0
    )
);

-- 6. Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 8. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', NULL),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, just return
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- 11. Test the setup with a sample query (this should work for authenticated users)
-- SELECT * FROM profiles WHERE id = auth.uid();

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- 13. Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Verification queries (run these to check your setup):
-- 1. Check if RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- 2. Check policies:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 3. Check table structure:
-- \d public.profiles

-- 4. Check triggers:
-- SELECT * FROM information_schema.triggers WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- 5. Check if the function exists:
-- SELECT * FROM information_schema.routines WHERE routine_name = 'handle_new_user';
