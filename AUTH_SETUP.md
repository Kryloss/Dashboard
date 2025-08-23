# Kryloss Account System Setup

This document contains setup instructions for the Supabase authentication system and email integration.

## 🏗️ Database Setup

### 1. Create Profiles Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2. Configure Supabase Auth

In your Supabase dashboard:

1. Go to **Authentication > Settings**
2. Configure your site URL: `http://localhost:3000` (or your production URL)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`
4. Enable email confirmations if desired
5. Configure email templates with your brand styling

## 🔐 Environment Variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Site Configuration  
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email Configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM="Kryloss <no-reply@kryloss.com>"
```

### Getting Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy the **Project URL** and **anon/public key**

### Getting Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** in your dashboard
3. Create a new API key
4. Add your domain and verify it for sending emails

## ✨ Features Implemented

### 🔐 Authentication Flow
- ✅ **Sign Up** - Email/password with profile creation
- ✅ **Sign In** - Email/password authentication  
- ✅ **Sign Out** - Session termination
- ✅ **Password Reset** - Email-based reset flow
- ✅ **Profile Management** - Update user information

### 🛡️ Security Features
- ✅ **Route Protection** - Middleware-based authentication
- ✅ **Server Components** - Secure data fetching
- ✅ **Row Level Security** - Database-level access control
- ✅ **Server Actions** - Type-safe mutations

### 📧 Email System
- ✅ **Welcome Emails** - React Email templates with dark theme
- ✅ **Password Reset** - Secure token-based reset
- ✅ **Server-only Email** - API keys never exposed to client

### 🎨 UI/UX Features
- ✅ **Loading States** - Form submission indicators
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Focus Management** - Keyboard navigation support
- ✅ **Responsive Design** - Mobile-first responsive layout
- ✅ **Design System** - Strict adherence to design.json tokens

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Run database setup SQL** in Supabase

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Test the auth flow:**
   - Visit `http://localhost:3000`
   - Click "Sign Up" to create an account
   - Check your email for welcome message
   - Sign in and access dashboard

## 🔄 Authentication Flow

### Public Routes
- `/` - Landing page
- `/login` - Sign in form
- `/signup` - Registration form  
- `/reset-password` - Password reset form

### Protected Routes
- `/dashboard` - User dashboard
- `/profile` - Profile management

### Middleware Protection
The middleware automatically:
- Redirects unauthenticated users from protected routes to `/login`
- Redirects authenticated users from auth pages to `/dashboard`
- Maintains session state across page refreshes

## 🎯 Key Components

### Server Actions (`src/lib/actions/auth.ts`)
- `signUp()` - Register new user + create profile + send welcome email
- `signIn()` - Authenticate user
- `signOut()` - End session
- `resetPassword()` - Send password reset email
- `updateProfile()` - Update user profile

### Supabase Clients
- `src/lib/supabase/client.ts` - Browser client
- `src/lib/supabase/server.ts` - Server client with cookie handling
- `src/lib/supabase/middleware.ts` - Session management

### Email Templates (`src/emails/`)
- Dark theme using design.json colors
- Responsive design
- Platform tool highlights
- Professional branding

## 🛠️ Customization

All styling strictly follows `design.json`:
- Colors: Dark theme with neon blue accents
- Typography: Inter font with proper hierarchy
- Components: shadcn/ui with custom styling
- States: Hover, focus, disabled, loading per design system

The system is fully type-safe with TypeScript and includes comprehensive error handling and user feedback.
