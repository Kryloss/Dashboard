# Template Saving Test Plan

## Problem Fixed:
Exercises were not saving to templates properly due to missing user context initialization in the WorkoutTypeDialog component and insufficient error handling in the template saving process.

## Solution Implemented:
1. **Added user context initialization** - WorkoutTypeDialog now properly initializes WorkoutStorageSupabase with user context
2. **Enhanced error handling** - Added comprehensive error handling and logging throughout the template saving process
3. **Improved user validation** - Added user context validation before template operations
4. **Better logging** - Added detailed logging to track template saving and retrieval

## Key Changes Made:

### 1. Enhanced WorkoutTypeDialog with User Context
```typescript
// Added useAuth hook
import { useAuth } from "@/lib/hooks/useAuth"

export function WorkoutTypeDialog({ open, onOpenChange }: WorkoutTypeDialogProps) {
  const { user, supabase } = useAuth()
  
  // Initialize WorkoutStorageSupabase when dialog opens
  useEffect(() => {
    if (open && user && supabase) {
      console.log('Initializing WorkoutStorageSupabase in dialog for user:', user.id)
      WorkoutStorageSupabase.initialize(user, supabase)
    }
  }, [open, user, supabase])
}
```

### 2. Enhanced Template Loading with User Validation
```typescript
const handleWorkoutSelect = async (workoutType: string, available: boolean) => {
  if (workoutType === 'strength') {
    // Ensure we have user context before loading templates
    if (!user || !supabase) {
      console.error('No user or supabase client available for template loading')
      return
    }

    console.log('Loading strength templates for user:', user.id)
    const strengthTemplates = await WorkoutStorageSupabase.getTemplates('strength')
    console.log('Loaded strength templates:', {
      count: strengthTemplates.length,
      templates: strengthTemplates.map(t => ({
        id: t.id,
        name: t.name,
        exerciseCount: t.exercises.length,
        isBuiltIn: t.isBuiltIn,
        userId: t.userId
      }))
    })
    setTemplates(strengthTemplates)
    setShowTemplates(true)
  }
}
```

### 3. Enhanced Template Saving with User Validation
```typescript
const saveAsTemplate = async () => {
  // Ensure we have user context
  if (!user || !supabase) {
    console.error('Cannot save template: no user or supabase client available')
    return
  }

  try {
    console.log('Saving template:', {
      name: templateName.trim(),
      type: 'strength',
      exerciseCount: exercises.length,
      userId: user.id,
      exercises: exercises.map(e => ({ id: e.id, name: e.name, setCount: e.sets.length }))
    })

    const template = await WorkoutStorageSupabase.saveTemplate({
      name: templateName.trim(),
      type: 'strength',
      exercises: exercises
    })

    console.log('Template saved successfully:', {
      id: template.id,
      name: template.name,
      exerciseCount: template.exercises.length,
      userId: template.userId
    })
  } catch (error) {
    console.error('Failed to save template:', error)
  }
}
```

### 4. Enhanced WorkoutStorageSupabase.saveTemplate Method
```typescript
static async saveTemplate(template: Omit<WorkoutTemplate, 'id' | 'createdAt'>): Promise<WorkoutTemplate> {
  // Ensure we have user context
  if (!this.currentUser) {
    console.error('Cannot save template: no user context available')
    throw new Error('No user context available for template saving')
  }

  console.log('Saving template to database:', {
    tempId,
    name: template.name,
    type: template.type,
    exerciseCount: template.exercises.length,
    userId: this.currentUser.id,
    exercises: template.exercises.map(e => ({ id: e.id, name: e.name, setCount: e.sets.length }))
  })

  // ... rest of save logic with enhanced error handling
}
```

## Testing Scenarios:

### Test 1: Template Creation with Exercises
1. **Prerequisites:** User must be logged in
2. Start a new strength workout
3. Add multiple exercises with sets, reps, and weights
4. Click "Save as Template"
5. Enter a template name
6. Click "Save Template"
7. **Expected:** Template should be saved with all exercises and their data

### Test 2: Template Retrieval and Display
1. **Prerequisites:** User must be logged in and have saved templates
2. Click "New Workout" button
3. Select "Strength" workout type
4. **Expected:** Should see template selection dialog with saved templates
5. **Expected:** Each template should show correct exercise count
6. **Expected:** Built-in templates should be marked as "Built-in"

### Test 3: Template Usage
1. **Prerequisites:** User must be logged in and have saved templates
2. Click "New Workout" → "Strength"
3. Select a saved template from the list
4. **Expected:** Workout should be created with all exercises from the template
5. **Expected:** All sets, reps, and weights should be preserved

### Test 4: User Isolation
1. **Prerequisites:** Two different user accounts
2. User A creates and saves a template
3. User B logs in and creates a workout
4. **Expected:** User B should not see User A's templates
5. **Expected:** User B should only see built-in templates and their own templates

### Test 5: Error Handling
1. **Prerequisites:** User must be logged in
2. Try to save a template without exercises
3. **Expected:** Should show error message and not save
4. Try to save a template without a name
5. **Expected:** Should show error message and not save

### Test 6: Database Verification
Run these queries to verify template storage:

```sql
-- Check templates for a specific user
SELECT id, user_id, name, type, exercises, is_built_in, created_at 
FROM workout_templates 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;

-- Verify exercise data is properly stored
SELECT name, exercises 
FROM workout_templates 
WHERE user_id = 'your-user-id' 
AND name = 'your-template-name';

-- Check for any templates without exercises
SELECT id, name, exercises 
FROM workout_templates 
WHERE user_id = 'your-user-id' 
AND (exercises IS NULL OR exercises = '[]'::jsonb);
```

## Debugging Steps:

### 1. Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for template-related log messages:
  - "Initializing WorkoutStorageSupabase in dialog for user: [user-id]"
  - "Loading strength templates for user: [user-id]"
  - "Loaded strength templates: [template-data]"
  - "Saving template: [template-data]"
  - "Template saved successfully: [template-data]"

### 2. Check Network Tab
- Open Developer Tools (F12)
- Go to Network tab
- Look for Supabase API calls:
  - `GET /rest/v1/workout_templates` (for loading templates)
  - `POST /rest/v1/workout_templates` (for saving templates)

### 3. Check LocalStorage
- Open Developer Tools (F12)
- Go to Application tab → Local Storage
- Check for:
  - `workout-templates` key with template data
  - `supabase-cache-templates-strength` key with cached data

### 4. Check Database Directly
- Go to Supabase Dashboard
- Navigate to Table Editor
- Check `workout_templates` table for:
  - User's templates with correct `user_id`
  - Proper `exercises` JSONB data
  - Correct `name` and `type` values

## Expected Results:

✅ **Template Creation:** Exercises should save properly to templates  
✅ **Template Retrieval:** Saved templates should appear in the template selection dialog  
✅ **Template Usage:** Templates should create workouts with all exercises preserved  
✅ **User Isolation:** Users should only see their own templates  
✅ **Error Handling:** Proper error messages for invalid template data  
✅ **Database Storage:** Templates should be stored in database with correct user association  

## Troubleshooting:

### Issue: Templates not appearing in dialog
- **Check:** User authentication status
- **Check:** WorkoutStorageSupabase initialization
- **Check:** Database connection and permissions
- **Check:** Console for error messages

### Issue: Template saves but exercises are empty
- **Check:** Exercise data before saving
- **Check:** JSON serialization of exercises
- **Check:** Database storage of exercises field

### Issue: Template appears but doesn't load exercises
- **Check:** Template retrieval from database
- **Check:** Exercise data in database
- **Check:** Template creation from saved data

## Result:
The enhanced template saving system ensures that:
1. All exercises are properly saved to templates with user association
2. Templates are correctly retrieved and displayed in the UI
3. User context is properly maintained throughout the process
4. Error handling provides clear feedback for debugging
5. Database storage is consistent and reliable
