# Database Upgrade for Username Support

## Database Schema Changes

The account system has been upgraded to support usernames instead of full names. You need to update your Supabase database schema:

### 1. Update the `profiles` table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add username column
ALTER TABLE public.profiles ADD COLUMN username TEXT;

-- Remove full_name column (optional, only if you want to completely remove it)
-- ALTER TABLE public.profiles DROP COLUMN full_name;

-- Add unique constraint on username
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Add check constraint for username format
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_check 
CHECK (username IS NULL OR (
  length(username) >= 3 AND 
  length(username) <= 20 AND 
  username ~ '^[a-zA-Z0-9_-]+$'
));
```

### 2. Update Row Level Security (RLS) Policies

If you have RLS policies that reference `full_name`, you may need to update them:

```sql
-- Example: Update any policies that might reference full_name
-- (This is just an example, adapt based on your existing policies)

-- Allow users to update their own username
CREATE POLICY "Users can update own username" ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 3. Google OAuth Setup

Make sure your Supabase project has Google OAuth configured:

1. Go to Authentication > Settings > Auth Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth Client ID and Secret
4. Set the redirect URL to: `https://your-domain.com/auth/callback`

### 4. Environment Variables

Ensure these environment variables are set:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Email (for welcome emails)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM="Your App <no-reply@your-domain.com>"
```

## New Features

### ✅ Username System
- **Sign up**: Users must choose a unique username (3-20 characters, alphanumeric + _ -)
- **Login**: Users can log in with either username OR email + password
- **Profile**: Username is editable, email is read-only
- **Validation**: Real-time username availability checking

### ✅ Google OAuth
- **Sign up/Login**: "Continue with Google" button on both forms
- **Profile Creation**: Auto-creates profile with email, prompts for username
- **Username Requirement**: Google users must set username to complete profile

### ✅ Enhanced UX
- **Loading States**: All buttons show loading states during actions
- **Error Handling**: Comprehensive error messages for all scenarios
- **Focus States**: Full keyboard navigation support
- **Design Compliance**: All styling strictly follows design.json tokens

### ✅ Security Features
- **Username Uniqueness**: Database-level constraint prevents duplicates
- **Input Validation**: Pattern matching for username format
- **RLS Protection**: Row-level security for profile access
- **OAuth Integration**: Secure Google authentication flow

## Migration Notes

### For Existing Users
- Existing users with `full_name` can continue using the system
- They can optionally set a username to enable username login
- No data loss during the upgrade process

### For New Users
- Must provide username during signup
- Can immediately use username for login
- Google OAuth users prompted to set username after first login

## Testing

1. **Sign Up Flow**: Test username validation and uniqueness
2. **Login Flow**: Test both email and username login methods
3. **Google OAuth**: Test complete Google sign-up/sign-in flow
4. **Profile Management**: Test username updates and validation
5. **Error Cases**: Test duplicate usernames, invalid formats, etc.

## Support

If you encounter any issues during the database upgrade:

1. Check Supabase logs for any constraint violations
2. Verify Google OAuth configuration
3. Ensure all environment variables are properly set
4. Test the authentication flow in development first

All authentication flows maintain backward compatibility while adding the new username functionality!
