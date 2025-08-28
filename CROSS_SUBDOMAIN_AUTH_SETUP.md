# Cross-Subdomain Authentication Setup

This document explains how cross-subdomain authentication has been implemented to allow users to sign in once and access both `kryloss.com` and `healss.kryloss.com` seamlessly.

## Problem Solved

Previously, users had to sign in separately for each subdomain, with authentication states not being shared between:
- `kryloss.com` (main domain)
- `healss.kryloss.com` (health subdomain)

## Solution Overview

The implementation uses Supabase with cross-subdomain cookie sharing to maintain a single authentication session across all subdomains.

## Key Components

### 1. Supabase Client Configuration

**File: `src/lib/supabase/client.ts`**

```typescript
const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'supabase.auth.token',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
    },
    // Enable cross-subdomain authentication
    cookieOptions: {
        domain: '.kryloss.com', // Allow cookies to be shared across all subdomains
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
})
```

### 2. Server-Side Supabase Client

**File: `src/lib/supabase/server.ts`**

```typescript
const enhancedOptions = {
    ...options,
    domain: '.kryloss.com', // Allow cookies to be shared across all subdomains
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    ...options
}
cookieStore.set(name, value, enhancedOptions)
```

### 3. Middleware Authentication

**File: `middleware.ts`**

The middleware now:
- Checks authentication status for protected routes
- Redirects unauthenticated users to login on the same subdomain
- Configures cookies for cross-subdomain sharing

### 4. Shared Authentication Context

**File: `src/app/layout.tsx`**

The main layout provides a single `AuthProvider` that is shared across all subdomains:

```typescript
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0B0C0D] text-[#FBF7FA]`}>
        <AuthProvider>
          <SubdomainLayout>{children}</SubdomainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 5. Subdomain Layout Optimization

**File: `src/components/subdomain-layout.tsx`**

The subdomain layout detects when on the healss subdomain and shows minimal layout to avoid duplicate navigation:

```typescript
// For subdomains, show minimal layout to avoid duplicate navigation
// The auth context will be shared from the main layout
if (isSubdomain && currentSubdomain === 'healss') {
    return (
        <main className="min-h-screen bg-[#0B0C0D]">{children}</main>
    )
}
```

### 6. Healss Navigation Integration

**File: `src/app/healss/components/healss-nav.tsx`**

The healss navigation now uses the shared authentication context:

```typescript
import { useAuthContext } from "@/lib/contexts/AuthContext"

export function HealssNav() {
    const { user, loading, signOut, isAuthenticated } = useAuthContext()
    // ... authentication-aware navigation
}
```

### 7. Auth Callback Handling

**File: `src/app/auth/callback/page.tsx`**

The auth callback now redirects users to the appropriate subdomain after authentication:

```typescript
const getRedirectTarget = () => {
    const subdomain = getCurrentSubdomain()
    if (subdomain === 'healss') {
        return '/workout'
    }
    // For main domain or other subdomains
    return '/'
}
```

## How It Works

### 1. Cookie Domain Configuration

By setting the cookie domain to `.kryloss.com` (note the leading dot), cookies are automatically shared across all subdomains:
- `kryloss.com`
- `healss.kryloss.com`
- `notify.kryloss.com`
- etc.

### 2. Single Authentication Context

The main layout provides a single `AuthProvider` that manages authentication state for all subdomains. This prevents duplicate authentication contexts that could cause conflicts.

### 3. Subdomain-Aware Redirects

After authentication:
- Users on `kryloss.com` are redirected to `/`
- Users on `healss.kryloss.com` are redirected to `/workout`

### 4. Middleware Protection

The middleware protects routes and redirects unauthenticated users to login on the same subdomain they're trying to access.

## Benefits

1. **Seamless Experience**: Users sign in once and access all subdomains
2. **No Duplicate Sign-ins**: Authentication state is shared across subdomains
3. **Proper Redirects**: Users stay on their intended subdomain after authentication
4. **Security**: Protected routes are properly guarded
5. **Maintainability**: Single authentication context reduces complexity

## Testing

To test the cross-subdomain authentication:

1. Sign in on `kryloss.com`
2. Navigate to `healss.kryloss.com`
3. Verify you're automatically signed in
4. Sign out from either subdomain
5. Verify you're signed out from both subdomains

## Troubleshooting

### Common Issues

1. **Cookies not sharing**: Ensure the cookie domain is set to `.kryloss.com`
2. **Duplicate auth contexts**: Remove any duplicate `AuthProvider` components
3. **Redirect loops**: Check middleware logic for authentication redirects
4. **CORS issues**: Ensure Supabase is configured for your domain

### Debug Steps

1. Check browser cookies to ensure they're set with the correct domain
2. Verify authentication state in browser console
3. Check middleware logs for authentication redirects
4. Test with browser dev tools network tab

## Future Enhancements

1. **Additional Subdomains**: Easy to add more subdomains with the same pattern
2. **Role-based Access**: Different subdomains could have different access levels
3. **Custom Redirects**: More sophisticated redirect logic based on user roles
4. **Session Persistence**: Enhanced session management across subdomains
