-- Workout System Database Schema for Supabase
-- Run these commands in your Supabase SQL Editor

-- 1. Create workout_templates table
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('strength', 'running', 'yoga', 'cycling')),
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_built_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create ongoing_workouts table
CREATE TABLE IF NOT EXISTS public.ongoing_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('strength', 'running', 'yoga', 'cycling')),
    template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
    template_name TEXT,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_time TIMESTAMPTZ NOT NULL,
    elapsed_time INTEGER DEFAULT 0,
    is_running BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure only one ongoing workout per user per type
    UNIQUE(user_id, type)
);

-- 3. Enable Row Level Security
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ongoing_workouts ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can view their own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.workout_templates;

DROP POLICY IF EXISTS "Users can manage their own workouts" ON public.ongoing_workouts;
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.ongoing_workouts;
DROP POLICY IF EXISTS "Users can insert their own workouts" ON public.ongoing_workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.ongoing_workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.ongoing_workouts;

-- 5. Create RLS policies for workout_templates
CREATE POLICY "Users can view their own templates" ON public.workout_templates
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" ON public.workout_templates
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON public.workout_templates
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON public.workout_templates
FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for ongoing_workouts
CREATE POLICY "Users can view their own workouts" ON public.ongoing_workouts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts" ON public.ongoing_workouts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" ON public.ongoing_workouts
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" ON public.ongoing_workouts
FOR DELETE USING (auth.uid() = user_id);

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_workout_templates_updated_at ON public.workout_templates;
CREATE TRIGGER handle_workout_templates_updated_at
    BEFORE UPDATE ON public.workout_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_ongoing_workouts_updated_at ON public.ongoing_workouts;
CREATE TRIGGER handle_ongoing_workouts_updated_at
    BEFORE UPDATE ON public.ongoing_workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS workout_templates_user_id_idx ON public.workout_templates(user_id);
CREATE INDEX IF NOT EXISTS workout_templates_type_idx ON public.workout_templates(type);
CREATE INDEX IF NOT EXISTS workout_templates_user_type_idx ON public.workout_templates(user_id, type);

CREATE INDEX IF NOT EXISTS ongoing_workouts_user_id_idx ON public.ongoing_workouts(user_id);
CREATE INDEX IF NOT EXISTS ongoing_workouts_type_idx ON public.ongoing_workouts(type);
CREATE INDEX IF NOT EXISTS ongoing_workouts_user_type_idx ON public.ongoing_workouts(user_id, type);

-- 10. Function to seed built-in templates for new users
CREATE OR REPLACE FUNCTION public.seed_builtin_templates(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert built-in Push Day template
    INSERT INTO public.workout_templates (user_id, name, type, exercises, is_built_in)
    VALUES (
        target_user_id,
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
        true
    );

    -- Insert built-in Pull Day template
    INSERT INTO public.workout_templates (user_id, name, type, exercises, is_built_in)
    VALUES (
        target_user_id,
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
        true
    );

    -- Insert built-in Leg Day template
    INSERT INTO public.workout_templates (user_id, name, type, exercises, is_built_in)
    VALUES (
        target_user_id,
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
        true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Enhanced user profile creation function to include workout templates
CREATE OR REPLACE FUNCTION public.handle_new_user_with_templates()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile first
    INSERT INTO public.profiles (id, email, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', NULL),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    );
    
    -- Seed built-in templates
    PERFORM public.seed_builtin_templates(NEW.id);
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile might already exist, try to seed templates only
        PERFORM public.seed_builtin_templates(NEW.id);
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE LOG 'Failed to create profile and templates for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Update trigger to use new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_templates();

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.workout_templates TO authenticated;
GRANT ALL ON public.ongoing_workouts TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_builtin_templates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_with_templates() TO authenticated;

-- 14. Function to migrate localStorage data (will be called from client)
CREATE OR REPLACE FUNCTION public.migrate_user_workout_data(
    templates_data JSONB DEFAULT '[]'::jsonb,
    ongoing_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    template_record JSONB;
    result JSONB := '{"templates_migrated": 0, "ongoing_migrated": 0, "errors": []}'::jsonb;
    error_msg TEXT;
BEGIN
    -- Migrate templates
    FOR template_record IN SELECT * FROM jsonb_array_elements(templates_data)
    LOOP
        BEGIN
            INSERT INTO public.workout_templates (user_id, name, type, exercises, is_built_in)
            VALUES (
                auth.uid(),
                template_record->>'name',
                template_record->>'type',
                template_record->'exercises',
                COALESCE((template_record->>'isBuiltIn')::boolean, false)
            );
            result := jsonb_set(result, '{templates_migrated}', (COALESCE((result->>'templates_migrated')::int, 0) + 1)::text::jsonb);
        EXCEPTION
            WHEN OTHERS THEN
                error_msg := 'Template migration failed: ' || SQLERRM;
                result := jsonb_set(result, '{errors}', (result->'errors') || jsonb_build_array(error_msg));
        END;
    END LOOP;

    -- Migrate ongoing workout
    IF ongoing_data IS NOT NULL THEN
        BEGIN
            INSERT INTO public.ongoing_workouts (
                user_id, type, template_id, template_name, exercises, 
                start_time, elapsed_time, is_running
            )
            VALUES (
                auth.uid(),
                ongoing_data->>'type',
                NULL, -- template_id will be null for migrated data
                ongoing_data->>'templateName',
                ongoing_data->'exercises',
                (ongoing_data->>'startTime')::timestamptz,
                COALESCE((ongoing_data->>'elapsedTime')::int, 0),
                COALESCE((ongoing_data->>'isRunning')::boolean, false)
            )
            ON CONFLICT (user_id, type) DO UPDATE SET
                template_name = EXCLUDED.template_name,
                exercises = EXCLUDED.exercises,
                start_time = EXCLUDED.start_time,
                elapsed_time = EXCLUDED.elapsed_time,
                is_running = EXCLUDED.is_running,
                updated_at = NOW();
            
            result := jsonb_set(result, '{ongoing_migrated}', '1'::jsonb);
        EXCEPTION
            WHEN OTHERS THEN
                error_msg := 'Ongoing workout migration failed: ' || SQLERRM;
                result := jsonb_set(result, '{errors}', (result->'errors') || jsonb_build_array(error_msg));
        END;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for migration function
GRANT EXECUTE ON FUNCTION public.migrate_user_workout_data(JSONB, JSONB) TO authenticated;

-- Verification queries (run these to check your setup):
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('workout_templates', 'ongoing_workouts');
-- SELECT * FROM pg_policies WHERE tablename IN ('workout_templates', 'ongoing_workouts');
-- SELECT * FROM information_schema.routines WHERE routine_name IN ('seed_builtin_templates', 'migrate_user_workout_data');