# Environment Variables Check Guide

## The Problem
Your dashboard and profile pages are showing infinite loading because the Supabase client can't connect to your database. This is typically caused by missing or incorrect environment variables.

## What You Need to Check

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

## Debug Your Setup

### Option 1: Use the Debug Page
Visit `/login/debug` in your app to see detailed connection information.

### Option 2: Check Browser Console
Open your browser's developer tools (F12) and look for:
- ✅ "Supabase connection successful" - means connection works
- ❌ "Supabase connection failed" - means connection failed
- ❌ "Missing Supabase environment variables" - means env vars are missing

### Option 3: Check Environment Variables
In your browser console, run:
```javascript
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
```

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution**: Create `.env.local` file with correct credentials

### Issue: "Supabase connection failed"
**Solution**: 
1. Check your credentials are correct
2. Ensure your Supabase project is active
3. Check if your IP is allowed (if you have restrictions)

### Issue: "Permission denied" or "RLS policy violation"
**Solution**: Run the SQL commands from `DATABASE_SETUP_COMPLETE.sql` in your Supabase SQL Editor

## Verification Steps

1. ✅ Environment variables are set
2. ✅ Supabase connection test passes
3. ✅ Database tables exist (`profiles` table)
4. ✅ RLS policies are configured
5. ✅ User authentication works
6. ✅ Profile creation/access works

## Still Having Issues?

If you're still seeing the empty error object `{}` after fixing environment variables:

1. **Check the debug page** at `/login/debug`
2. **Look at browser console** for detailed error messages
3. **Verify database setup** by running the SQL commands
4. **Check Supabase logs** in your dashboard

The enhanced error handling I've added will now show you exactly what's going wrong instead of the empty error object.
