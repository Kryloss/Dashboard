# Subdomain System Setup Guide

## Overview

This project now includes a complete subdomain routing system that automatically detects when users visit subdomains and serves the appropriate content directly from the subdomain URL.

## How It Works

### 1. Middleware (`middleware.ts`)
- Detects incoming requests to subdomains
- **URL Rewriting**: Serves content from internal routes while keeping users on the subdomain URL
- Handles routing for `healss.kryloss.com` → serves `/healss-subdomain` content
- **No redirects** - users stay on the clean subdomain URL

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
- **Healss Subdomain**: `healss.kryloss.com` → Healss workout tracker (direct access)
- **Notify Subdomain**: `notify.kryloss.com` → Notification system (direct access)

## How Subdomain Routing Works

### 1. User visits `healss.kryloss.com`
### 2. Middleware detects the `healss` subdomain
### 3. **URL Rewriting**: Serves content from `/healss-subdomain` while keeping URL as `healss.kryloss.com`
### 4. SubdomainLayout detects subdomain and renders Healss layout
### 5. User sees the Healss workout tracker at `healss.kryloss.com` (no redirects!)

## Key Benefits of URL Rewriting

- **Clean URLs**: Users stay on `healss.kryloss.com` instead of being redirected to `/healss-subdomain`
- **Better UX**: No page reloads or URL changes
- **SEO Friendly**: Search engines see the clean subdomain URLs
- **Bookmarkable**: Users can bookmark `healss.kryloss.com` directly
- **Professional**: Looks like a dedicated subdomain application

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
   - **Healss subdomain**: `https://healss.kryloss.com` (direct access!)
   - Healss page: `https://healss.kryloss.com` (same as above)

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
└── middleware.ts                  # Subdomain routing middleware (URL rewriting)
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

- **Direct Access**: Users can access `healss.kryloss.com` directly
- **No Redirects**: Clean, professional user experience
- **Separate Layouts**: Each subdomain can have its own design
- **Scalable**: Easy to add new subdomains
- **SEO Friendly**: Better search engine optimization with clean URLs

## Next Steps

1. **Test locally** to ensure routing works
2. **Deploy to Vercel** and test subdomain access
3. **Configure DNS** for production subdomains
4. **Add more subdomains** as needed
5. **Customize layouts** for each subdomain

## Technical Details

### URL Rewriting vs Redirects
- **Before**: `healss.kryloss.com` → redirect → `healss.kryloss.com/healss-subdomain`
- **Now**: `healss.kryloss.com` → serves `/healss-subdomain` content directly
- **Result**: Users see `healss.kryloss.com` in their browser while getting the correct content
