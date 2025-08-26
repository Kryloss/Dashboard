# Welcome Email Setup Guide 📧

## Current Status
✅ **Edge Function Created**: `supabase/functions/send-welcome-email/index.ts`
✅ **Email Service Integration**: Resend email service configured
✅ **Auth Integration**: Welcome emails called after signup and via trigger button
❌ **Not Deployed**: Function needs to be deployed to Supabase
❌ **API Key Missing**: RESEND_API_KEY needs to be configured

## Quick Setup Steps

### 1. Set Up Resend Email Service (Recommended)
1. **Sign up at [resend.com](https://resend.com)** (free tier available)
2. **Get your API key** from the dashboard
3. **Add to your environment variables**:
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   ```

### 2. Deploy the Edge Function
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Deploy the function
supabase functions deploy send-welcome-email
```

### 3. Update Environment Variables
Add to your `.env.local` file:
```bash
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## How It Works Now

### Account Creation Flow
1. User signs up → Profile created → Welcome email sent automatically
2. Uses Edge Function to send email via Resend
3. Same logic as working reset password functionality

### Manual Trigger Flow
1. User clicks "Send Welcome Email" button on dashboard
2. Calls `triggerWelcomeEmail()` action
3. Edge Function sends welcome email via Resend

### Email Content
- Professional HTML email template
- Personalized with user's name
- Links to dashboard
- Responsive design

## Testing Your Setup

### 1. Test Account Creation
1. Sign up a new user
2. Check if welcome email is received
3. Check Edge Function logs in Supabase dashboard

### 2. Test Manual Trigger
1. Go to dashboard
2. Click "Test Welcome Email" button
3. Check if email is received
4. Check browser console for any errors

### 3. Check Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Check logs for `send-welcome-email` function

## Troubleshooting

### Emails Not Sending?
- ✅ Check if `RESEND_API_KEY` is set
- ✅ Verify Edge Function is deployed
- ✅ Check Edge Function logs in Supabase dashboard
- ✅ Verify email isn't in spam/junk folder

### Edge Function Errors?
- ✅ Check function deployment status
- ✅ Verify function permissions
- ✅ Check function logs for specific errors
- ✅ Ensure environment variables are set in Supabase

### Common Issues
1. **"RESEND_API_KEY not configured"** → Set the environment variable
2. **"Function not found"** → Deploy the Edge Function
3. **"Permission denied"** → Check Supabase function policies
4. **"Email not received"** → Check spam folder and Resend dashboard

## Environment Variables Required

```bash
# Required for email functionality
RESEND_API_KEY=re_your_api_key_here

# Required for email content
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps

1. **Get Resend API key** from [resend.com](https://resend.com)
2. **Deploy the Edge Function** using Supabase CLI
3. **Set environment variables** in both local and Supabase
4. **Test the signup flow** with a new account
5. **Test the manual trigger** from dashboard
6. **Monitor Edge Function logs** for any issues

## Alternative Email Services

If you prefer not to use Resend, you can modify the Edge Function to use:
- **SendGrid** - Popular email service
- **AWS SES** - Amazon's email service
- **Mailgun** - Developer-friendly email service
- **Supabase built-in** - Limited but no external dependencies

Your welcome emails will work once you complete these setup steps! 🎉

## Support

If you encounter issues:
1. Check Edge Function logs in Supabase dashboard
2. Verify environment variables are set correctly
3. Test with a simple email first
4. Check browser console for client-side errors
