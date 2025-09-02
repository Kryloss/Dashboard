-- COMPLETE FIX FOR WORKOUT DATA ISOLATION
-- This addresses the cross-user data leakage issue
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: FIX BUILT-IN TEMPLATES (SYSTEM-WIDE, NOT PER-USER)
-- ============================================================================

-- First, create a dedicated system user for built-in templates
DO $$
DECLARE
    system_user_id UUID;
BEGIN
    -- Check if system user already exists
    SELECT id INTO system_user_id FROM auth.users WHERE email = 'system@healss.internal' LIMIT 1;
    
    IF system_user_id IS NULL THEN
        -- Create a system user ID (this won't actually create an auth user, just reserves the UUID)
        system_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
        
        -- Insert system built-in templates with the reserved system user ID
        INSERT INTO public.workout_templates (id, user_id, name, type, exercises, is_built_in, created_at, updated_at)
        VALUES 
        (
            '11111111-0000-0000-0000-000000000001'::UUID,
            system_user_id,
            'Push Day',
            'strength',
            '[
                {
                    "id": "bench-press",
                    "name": "Bench Press",
                    "sets": [
                        {"id": "set-1", "reps": "8-10", "weight": "", "notes": "Warm-up set"},
                        {"id": "set-2", "reps": "6-8", "weight": "", "notes": "Working set"},
                        {"id": "set-3", "reps": "6-8", "weight": "", "notes": "Working set"}
                    ]
                },
                {
                    "id": "shoulder-press",
                    "name": "Overhead Press",
                    "sets": [
                        {"id": "set-1", "reps": "8-10", "weight": "", "notes": ""},
                        {"id": "set-2", "reps": "8-10", "weight": "", "notes": ""},
                        {"id": "set-3", "reps": "8-10", "weight": "", "notes": ""}
                    ]
                },
                {
                    "id": "dips",
                    "name": "Dips",
                    "sets": [
                        {"id": "set-1", "reps": "10-12", "weight": "Bodyweight", "notes": ""},
                        {"id": "set-2", "reps": "10-12", "weight": "Bodyweight", "notes": ""},
                        {"id": "set-3", "reps": "8-10", "weight": "Bodyweight", "notes": "To failure"}
                    ]
                }
            ]'::jsonb,
            true,
            NOW(),
            NOW()
        ),
        (
            '11111111-0000-0000-0000-000000000002'::UUID,
            system_user_id,
            'Pull Day',
            'strength',
            '[
                {
                    "id": "deadlift",
                    "name": "Deadlift",
                    "sets": [
                        {"id": "set-1", "reps": "5", "weight": "", "notes": "Heavy set"},
                        {"id": "set-2", "reps": "5", "weight": "", "notes": "Heavy set"},
                        {"id": "set-3", "reps": "5", "weight": "", "notes": "Heavy set"}
                    ]
                },
                {
                    "id": "pull-ups",
                    "name": "Pull-ups",
                    "sets": [
                        {"id": "set-1", "reps": "8-10", "weight": "Bodyweight", "notes": ""},
                        {"id": "set-2", "reps": "8-10", "weight": "Bodyweight", "notes": ""},
                        {"id": "set-3", "reps": "6-8", "weight": "Bodyweight", "notes": ""}
                    ]
                },
                {
                    "id": "rows",
                    "name": "Barbell Rows",
                    "sets": [
                        {"id": "set-1", "reps": "8-10", "weight": "", "notes": ""},
                        {"id": "set-2", "reps": "8-10", "weight": "", "notes": ""},
                        {"id": "set-3", "reps": "8-10", "weight": "", "notes": ""}
                    ]
                }
            ]'::jsonb,
            true,
            NOW(),
            NOW()
        ),
        (
            '11111111-0000-0000-0000-000000000003'::UUID,
            system_user_id,
            'Leg Day',
            'strength',
            '[
                {
                    "id": "squats",
                    "name": "Squats",
                    "sets": [
                        {"id": "set-1", "reps": "8-10", "weight": "", "notes": "Warm-up"},
                        {"id": "set-2", "reps": "6-8", "weight": "", "notes": "Working set"},
                        {"id": "set-3", "reps": "6-8", "weight": "", "notes": "Working set"},
                        {"id": "set-4", "reps": "6-8", "weight": "", "notes": "Working set"}
                    ]
                },
                {
                    "id": "leg-press",
                    "name": "Leg Press",
                    "sets": [
                        {"id": "set-1", "reps": "12-15", "weight": "", "notes": ""},
                        {"id": "set-2", "reps": "12-15", "weight": "", "notes": ""},
                        {"id": "set-3", "reps": "12-15", "weight": "", "notes": ""}
                    ]
                },
                {
                    "id": "calf-raises",
                    "name": "Calf Raises",
                    "sets": [
                        {"id": "set-1", "reps": "15-20", "weight": "", "notes": ""},
                        {"id": "set-2", "reps": "15-20", "weight": "", "notes": ""},
                        {"id": "set-3", "reps": "15-20", "weight": "", "notes": ""}
                    ]
                }
            ]'::jsonb,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING; -- Don't overwrite if they already exist
        
        RAISE NOTICE 'System built-in templates created with system user ID: %', system_user_id;
    ELSE
        RAISE NOTICE 'System user already exists: %', system_user_id;
    END IF;
END $$;

-- ============================================================================
-- STEP 2: FIX RLS POLICIES WITH EXPLICIT AUTH CHECKS
-- ============================================================================

-- Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can insert their own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can update their own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can delete their own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can view own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can insert own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can update own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can delete own ongoing workouts" ON ongoing_workouts;

DROP POLICY IF EXISTS "Users can view their own templates and built-in templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can view their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can view own templates and built-in templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON workout_templates;

-- Create SECURE ongoing_workouts policies with explicit auth checks
CREATE POLICY "Users can view own ongoing workouts ONLY" ON ongoing_workouts
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        user_id IS NOT NULL
    );

CREATE POLICY "Users can insert own ongoing workouts ONLY" ON ongoing_workouts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        user_id IS NOT NULL
    );

CREATE POLICY "Users can update own ongoing workouts ONLY" ON ongoing_workouts
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        user_id IS NOT NULL
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        user_id IS NOT NULL
    );

CREATE POLICY "Users can delete own ongoing workouts ONLY" ON ongoing_workouts
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        user_id IS NOT NULL
    );

-- Create SECURE workout_templates policies with proper built-in template access
CREATE POLICY "Users can view own templates and system built-ins ONLY" ON workout_templates
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        (
            -- User's own templates
            (auth.uid() = user_id AND user_id IS NOT NULL) OR
            -- System built-in templates (using the reserved system UUID)
            (is_built_in = true AND user_id = '00000000-0000-0000-0000-000000000001'::UUID)
        )
    );

CREATE POLICY "Users can insert own templates ONLY" ON workout_templates
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        user_id IS NOT NULL AND
        is_built_in = false -- Users cannot create built-in templates
    );

CREATE POLICY "Users can update own templates ONLY" ON workout_templates
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        user_id IS NOT NULL AND
        is_built_in = false -- Built-in templates cannot be updated by users
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        user_id IS NOT NULL AND
        is_built_in = false
    );

CREATE POLICY "Users can delete own templates ONLY" ON workout_templates
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        user_id IS NOT NULL AND
        is_built_in = false -- Built-in templates cannot be deleted by users
    );

-- ============================================================================
-- STEP 3: CLEAN UP EXISTING USER-SPECIFIC BUILT-IN TEMPLATES
-- ============================================================================

-- Remove any built-in templates that were incorrectly created per-user
-- Keep only the system built-in templates
DELETE FROM public.workout_templates 
WHERE is_built_in = true 
AND user_id != '00000000-0000-0000-0000-000000000001'::UUID;

-- ============================================================================
-- STEP 4: UPDATE FUNCTIONS TO PREVENT FUTURE PER-USER BUILT-INS
-- ============================================================================

-- Drop the problematic seed function that creates per-user built-ins
DROP FUNCTION IF EXISTS public.seed_builtin_templates(UUID);

-- Create a safe function that doesn't create per-user built-ins
CREATE OR REPLACE FUNCTION public.verify_system_templates()
RETURNS INTEGER AS $$
DECLARE
    template_count INTEGER;
BEGIN
    -- Just count existing system templates, don't create per-user ones
    SELECT COUNT(*) INTO template_count
    FROM public.workout_templates 
    WHERE is_built_in = true 
    AND user_id = '00000000-0000-0000-0000-000000000001'::UUID;
    
    RETURN template_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the new user trigger to NOT create per-user built-in templates
CREATE OR REPLACE FUNCTION public.handle_new_user_profile_only()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile, DO NOT create per-user built-in templates
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
        -- Profile already exists, that's fine
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to use the safe function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile_only();

-- ============================================================================
-- STEP 5: VERIFY THE FIX
-- ============================================================================

-- Check RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables 
WHERE tablename IN ('ongoing_workouts', 'workout_templates');

-- Count system built-in templates (should be exactly 3)
SELECT 
    COUNT(*) as system_builtin_count,
    COUNT(DISTINCT user_id) as unique_user_count
FROM workout_templates 
WHERE is_built_in = true;

-- Verify no user has built-in templates (except system user)
SELECT 
    user_id,
    COUNT(*) as builtin_count
FROM workout_templates 
WHERE is_built_in = true 
GROUP BY user_id;

-- Show all policies
SELECT 
    tablename,
    policyname,
    cmd,
    CASE WHEN roles = '{authenticated}' THEN '✅ AUTHENTICATED' ELSE '❌ OTHER' END as role_check
FROM pg_policies 
WHERE tablename IN ('ongoing_workouts', 'workout_templates')
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 6: GRANT NECESSARY PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.workout_templates TO authenticated;
GRANT ALL ON public.ongoing_workouts TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_system_templates() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_profile_only() TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE '✅ WORKOUT DATA ISOLATION FIX COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS policies updated with explicit auth checks';
    RAISE NOTICE '🌍 Built-in templates are now system-wide (not per-user)';
    RAISE NOTICE '🛡️ All database operations now require proper authentication';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test with different user accounts';
    RAISE NOTICE '2. Verify each user only sees their own workouts + system built-ins';
    RAISE NOTICE '3. Check the verification queries above';
END $$;