-- Enhanced Workout System Database Schema for Supabase
-- This schema supports comprehensive exercise properties and template saving
-- Run these commands in your Supabase SQL Editor

-- 1. Update workout_templates table to support enhanced exercise properties
-- The exercises JSONB column will now store comprehensive exercise data including:
-- - Basic info: id, name, description
-- - Classification: category, targetMuscles, equipment, difficulty
-- - Timing: restTime (per exercise and per set)
-- - Sets: with enhanced properties (completed, restTime)
-- - Educational: instructions, tips, alternatives
-- - Metadata: createdAt, updatedAt

-- The existing table structure is already compatible, but let's add some constraints
-- to ensure data integrity for the enhanced exercise properties

-- 2. Create a function to validate exercise data structure
CREATE OR REPLACE FUNCTION public.validate_exercise_data(exercise_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if exercise has required fields
    IF NOT (exercise_data ? 'id' AND exercise_data ? 'name' AND exercise_data ? 'sets') THEN
        RETURN FALSE;
    END IF;
    
    -- Check if sets is an array
    IF jsonb_typeof(exercise_data->'sets') != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if sets array is not empty
    IF jsonb_array_length(exercise_data->'sets') = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Validate each set has required fields
    FOR i IN 0..jsonb_array_length(exercise_data->'sets') - 1 LOOP
        DECLARE
            set_data JSONB := exercise_data->'sets'->i;
        BEGIN
            IF NOT (set_data ? 'id' AND set_data ? 'reps' AND set_data ? 'weight' AND set_data ? 'notes') THEN
                RETURN FALSE;
            END IF;
        END;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a function to validate template data
CREATE OR REPLACE FUNCTION public.validate_template_data(template_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if template has required fields
    IF NOT (template_data ? 'name' AND template_data ? 'type' AND template_data ? 'exercises') THEN
        RETURN FALSE;
    END IF;
    
    -- Check if exercises is an array
    IF jsonb_typeof(template_data->'exercises') != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if exercises array is not empty
    IF jsonb_array_length(template_data->'exercises') = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Validate each exercise
    FOR i IN 0..jsonb_array_length(template_data->'exercises') - 1 LOOP
        DECLARE
            exercise_data JSONB := template_data->'exercises'->i;
        BEGIN
            IF NOT public.validate_exercise_data(exercise_data) THEN
                RETURN FALSE;
            END IF;
        END;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. Add check constraints to ensure data integrity
ALTER TABLE public.workout_templates 
ADD CONSTRAINT check_exercises_not_empty 
CHECK (jsonb_array_length(exercises) > 0);

ALTER TABLE public.workout_templates 
ADD CONSTRAINT check_exercises_valid_structure 
CHECK (public.validate_template_data(jsonb_build_object('name', name, 'type', type, 'exercises', exercises)));

ALTER TABLE public.ongoing_workouts 
ADD CONSTRAINT check_ongoing_exercises_not_empty 
CHECK (jsonb_array_length(exercises) >= 0); -- Allow empty for ongoing workouts

-- 5. Create indexes for better performance with enhanced exercise queries
CREATE INDEX IF NOT EXISTS workout_templates_exercises_gin_idx 
ON public.workout_templates USING GIN (exercises);

CREATE INDEX IF NOT EXISTS workout_templates_exercise_categories_idx 
ON public.workout_templates USING GIN ((exercises->>'category'));

CREATE INDEX IF NOT EXISTS workout_templates_exercise_equipment_idx 
ON public.workout_templates USING GIN ((exercises->>'equipment'));

CREATE INDEX IF NOT EXISTS workout_templates_exercise_difficulty_idx 
ON public.workout_templates USING GIN ((exercises->>'difficulty'));

-- 6. Create a function to search templates by exercise properties
CREATE OR REPLACE FUNCTION public.search_templates_by_exercise_properties(
    search_user_id UUID,
    exercise_category TEXT DEFAULT NULL,
    exercise_equipment TEXT DEFAULT NULL,
    exercise_difficulty TEXT DEFAULT NULL,
    target_muscle TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    type TEXT,
    exercises JSONB,
    is_built_in BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wt.id,
        wt.name,
        wt.type,
        wt.exercises,
        wt.is_built_in,
        wt.created_at,
        wt.updated_at
    FROM public.workout_templates wt
    WHERE wt.user_id = search_user_id
    AND (
        exercise_category IS NULL OR 
        EXISTS (
            SELECT 1 FROM jsonb_array_elements(wt.exercises) AS exercise
            WHERE exercise->>'category' = exercise_category
        )
    )
    AND (
        exercise_equipment IS NULL OR 
        EXISTS (
            SELECT 1 FROM jsonb_array_elements(wt.exercises) AS exercise
            WHERE exercise->>'equipment' = exercise_equipment
        )
    )
    AND (
        exercise_difficulty IS NULL OR 
        EXISTS (
            SELECT 1 FROM jsonb_array_elements(wt.exercises) AS exercise
            WHERE exercise->>'difficulty' = exercise_difficulty
        )
    )
    AND (
        target_muscle IS NULL OR 
        EXISTS (
            SELECT 1 FROM jsonb_array_elements(wt.exercises) AS exercise
            WHERE exercise->'targetMuscles' ? target_muscle
        )
    )
    ORDER BY wt.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a function to get exercise statistics
CREATE OR REPLACE FUNCTION public.get_exercise_statistics(search_user_id UUID)
RETURNS TABLE (
    total_templates INTEGER,
    total_exercises INTEGER,
    categories JSONB,
    equipment_types JSONB,
    difficulty_levels JSONB,
    most_used_exercises JSONB
) AS $$
DECLARE
    template_count INTEGER;
    exercise_count INTEGER;
    category_stats JSONB;
    equipment_stats JSONB;
    difficulty_stats JSONB;
    exercise_usage JSONB;
BEGIN
    -- Count templates and exercises
    SELECT COUNT(*), SUM(jsonb_array_length(exercises))
    INTO template_count, exercise_count
    FROM public.workout_templates
    WHERE user_id = search_user_id;
    
    -- Get category statistics
    SELECT jsonb_object_agg(category, count)
    INTO category_stats
    FROM (
        SELECT exercise->>'category' as category, COUNT(*) as count
        FROM public.workout_templates wt,
             jsonb_array_elements(wt.exercises) as exercise
        WHERE wt.user_id = search_user_id
        GROUP BY exercise->>'category'
    ) category_counts;
    
    -- Get equipment statistics
    SELECT jsonb_object_agg(equipment, count)
    INTO equipment_stats
    FROM (
        SELECT exercise->>'equipment' as equipment, COUNT(*) as count
        FROM public.workout_templates wt,
             jsonb_array_elements(wt.exercises) as exercise
        WHERE wt.user_id = search_user_id
        GROUP BY exercise->>'equipment'
    ) equipment_counts;
    
    -- Get difficulty statistics
    SELECT jsonb_object_agg(difficulty, count)
    INTO difficulty_stats
    FROM (
        SELECT exercise->>'difficulty' as difficulty, COUNT(*) as count
        FROM public.workout_templates wt,
             jsonb_array_elements(wt.exercises) as exercise
        WHERE wt.user_id = search_user_id
        GROUP BY exercise->>'difficulty'
    ) difficulty_counts;
    
    -- Get most used exercises
    SELECT jsonb_object_agg(exercise_name, count)
    INTO exercise_usage
    FROM (
        SELECT exercise->>'name' as exercise_name, COUNT(*) as count
        FROM public.workout_templates wt,
             jsonb_array_elements(wt.exercises) as exercise
        WHERE wt.user_id = search_user_id
        GROUP BY exercise->>'name'
        ORDER BY count DESC
        LIMIT 10
    ) exercise_counts;
    
    RETURN QUERY SELECT 
        template_count,
        exercise_count,
        COALESCE(category_stats, '{}'::jsonb),
        COALESCE(equipment_stats, '{}'::jsonb),
        COALESCE(difficulty_stats, '{}'::jsonb),
        COALESCE(exercise_usage, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.validate_exercise_data(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_template_data(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_templates_by_exercise_properties(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exercise_statistics(UUID) TO authenticated;

-- 9. Create a trigger to automatically update the updated_at timestamp
-- (This should already exist, but let's make sure)
DROP TRIGGER IF EXISTS handle_workout_templates_updated_at ON public.workout_templates;
CREATE TRIGGER handle_workout_templates_updated_at
    BEFORE UPDATE ON public.workout_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 10. Create a function to migrate existing templates to enhanced format
CREATE OR REPLACE FUNCTION public.migrate_templates_to_enhanced_format()
RETURNS INTEGER AS $$
DECLARE
    template_record RECORD;
    updated_count INTEGER := 0;
    enhanced_exercises JSONB;
    exercise JSONB;
    enhanced_exercise JSONB;
    set_data JSONB;
    enhanced_set JSONB;
BEGIN
    -- Loop through all templates
    FOR template_record IN 
        SELECT id, exercises FROM public.workout_templates
    LOOP
        enhanced_exercises := '[]'::jsonb;
        
        -- Process each exercise
        FOR exercise IN SELECT * FROM jsonb_array_elements(template_record.exercises)
        LOOP
            -- Create enhanced exercise with default values
            enhanced_exercise := jsonb_build_object(
                'id', COALESCE(exercise->>'id', 'exercise-' || extract(epoch from now())::text),
                'name', COALESCE(exercise->>'name', 'Unnamed Exercise'),
                'description', COALESCE(exercise->>'description', ''),
                'category', COALESCE(exercise->>'category', 'general'),
                'targetMuscles', COALESCE(exercise->'targetMuscles', '[]'::jsonb),
                'equipment', COALESCE(exercise->>'equipment', 'bodyweight'),
                'difficulty', COALESCE(exercise->>'difficulty', 'beginner'),
                'restTime', COALESCE((exercise->>'restTime')::integer, 60),
                'instructions', COALESCE(exercise->'instructions', '[]'::jsonb),
                'tips', COALESCE(exercise->'tips', '[]'::jsonb),
                'alternatives', COALESCE(exercise->'alternatives', '[]'::jsonb),
                'createdAt', COALESCE(exercise->>'createdAt', now()::text),
                'updatedAt', now()::text
            );
            
            -- Process sets
            enhanced_exercise := jsonb_set(
                enhanced_exercise,
                '{sets}',
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', COALESCE(set_data->>'id', 'set-' || extract(epoch from now())::text),
                            'reps', COALESCE(set_data->>'reps', ''),
                            'weight', COALESCE(set_data->>'weight', ''),
                            'notes', COALESCE(set_data->>'notes', ''),
                            'completed', COALESCE((set_data->>'completed')::boolean, false),
                            'restTime', COALESCE((set_data->>'restTime')::integer, (enhanced_exercise->>'restTime')::integer)
                        )
                    )
                    FROM jsonb_array_elements(exercise->'sets') as set_data
                )
            );
            
            -- Ensure at least one set exists
            IF jsonb_array_length(enhanced_exercise->'sets') = 0 THEN
                enhanced_exercise := jsonb_set(
                    enhanced_exercise,
                    '{sets}',
                    jsonb_build_array(
                        jsonb_build_object(
                            'id', 'set-' || extract(epoch from now())::text,
                            'reps', '',
                            'weight', '',
                            'notes', '',
                            'completed', false,
                            'restTime', (enhanced_exercise->>'restTime')::integer
                        )
                    )
                );
            END IF;
            
            enhanced_exercises := enhanced_exercises || jsonb_build_array(enhanced_exercise);
        END LOOP;
        
        -- Update the template
        UPDATE public.workout_templates
        SET exercises = enhanced_exercises,
            updated_at = now()
        WHERE id = template_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for migration function
GRANT EXECUTE ON FUNCTION public.migrate_templates_to_enhanced_format() TO authenticated;

-- 11. Verification queries (run these to check your setup):
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('workout_templates', 'ongoing_workouts');
-- SELECT * FROM pg_policies WHERE tablename IN ('workout_templates', 'ongoing_workouts');
-- SELECT * FROM information_schema.routines WHERE routine_name IN ('validate_exercise_data', 'search_templates_by_exercise_properties', 'get_exercise_statistics');

-- 12. To migrate existing data, run:
-- SELECT public.migrate_templates_to_enhanced_format();

-- 13. Example queries for the enhanced system:

-- Search templates by category:
-- SELECT * FROM public.search_templates_by_exercise_properties(auth.uid(), 'chest', NULL, NULL, NULL);

-- Search templates by equipment:
-- SELECT * FROM public.search_templates_by_exercise_properties(auth.uid(), NULL, 'barbell', NULL, NULL);

-- Search templates by difficulty:
-- SELECT * FROM public.search_templates_by_exercise_properties(auth.uid(), NULL, NULL, 'intermediate', NULL);

-- Search templates by target muscle:
-- SELECT * FROM public.search_templates_by_exercise_properties(auth.uid(), NULL, NULL, NULL, 'pectorals');

-- Get exercise statistics:
-- SELECT * FROM public.get_exercise_statistics(auth.uid());

-- Get all exercises with their enhanced properties:
-- SELECT 
--     wt.name as template_name,
--     exercise->>'name' as exercise_name,
--     exercise->>'category' as category,
--     exercise->>'equipment' as equipment,
--     exercise->>'difficulty' as difficulty,
--     exercise->'targetMuscles' as target_muscles,
--     exercise->>'description' as description,
--     jsonb_array_length(exercise->'sets') as set_count
-- FROM public.workout_templates wt,
--      jsonb_array_elements(wt.exercises) as exercise
-- WHERE wt.user_id = auth.uid()
-- ORDER BY wt.name, exercise->>'name';
