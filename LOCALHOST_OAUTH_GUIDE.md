# Localhost OAuth Redirect Guide

## The Issue
You want to ensure that when you're developing on `localhost:3000`, the Google OAuth flow redirects back to localhost, not to kryloss.com.

## What I Fixed

### 1. **Login Page OAuth Redirect Logic** (`src/app/(auth)/login/page.tsx`)
- Added intelligent redirect URL detection
- Always uses `http://localhost:3000` when on localhost
- Falls back to environment variables for production

### 2. **OAuth Callback Redirects** (`src/app/auth/callback/page.tsx`)
- All redirects now check if you're on localhost
- Ensures you stay on localhost during development
- Production redirects use proper domain

## How It Works Now

### **Local Development (localhost:3000)**
```typescript
if (isLocalhost) {
    // Always use localhost for local development
    redirectUrl = 'http://localhost:3000'
    console.log('Local development detected, using localhost:3000')
}
```

### **Production (kryloss.com)**
```typescript
else {
    // Production environment - use environment variable or current origin
    redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || currentOrigin
    console.log('Production environment detected, using:', redirectUrl)
}
```

## Expected OAuth Flow on Localhost

1. **Click "Continue with Google"** → Button shows "Signing in..."
2. **Google OAuth consent** → User sees Google login/consent screen
3. **OAuth callback** → Redirects to `http://localhost:3000/auth/callback`
4. **Session establishment** → Supabase processes OAuth tokens
5. **Profile creation** → Creates user profile if new user
6. **Redirect to homepage** → User gets redirected to `http://localhost:3000/`

## Environment Variables Setup

Make sure your `.env.local` file has:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Site Configuration  
NEXT_PUBLIC_SITE_URL=https://kryloss.com

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM="Kryloss <no-reply@kryloss.com>"
```

**Important**: Set `NEXT_PUBLIC_SITE_URL=https://kryloss.com` for production, but the code will automatically detect localhost and use that instead.

## Testing the Fix

### 1. **Start Development Server**
```bash
npm run dev
```

### 2. **Check Console Logs**
When you click "Continue with Google", you should see:
```
Local development detected, using localhost:3000
OAuth redirect URL: http://localhost:3000/auth/callback
```

### 3. **Verify Redirect URLs**
- OAuth initiation: Should show localhost:3000
- Google consent: Should redirect back to localhost:3000/auth/callback
- Final redirect: Should go to localhost:3000/

## Debugging

### **Check Current Environment**
The health check component on your login page will show:
- ✅ **Environment**: Success (if env vars are set)
- ✅ **Database Connection**: Success (if Supabase works)

### **Browser Console Logs**
Look for these messages:
```
Local development detected, using localhost:3000
OAuth redirect URL: http://localhost:3000/auth/callback
Redirecting to: [Google OAuth URL]
```

### **Network Tab**
Check that the OAuth callback goes to:
- `http://localhost:3000/auth/callback` (not kryloss.com)

## Common Issues & Solutions

### Issue: Still redirecting to kryloss.com
**Solution**: Check that you're actually on localhost:3000, not a production URL

### Issue: Environment variables not working
**Solution**: Restart your dev server after creating `.env.local`

### Issue: OAuth callback fails
**Solution**: Ensure Supabase project has Google OAuth enabled with correct redirect URLs

## Production vs Development

| Environment | OAuth Redirect | Final Redirect | Notes |
|-------------|----------------|----------------|-------|
| **localhost:3000** | `http://localhost:3000/auth/callback` | `http://localhost:3000/` | Development |
| **kryloss.com** | `https://kryloss.com/auth/callback` | `https://kryloss.com/` | Production |

## Summary

The fix ensures that:
- ✅ **Localhost always stays on localhost** during OAuth flow
- ✅ **Production uses proper domain** from environment variables
- ✅ **Automatic detection** of current environment
- ✅ **Consistent redirects** throughout the OAuth process

Now when you're developing on localhost:3000, the entire OAuth flow will stay on localhost and won't redirect to kryloss.com!
