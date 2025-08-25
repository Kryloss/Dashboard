# Vercel Google OAuth Debug Guide 🔧

## ✅ Issues Fixed & Improvements Added

### **1. OAuth URL Configuration Fixed**
- ✅ **Uses `NEXT_PUBLIC_SITE_URL`** for production redirects instead of `window.location.origin`
- ✅ **Detailed logging** for OAuth debugging with console output
- ✅ **Better error messages** with specific failure reasons

### **2. Health Check Components Added**
- ✅ **AuthHealthCheck** on login/signup pages (shows in ALL environments)
- ✅ **Environment variable validation** 
- ✅ **Database connection testing**
- ✅ **Real-time URL comparison** (localhost vs Vercel)

## 🚨 Why OAuth Fails on Vercel

### **Root Causes:**

1. **URL Mismatch**: `window.location.origin` returns the Vercel URL, but Google OAuth expects the configured redirect URL
2. **Environment Variables**: Missing or incorrect `NEXT_PUBLIC_SITE_URL` in Vercel
3. **Google Console Config**: Authorized redirect URIs not matching Vercel domains
4. **Cookie/Session Issues**: Vercel's edge functions vs regular server behavior

## 🛠️ Step-by-Step Fix

### **Step 1: Set Up Environment Variables in Vercel**

In your Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Required for OAuth redirects
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Email (if using)
RESEND_API_KEY=your_resend_key
RESEND_FROM="Kryloss <no-reply@kryloss.com>"
```

### **Step 2: Update Google Cloud Console**

1. **Go to Google Cloud Console** → APIs & Services → Credentials
2. **Edit your OAuth 2.0 Client ID**
3. **Add Authorized Redirect URIs**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   https://your-app.vercel.app/dashboard
   ```
4. **Save changes**

### **Step 3: Update Supabase Auth Settings**

In Supabase Dashboard → Authentication → URL Configuration:

```bash
# Site URL
https://your-app.vercel.app

# Redirect URLs (add both)
https://your-app.vercel.app/dashboard
https://your-app.vercel.app/auth/callback
```

### **Step 4: Test with Health Check**

The **AuthHealthCheck** component now shows on login/signup pages and will display:

- ✅ **Environment**: Success if all vars are set
- ✅ **Database Connection**: Success if Supabase is reachable  
- 🌍 **Current URL**: Shows actual domain (localhost vs Vercel)
- 🔗 **Site URL**: Shows configured `NEXT_PUBLIC_SITE_URL`

## 🔍 Debugging Tools Added

### **Enhanced OAuth Logging**
```typescript
// Now logs detailed OAuth flow information
console.log('OAuth redirect URL:', `${redirectUrl}/dashboard`)
console.log('OAuth response:', data)
console.log('Redirecting to:', data.url)
```

### **AuthHealthCheck Component**
Shows real-time diagnostics on auth pages:
- Environment variable status
- Database connectivity
- URL comparison (localhost vs production)
- Specific error details with solutions

### **Error Messages Enhanced**
```typescript
// Before: Generic "Failed to sign in with Google"
// After: Specific error with context
setError(`OAuth error: ${error.message}`)
setError('Failed to initiate Google sign-in - no redirect URL')
```

## 🎯 Testing Your Fixes

### **1. Local Testing**
- Health check should show: `Current URL: http://localhost:3000`
- OAuth should work normally

### **2. Vercel Testing**  
- Health check should show: `Current URL: https://your-app.vercel.app`
- Check environment variables are ✅ success
- OAuth should redirect properly

### **3. Console Debugging**
Check browser console for OAuth flow logs:
```
OAuth redirect URL: https://your-app.vercel.app/dashboard
OAuth response: { url: "https://accounts.google.com/..." }
Redirecting to: https://accounts.google.com/...
```

## 🚀 Code Changes Made

### **OAuth Function (Login & Signup)**
```typescript
const handleGoogleSignIn = async () => {
    // ✅ Uses NEXT_PUBLIC_SITE_URL for production
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    console.log('OAuth redirect URL:', `${redirectUrl}/dashboard`)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${redirectUrl}/dashboard`,
        },
    })

    // ✅ Detailed error handling
    if (error) {
        console.error('OAuth initiation error:', error)
        setError(`OAuth error: ${error.message}`)
        return
    }

    // ✅ Logging OAuth response
    console.log('OAuth response:', data)
    
    if (data?.url) {
        console.log('Redirecting to:', data.url)
        window.location.href = data.url
        return
    }
}
```

### **Health Check Integration**
```typescript
// ✅ Added to login/signup pages
<div className="relative z-10 w-full max-w-md space-y-6">
    <AuthHealthCheck />
    <Card>
        {/* Login/Signup form */}
    </Card>
</div>
```

## 📋 Verification Checklist

### **Environment Setup** ✅
- [ ] `NEXT_PUBLIC_SITE_URL` set in Vercel
- [ ] Supabase environment vars configured
- [ ] Health check shows all green ✅

### **Google Console** ✅  
- [ ] Authorized redirect URIs include Vercel domain
- [ ] OAuth client ID/secret configured in Supabase
- [ ] No localhost URLs in production config

### **Supabase Settings** ✅
- [ ] Site URL matches Vercel domain  
- [ ] Redirect URLs include `/dashboard` and `/auth/callback`
- [ ] Google provider enabled

### **Testing** ✅
- [ ] Health check shows correct URLs
- [ ] Console logs OAuth flow details
- [ ] No permission/environment errors
- [ ] Successful OAuth redirect

## 🎊 Expected Result

After these fixes:

1. **Localhost**: OAuth works as before ✅
2. **Vercel**: OAuth redirects properly to Google ✅
3. **Health Check**: Shows environment status ✅  
4. **Console Logs**: Detailed OAuth debugging ✅
5. **Error Messages**: Clear failure reasons ✅

The **AuthHealthCheck** component will immediately show if there are environment or configuration issues, making debugging much easier!

## 🔧 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `NEXT_PUBLIC_SITE_URL` not set | Missing env var | Add to Vercel env settings |
| OAuth redirect loops | Wrong redirect URLs | Update Google Console + Supabase |
| "Environment: error" | Missing Supabase vars | Check Vercel environment variables |
| "Connection: error" | Database issues | Run DATABASE_SETUP_COMPLETE.sql |

Your OAuth flow should now work reliably on both localhost and Vercel! 🚀
