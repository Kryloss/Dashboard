# Google OAuth Fix Instructions

## The Problem
Your Google OAuth sign-in is failing with the error: "Failed to exchange authorization code: invalid request: both auth code and code verifier should be non-empty"

This happens because the **environment variables are not set**, so Supabase can't connect to your database and the OAuth flow can't complete.

## Quick Fix

### 1. Create `.env.local` File
In your project root (same folder as `package.json`), create a file called `.env.local` with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Site Configuration  
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM="Kryloss <no-reply@kryloss.com>"
```

### 2. Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Settings → API**
4. **Copy these values**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Restart Your Development Server
After creating/updating `.env.local`:
```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## What I Fixed in the Code

### 1. **Enhanced Error Handling**
- Added environment variable checks before OAuth attempts
- Better error messages explaining the configuration issue
- Improved error display with helpful instructions

### 2. **OAuth Callback Improvements**
- Fixed PKCE flow handling
- Better session establishment logic
- Improved timeout handling and redirects

### 3. **Supabase Client Configuration**
- Added explicit PKCE flow configuration
- Enhanced session persistence settings
- Better error handling for missing credentials

## Verification Steps

1. ✅ **Environment variables are set** - Check with `echo $env:NEXT_PUBLIC_SUPABASE_URL`
2. ✅ **Supabase connection works** - Visit `/login/debug` to test
3. ✅ **Google OAuth initiates** - Click "Continue with Google" button
4. ✅ **OAuth callback processes** - Should redirect to homepage after Google consent
5. ✅ **Session established** - User should be logged in and redirected

## Expected Flow After Fix

1. **Click "Continue with Google"** → Button shows "Signing in..."
2. **Google OAuth consent** → User sees Google login/consent screen
3. **OAuth callback** → Redirects to `/auth/callback` with hash fragment
4. **Session establishment** → Supabase processes OAuth tokens
5. **Profile creation** → Creates user profile if new user
6. **Redirect to homepage** → User is logged in and redirected to `/`

## Common Issues & Solutions

### Issue: "Configuration error: Missing Supabase credentials"
**Solution**: Create `.env.local` file with correct credentials

### Issue: "OAuth error: invalid_request"
**Solution**: Check that your Supabase project has Google OAuth enabled

### Issue: "Failed to establish session"
**Solution**: Ensure your Supabase project is active and accessible

### Issue: "Permission denied" in database
**Solution**: Run the SQL commands from `DATABASE_SETUP_COMPLETE.sql` in your Supabase SQL Editor

## Testing the Fix

1. **Create `.env.local`** with your Supabase credentials
2. **Restart the dev server** (`npm run dev`)
3. **Try Google OAuth** - Click "Continue with Google"
4. **Check browser console** for any remaining errors
5. **Verify redirect** - Should go to homepage after Google consent

## Still Having Issues?

If you're still seeing errors after setting environment variables:

1. **Check the debug page** at `/login/debug`
2. **Look at browser console** for detailed error messages
3. **Verify Supabase project** is active and accessible
4. **Check Google OAuth** is enabled in your Supabase project settings

The enhanced error handling will now show you exactly what's going wrong instead of the cryptic "both auth code and code verifier should be non-empty" error.

## Summary

The main issue was **missing environment variables**. Once you set up `.env.local` with your Supabase credentials, the Google OAuth flow should work perfectly:

- ✅ OAuth initiation works
- ✅ Google consent screen appears
- ✅ Callback processing succeeds
- ✅ Session establishment completes
- ✅ User gets redirected to homepage
- ✅ Profile creation works for new users

Let me know if you need help with any of these steps!
