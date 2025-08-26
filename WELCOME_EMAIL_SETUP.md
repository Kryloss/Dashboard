# Welcome Email Setup Guide for Supabase

This guide will help you set up automatic welcome emails for new users in your Supabase project.

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Email Service**: Choose between:
   - **Resend** (recommended for production)
   - **Supabase's built-in email service**
   - **Other email providers** (SendGrid, Mailgun, etc.)

## Step 1: Environment Variables

Add these to your `.env.local` file:

```bash
# For Resend (recommended)
RESEND_API_KEY=your_resend_api_key

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 2: Install Dependencies

```bash
npm install resend @react-email/components
```

## Step 3: Supabase Dashboard Configuration

### 3.1 Enable Email Confirmation

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Templates**, enable **Confirm signup**
4. Customize the email template if desired

### 3.2 Configure SMTP Settings (Optional)

If using Supabase's built-in email service:

1. Go to **Settings** → **API**
2. Under **SMTP Settings**, configure your email provider
3. Test the connection

## Step 4: Database Setup

### 4.1 Run the Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the email queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON public.email_queue(user_id);

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_queue (user_id, email, full_name, email_type, status, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    'welcome',
    'pending',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_new_user_signup ON auth.users;
CREATE TRIGGER trigger_new_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.email_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own email queue items" ON public.email_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all email queue items" ON public.email_queue
  FOR ALL USING (auth.role() = 'service_role');
```

## Step 5: Deploy Edge Function

### 5.1 Deploy the Function

```bash
# Navigate to your project root
cd /path/to/your/project

# Deploy the Edge Function
supabase functions deploy process-email-queue
```

### 5.2 Set Function Secrets

```bash
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 6: Set Up Cron Job

### 6.1 Create Cron Job

In your Supabase Dashboard:

1. Go to **Database** → **Functions**
2. Create a new function:

```sql
-- Create a cron job to process emails every 5 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  'SELECT process_email_queue();'
);
```

### 6.2 Alternative: Manual Processing

You can also call the Edge Function manually or set up a webhook:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer your_anon_key"
```

## Step 7: Test the Setup

### 7.1 Create a Test User

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Fill in the details and create the user
4. Check the `email_queue` table for the new entry

### 7.2 Monitor the Process

1. Check the `email_queue` table status
2. Monitor Edge Function logs
3. Check your email inbox for the welcome email

## Step 8: Customization

### 8.1 Modify Email Template

Edit `src/emails/welcome-email.tsx` to customize:
- Branding and colors
- Content and messaging
- Call-to-action buttons
- Footer information

### 8.2 Add More Email Types

Extend the system to support:
- Password reset emails
- Account verification emails
- Marketing emails
- Notification emails

## Troubleshooting

### Common Issues

1. **Emails not sending**:
   - Check API keys and environment variables
   - Verify SMTP configuration
   - Check Edge Function logs

2. **Database errors**:
   - Ensure all migrations are applied
   - Check RLS policies
   - Verify trigger function exists

3. **Edge Function deployment issues**:
   - Check function logs
   - Verify secrets are set
   - Ensure proper permissions

### Debug Commands

```bash
# Check Edge Function logs
supabase functions logs process-email-queue

# Test the function locally
supabase functions serve process-email-queue

# Check database status
supabase db reset
```

## Production Considerations

1. **Rate Limiting**: Implement rate limiting for email sending
2. **Error Handling**: Add comprehensive error handling and retry logic
3. **Monitoring**: Set up alerts for failed emails
4. **Backup**: Implement fallback email services
5. **Compliance**: Ensure GDPR and CAN-SPAM compliance

## Support

If you encounter issues:

1. Check the Supabase documentation
2. Review Edge Function logs
3. Verify database triggers and functions
4. Test with a simple email first

## Next Steps

After setting up welcome emails, consider:

1. **Email Analytics**: Track open rates and click-through rates
2. **A/B Testing**: Test different email templates
3. **Personalization**: Add dynamic content based on user data
4. **Automation**: Set up drip campaigns and follow-up emails
