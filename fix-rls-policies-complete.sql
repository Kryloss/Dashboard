-- Complete fix for workout data isolation issue
-- Run this SQL in your Supabase SQL Editor to fix RLS policies and constraints

-- First, let's check current state (run these for debugging):
-- SELECT auth.uid(), auth.email();
-- SELECT id, user_id, name FROM ongoing_workouts;
-- SELECT id, user_id, name, is_built_in FROM workout_templates;

-- ============================================================================
-- ENABLE RLS IF NOT ALREADY ENABLED
-- ============================================================================

-- Ensure RLS is enabled on both tables
ALTER TABLE ongoing_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES TO START CLEAN
-- ============================================================================

-- Drop all existing policies for ongoing_workouts
DROP POLICY IF EXISTS "Users can view their own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can insert their own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can update their own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can delete their own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can view own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can insert own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can update own ongoing workouts" ON ongoing_workouts;
DROP POLICY IF EXISTS "Users can delete own ongoing workouts" ON ongoing_workouts;

-- Drop all existing policies for workout_templates  
DROP POLICY IF EXISTS "Users can view their own templates and built-in templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can view own templates and built-in templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON workout_templates;

-- ============================================================================
-- CREATE SECURE RLS POLICIES FOR ONGOING_WORKOUTS
-- ============================================================================

-- SELECT: Users can only view their own ongoing workouts
CREATE POLICY "Users can view own ongoing workouts" ON ongoing_workouts
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = user_id::text
    );

-- INSERT: Users can only insert workouts for themselves
CREATE POLICY "Users can insert own ongoing workouts" ON ongoing_workouts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = user_id::text
    );

-- UPDATE: Users can only update their own workouts
CREATE POLICY "Users can update own ongoing workouts" ON ongoing_workouts
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = user_id::text
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = user_id::text
    );

-- DELETE: Users can only delete their own workouts
CREATE POLICY "Users can delete own ongoing workouts" ON ongoing_workouts
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = user_id::text
    );

-- ============================================================================
-- CREATE SECURE RLS POLICIES FOR WORKOUT_TEMPLATES
-- ============================================================================

-- SELECT: Users can view their own templates AND built-in templates (where user_id is NULL)
CREATE POLICY "Users can view own templates and built-in templates" ON workout_templates
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            auth.uid()::text = user_id::text OR 
            is_built_in = true
        )
    );

-- INSERT: Users can only insert templates for themselves
CREATE POLICY "Users can insert own templates" ON workout_templates
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = user_id::text AND
        is_built_in = false  -- Users cannot create built-in templates
    );

-- UPDATE: Users can only update their own templates (not built-in ones)
CREATE POLICY "Users can update own templates" ON workout_templates
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = user_id::text AND
        is_built_in = false
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = user_id::text AND
        is_built_in = false
    );

-- DELETE: Users can only delete their own templates (not built-in ones)
CREATE POLICY "Users can delete own templates" ON workout_templates
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = user_id::text AND
        is_built_in = false
    );

-- ============================================================================
-- ENSURE PROPER CONSTRAINTS
-- ============================================================================

-- Ensure only one ongoing workout per user (this supports the application logic)
-- Drop existing constraint if it exists
ALTER TABLE ongoing_workouts DROP CONSTRAINT IF EXISTS unique_user_ongoing_workout;

-- Add unique constraint on user_id (only one ongoing workout per user)
ALTER TABLE ongoing_workouts ADD CONSTRAINT unique_user_ongoing_workout UNIQUE (user_id);

-- ============================================================================
-- VERIFICATION QUERIES (run after applying)
-- ============================================================================

-- Verify RLS is enabled
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('ongoing_workouts', 'workout_templates');

-- Verify policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename IN ('ongoing_workouts', 'workout_templates');

-- Test data isolation (should only show current user's data)
-- SELECT COUNT(*) as my_ongoing_workouts FROM ongoing_workouts;
-- SELECT COUNT(*) as my_templates FROM workout_templates WHERE user_id = auth.uid()::text;
-- SELECT COUNT(*) as builtin_templates FROM workout_templates WHERE is_built_in = true;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. The unique constraint on user_id in ongoing_workouts ensures only one ongoing workout per user
-- 2. RLS policies use explicit text casting to handle UUID comparisons properly
-- 3. Built-in templates (is_built_in = true) are visible to all users but only admins should create them
-- 4. All policies require auth.uid() to be NOT NULL, preventing anonymous access
-- 5. UPDATE and DELETE policies use both USING and WITH CHECK clauses for maximum security