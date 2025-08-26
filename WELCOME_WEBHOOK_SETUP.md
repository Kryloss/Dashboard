# Welcome Webhook Setup

This document describes how to set up the database-triggered welcome email system that automatically sends welcome emails when new user profiles are created.

## Overview

The system works as follows:
1. **Database Trigger**: When a new row is inserted into `public.profiles`, a trigger fires
2. **HTTP Webhook**: The trigger sends a POST request to `/api/hooks/welcome`
3. **Email Sending**: The API route validates the request and sends a welcome email via Resend

## Prerequisites

- Supabase project with `pg_net` extension enabled
- Resend account and API key
- Next.js application deployed and accessible

## Environment Variables

Add these to your `.env.local` file:

```bash
# Resend configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM=noreply@yourdomain.com

# Supabase webhook secret (generate a secure random string)
SUPABASE_WEBHOOK_SECRET=your_secure_webhook_secret_here
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install resend @react-email/components @react-email/render
```

### 2. Deploy the API Route

The API route at `/api/hooks/welcome` is already created and will handle incoming webhook requests.

### 3. Set Up Database Trigger

Run the SQL commands from `supabase/welcome_webhook.sql` in your Supabase SQL editor:

```sql
-- Enable network HTTP from Postgres
create extension if not exists pg_net;

-- Create the trigger function and trigger
-- (see the full SQL file for complete implementation)
```

### 4. Configure Supabase Settings

Set the webhook secret in your Supabase project:

```sql
-- Set the webhook secret (replace with your actual secret)
select set_config('app.supabase_webhook_secret', 'your_secure_webhook_secret_here', false);
```

## Testing

### Test the Webhook

You can test the webhook endpoint manually:

```bash
curl -X POST https://yourdomain.com/api/hooks/welcome \
  -H "Authorization: Bearer your_secure_webhook_secret_here" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "username": "TestUser"}'
```

### Test Email Sending

Use the test function in your code:

```typescript
import { testResendConfig } from '@/lib/email/resend';

// Test if Resend is configured correctly
const isConfigured = await testResendConfig();
console.log('Resend configured:', isConfigured);
```

## Security Features

- **Authorization**: Webhook requests must include the correct Bearer token
- **Replay Protection**: Duplicate emails within 10 minutes are automatically skipped
- **Input Validation**: Email addresses are validated before processing
- **Error Handling**: Internal errors are logged but not exposed to clients

## Monitoring

The system logs all activities:
- Successful email sends
- Authorization failures
- Duplicate email attempts
- Configuration errors

Check your application logs for webhook activity.

## Troubleshooting

### Common Issues

1. **"Webhook not configured"**: Check that `SUPABASE_WEBHOOK_SECRET` is set
2. **"Unauthorized"**: Verify the Bearer token in the webhook request
3. **"Cannot send welcome email"**: Check Resend configuration (`RESEND_API_KEY`, `RESEND_FROM`)
4. **Database trigger not firing**: Ensure `pg_net` extension is enabled and the trigger is created

### Debug Steps

1. Check environment variables are loaded
2. Verify the database trigger exists and is active
3. Test the webhook endpoint manually
4. Check Resend API key permissions
5. Review application logs for detailed error messages

## Architecture Notes

- **Node Runtime**: The API route uses Node.js runtime for Resend SDK compatibility
- **In-Memory Cache**: Replay protection uses a simple in-memory Map (clears every 5 minutes)
- **Fire-and-Forget**: Database trigger doesn't wait for webhook response
- **Idempotent**: Multiple triggers for the same email won't send duplicate emails

## Production Considerations

- Use a strong, randomly generated webhook secret
- Monitor webhook delivery rates and failures
- Consider implementing persistent replay protection for high-traffic scenarios
- Set up alerting for webhook failures
- Use environment-specific webhook URLs (staging vs production)
