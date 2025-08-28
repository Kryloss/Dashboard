# Subdomain System Setup Guide

## Overview

This project now includes a complete subdomain routing system that automatically detects when users visit subdomains and routes them to the appropriate pages.

## How It Works

### 1. Middleware (`middleware.ts`)
- Detects incoming requests to subdomains
- Automatically redirects users to the correct routes
- Handles routing for `healss.kryloss.com` → `/healss-subdomain`

### 2. Subdomain Detection (`src/lib/subdomains.ts`)
- Provides utility functions to detect current subdomain
- Manages subdomain configuration and routing
- Supports multiple subdomains (Healss, Notify, etc.)

### 3. Dynamic Layout (`src/components/subdomain-layout.tsx`)
- Automatically detects if user is on a subdomain
- Renders appropriate layout (subdomain-specific or main dashboard)
- Prevents main navigation from showing on subdomains

## Subdomain Configuration

### Current Subdomains
```typescript
{
  'healss': '/healss-subdomain',    // healss.kryloss.com
  'notify': '/notify-subdomain',    // notify.kryloss.com
}
```

### URL Structure
- **Main Domain**: `kryloss.com` → Main dashboard with navigation
- **Healss Subdomain**: `healss.kryloss.com` → Healss workout tracker
- **Notify Subdomain**: `notify.kryloss.com` → Notification system

## Testing the System

### Local Development
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test subdomain routing:
   - Main app: `http://localhost:3000`
   - Healss page: `http://localhost:3000/healss-subdomain`

### Production (Vercel)
1. **DNS Configuration Required**:
   ```
   Type: CNAME
   Name: healss
   Value: cname.vercel-dns.com
   ```

2. **Vercel Domain Setup**:
   - Add `healss.kryloss.com` in Vercel project settings
   - Set to "Production" environment
   - No redirects needed

3. **Test URLs**:
   - Main app: `https://kryloss.com`
   - Healss subdomain: `https://healss.kryloss.com`
   - Healss page: `https://healss.kryloss.com/healss-subdomain`

## How Subdomain Routing Works

### 1. User visits `healss.kryloss.com`
### 2. Middleware detects the `healss` subdomain
### 3. Automatically redirects to `/healss-subdomain`
### 4. SubdomainLayout detects subdomain and renders Healss layout
### 5. User sees the Healss workout tracker without main navigation

## File Structure

```
src/
├── app/
│   ├── healss-subdomain/          # Healss subdomain pages
│   │   ├── page.tsx              # Main workout tracker
│   │   ├── nutrition/page.tsx    # Nutrition page
│   │   ├── progress/page.tsx     # Progress page
│   │   ├── layout.tsx            # Healss-specific layout
│   │   └── components/
│   │       └── healss-nav.tsx    # Healss navigation
│   └── layout.tsx                # Root layout with subdomain detection
├── components/
│   └── subdomain-layout.tsx      # Dynamic layout selector
├── lib/
│   └── subdomains.ts             # Subdomain utilities
└── middleware.ts                  # Subdomain routing middleware
```

## Adding New Subdomains

1. **Update `subdomains.ts`**:
   ```typescript
   {
     name: "NewApp",
     url: "https://newapp.kryloss.com",
     description: "New application description",
     route: "/newapp-subdomain"
   }
   ```

2. **Update `middleware.ts`**:
   ```typescript
   const subdomains = {
     'healss': '/healss-subdomain',
     'notify': '/notify-subdomain',
     'newapp': '/newapp-subdomain',  // Add this line
   }
   ```

3. **Create the subdomain pages** in `src/app/newapp-subdomain/`

## Troubleshooting

### Subdomain not working?
1. Check DNS configuration
2. Verify Vercel domain settings
3. Check browser console for errors
4. Ensure middleware is properly configured

### Wrong layout showing?
1. Check `shouldUseSubdomainLayout()` function
2. Verify subdomain detection logic
3. Check browser hostname parsing

### Build errors?
1. Run `npm run build` to check for TypeScript errors
2. Ensure all imports are correct
3. Check for unused variables/imports

## Benefits

- **Automatic Routing**: Users automatically get the right experience
- **Clean URLs**: `healss.kryloss.com` instead of `kryloss.com/healss-subdomain`
- **Separate Layouts**: Each subdomain can have its own design
- **Scalable**: Easy to add new subdomains
- **SEO Friendly**: Each subdomain can be optimized separately

## Next Steps

1. **Test locally** to ensure routing works
2. **Deploy to Vercel** and test subdomain access
3. **Configure DNS** for production subdomains
4. **Add more subdomains** as needed
5. **Customize layouts** for each subdomain
