# Subdomain Setup for Kryloss Platform

## Overview

The Kryloss platform now uses subdomains to provide dedicated experiences for different services. This setup allows for better separation of concerns and improved user experience.

## Current Subdomains

### Healss
- **Production**: https://Healss.kryloss.com
- **Development**: http://Healss.localhost:3000
- **Internal Route**: `/Healss-subdomain`

### Notify (Planned)
- **Production**: https://notify.kryloss.com
- **Development**: http://notify.localhost:3000
- **Internal Route**: `/notify-subdomain`

## Architecture

### File Structure
```
src/app/
├── Healss-subdomain/          # Healss subdomain content
│   ├── layout.tsx               # Healss-specific layout
│   └── page.tsx                 # Healss main page
├── Healss/                   # Redirect page for old route
│   ├── layout.tsx               # Simple redirect layout
│   └── page.tsx                 # Redirect with auto-redirect
└── (Healss)/                 # REMOVED - old route structure
```

### Routing Logic

1. **Middleware** (`src/middleware.ts`): Intercepts requests and rewrites subdomain URLs to internal routes
2. **Next.js Config** (`next.config.ts`): Handles hostname-based routing
3. **Subdomain Configuration** (`src/lib/subdomains.ts`): Centralized subdomain management

### How It Works

1. User visits `Healss.kryloss.com`
2. Middleware detects the subdomain
3. Request is rewritten to `/Healss-subdomain`
4. Next.js serves the appropriate content
5. User sees the Healss interface

## Development Setup

### Local Development
To test subdomains locally:

1. **Update hosts file** (Windows: `C:\Windows\System32\drivers\etc\hosts`):
   ```
   127.0.0.1 Healss.localhost
   127.0.0.1 notify.localhost
   ```

2. **Access via**:
   - http://Healss.localhost:3000
   - http://notify.localhost:3000

### Production Deployment
- Ensure DNS records point subdomains to your hosting provider
- Configure your hosting provider to handle subdomain routing
- Update environment variables as needed

## Benefits

1. **Better Separation**: Each service has its own dedicated space
2. **Improved UX**: Users can bookmark specific services
3. **Scalability**: Easy to add new services without affecting existing ones
4. **SEO**: Better search engine optimization for individual services
5. **Maintenance**: Easier to maintain and update individual services

## Migration Notes

- Old `/Healss` route now redirects to the subdomain
- Users are automatically redirected after 5 seconds
- All existing functionality is preserved
- Navigation has been updated to use subdomain URLs

## Future Considerations

- **Authentication**: May need to handle cross-subdomain authentication
- **Styling**: Ensure consistent design tokens across subdomains
- **Performance**: Monitor subdomain performance and optimize as needed
- **Analytics**: Set up proper tracking for each subdomain

## Troubleshooting

### Common Issues

1. **Subdomain not working locally**:
   - Check hosts file configuration
   - Restart development server
   - Clear browser cache

2. **Middleware not working**:
   - Verify middleware.ts is in the correct location
   - Check Next.js configuration
   - Ensure proper import/export syntax

3. **Styling issues**:
   - Verify design tokens are properly imported
   - Check CSS module conflicts
   - Ensure consistent Tailwind configuration

### Debug Steps

1. Check browser console for errors
2. Verify middleware execution in server logs
3. Test routing with different hostnames
4. Validate Next.js configuration
