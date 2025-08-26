-- Enable the pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a record into a queue table for processing
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

-- Create the email queue table if it doesn't exist
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON public.email_queue(user_id);

-- Create the trigger on the auth.users table
DROP TRIGGER IF EXISTS trigger_new_user_signup ON auth.users;
CREATE TRIGGER trigger_new_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- Create a function to process the email queue
CREATE OR REPLACE FUNCTION public.process_email_queue()
RETURNS void AS $$
DECLARE
  queue_item RECORD;
BEGIN
  -- Process pending welcome emails
  FOR queue_item IN 
    SELECT * FROM public.email_queue 
    WHERE status = 'pending' 
    AND email_type = 'welcome'
    ORDER BY created_at ASC
    LIMIT 10
  LOOP
    BEGIN
      -- Update status to processing
      UPDATE public.email_queue 
      SET status = 'processing', updated_at = NOW()
      WHERE id = queue_item.id;
      
      -- Here you would call your email service
      -- For now, we'll just mark it as sent
      UPDATE public.email_queue 
      SET status = 'sent', sent_at = NOW(), updated_at = NOW()
      WHERE id = queue_item.id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Update status to failed
      UPDATE public.email_queue 
      SET status = 'failed', error_message = SQLERRM, updated_at = NOW()
      WHERE id = queue_item.id;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.email_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_email_queue() TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own email queue items" ON public.email_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all email queue items" ON public.email_queue
  FOR ALL USING (auth.role() = 'service_role');
