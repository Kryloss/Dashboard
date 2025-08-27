# 🧪 Testing Google OAuth Welcome Email Flow

## **What We've Implemented:**

1. **✅ Database Trigger**: Auto-creates profile for every new auth user
2. **✅ Welcome Webhook**: Sends welcome email when profile is created  
3. **✅ Consistent Redirect**: Google OAuth users get same success message as built-in signup
4. **✅ Extended Delay**: 2-second delay to ensure database trigger fires

## **Test Steps:**

### **1. Run the Database Setup**
```sql
-- Execute the complete supabase/welcome_webhook.sql file in Supabase
-- This creates the triggers and functions
```

### **2. Set Environment Variables**
```bash
# In your .env.local
SUPABASE_WEBHOOK_SECRET=your_secure_webhook_secret
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=no-reply@kryloss.com
```

### **3. Test Google OAuth Flow**
1. **Go to signup page** → Click "Continue with Google"
2. **Complete Google OAuth** → Should redirect to callback page
3. **Wait 2 seconds** → "Completing sign in..." message
4. **Redirect to login** → Success message: "Account created successfully! Welcome email sent."
5. **Check email** → Welcome email should arrive

### **4. Verify Database**
```sql
-- Check if profile was created
SELECT * FROM public.profiles WHERE email = 'your-google-email@example.com';

-- Check if welcomed_at is set
SELECT id, email, welcomed_at FROM public.profiles WHERE welcomed_at IS NOT NULL;
```

### **5. Check Webhook Logs**
- **Browser console**: Look for "Waiting for profile creation and welcome email..."
- **Application logs**: Look for webhook activity
- **Resend dashboard**: Check if email was sent

## **Expected Flow:**

```
Google OAuth → Callback Page → 2s Delay → Login Success Page → Welcome Email Sent
```

## **Troubleshooting:**

### **If No Email:**
1. **Check database trigger**: Verify `on_auth_user_created` exists
2. **Check webhook trigger**: Verify `trg_profiles_welcome` exists  
3. **Check environment**: Verify `SUPABASE_WEBHOOK_SECRET` is set
4. **Check Resend**: Verify `RESEND_API_KEY` and `RESEND_FROM` are set

### **If Profile Not Created:**
1. **Check RLS policies**: Ensure triggers can insert into profiles
2. **Check permissions**: Verify `SECURITY DEFINER` is set
3. **Check logs**: Look for database errors

### **If Webhook Not Firing:**
1. **Check pg_net extension**: Must be enabled
2. **Check webhook secret**: Must match environment variable
3. **Check URL**: Must be accessible from Supabase

## **Success Indicators:**

✅ **Profile created** in `public.profiles` table  
✅ **`welcomed_at` timestamp** set  
✅ **Success message** shown on login page  
✅ **Welcome email** received  
✅ **Webhook logs** show successful POST to `/api/hooks/welcome`  

## **Next Steps:**

Once this flow works:
1. **Test built-in signup** to ensure consistency
2. **Test with other OAuth providers** (GitHub, etc.)
3. **Monitor webhook reliability** in production
4. **Set up alerting** for webhook failures

The system should now work identically for both Google OAuth and built-in registration! 🎉
