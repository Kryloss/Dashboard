-- REVERT DATABASE TO ORIGINAL STATE
-- Run this in your Supabase SQL Editor to restore the original working configuration

-- 1. Drop new policies and restore original ones
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- 2. Restore original RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Drop any new views that were created
DROP VIEW IF EXISTS public.user_profiles;

-- 4. Ensure original trigger function is restored
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

-- 5. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Drop any new constraints that might have been added
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS email_format_check;

-- 7. Restore original username constraint (if it was different)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS username_length_check;

ALTER TABLE public.profiles
ADD CONSTRAINT username_length_check
CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 20));

-- Verification: Check that everything is back to original state
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';