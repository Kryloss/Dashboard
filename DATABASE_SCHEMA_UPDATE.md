# Database Schema Update for Profile System

## Required Database Changes

To support the new profile system with both `username` and `full_name` fields, you need to update your Supabase `public.profiles` table schema.

### 1. Add `full_name` column

```sql
ALTER TABLE public.profiles
ADD COLUMN full_name TEXT;
```

### 2. Complete Schema Structure

Your `public.profiles` table should now have these columns:

```sql
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. Update RLS Policies

Ensure your Row Level Security policies support both `username` and `full_name` updates:

```sql
-- Policy for reading profiles
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Policy for updating profiles  
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id) 
WITH CHECK (
    auth.uid() = id AND 
    (username IS NULL OR 
     (SELECT COUNT(*) FROM public.profiles 
      WHERE username = NEW.username AND id != NEW.id) = 0)
);

-- Policy for inserting profiles
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);
```

### 4. Username Constraints

- Usernames are automatically converted to lowercase
- Usernames must be unique across all users
- Usernames can be NULL (especially for new Google OAuth users)
- Username validation: 3-20 characters, letters, numbers, underscores, hyphens only

### 5. Data Migration (Optional)

If you have existing data and want to populate `full_name` from any existing user metadata:

```sql
-- Example migration for Google OAuth users
UPDATE public.profiles 
SET full_name = (
    SELECT raw_user_meta_data->>'full_name' 
    FROM auth.users 
    WHERE auth.users.id = profiles.id
)
WHERE full_name IS NULL 
AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = profiles.id 
    AND raw_user_meta_data->>'full_name' IS NOT NULL
);
```

## Application Behavior

### Profile Creation
- **Email/Password signup**: Creates profile with `username` (lowercase) and `full_name` as null
- **Google OAuth**: Creates profile with `username` as null and `full_name` from Google metadata
- **Profile completion**: Users without usernames are prompted to set one

### Display Logic
- **Navbar**: Shows `username` if available, falls back to `full_name`, then email initials
- **Dashboard**: Welcomes user with `username` or `full_name`
- **Profile form**: Allows editing both `username` and `full_name`

### Authentication
- Users can log in with either `username` or `email`
- Username lookup converts input to lowercase for consistency

## Environment Variables

Ensure these are set in your environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Testing Checklist

- [ ] Email/password signup creates profile correctly
- [ ] Google OAuth creates profile with full_name
- [ ] Username uniqueness validation works
- [ ] Profile updates save both username and full_name
- [ ] Login works with both username and email
- [ ] Unauthenticated users are redirected from /profile
- [ ] Profile page loads immediately (no infinite loading)
- [ ] Error states display properly
- [ ] Loading skeleton appears during navigation
