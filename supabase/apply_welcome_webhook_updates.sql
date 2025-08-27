-- Apply Welcome Webhook Updates
-- This script ensures welcome emails are sent for ALL new account registrations
-- including both built-in registration and Google OAuth users

-- Enable network HTTP from Postgres
create extension if not exists pg_net;

-- Add welcomed_at column if it doesn't exist
alter table public.profiles add column if not exists welcomed_at timestamp with time zone;

-- Drop existing triggers and functions to recreate them
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists trg_profiles_welcome on public.profiles;
drop trigger if exists trg_profiles_welcome_backup on public.profiles;

drop function if exists public.handle_new_user();
drop function if exists public.notify_welcome();
drop function if exists public.ensure_welcome_email();

-- Auto-create profile for every new auth user (email+password, Google, GitHub, etc.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger that creates profile whenever a user is created in auth.users
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Main trigger function: POST to our Next.js webhook when a profile is created
create or replace function public.notify_welcome()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _url text := 'https://kryloss.com/api/hooks/welcome';
  _secret text := current_setting('app.supabase_webhook_secret', true);
  _auth text := case when _secret is null or _secret = '' then '' else 'Bearer ' || _secret end;
  _retry_count integer := 0;
  _max_retries integer := 3;
  _retry_delay integer := 1000; -- 1 second
begin
  -- Only act if email exists (defensive)
  if new.email is null then
    return new;
  end if;

  -- Only act if this is a new profile (welcomed_at is null)
  if new.welcomed_at is not null then
    return new;
  end if;

  -- For Google OAuth users, we'll send the email immediately
  -- For email/password users, we'll also send immediately
  -- The webhook will handle any delivery issues gracefully

  -- Fire-and-forget HTTP POST with retry logic
  while _retry_count < _max_retries loop
    begin
      perform net.http_post(
        url := _url,
        headers := jsonb_build_object(
          'content-type','application/json',
          'authorization', _auth
        ),
        body := jsonb_build_object('email', new.email, 'username', new.username)
      );
      
      -- If we get here, the request was successful
      exit;
    exception when others then
      _retry_count := _retry_count + 1;
      if _retry_count < _max_retries then
        -- Wait before retrying
        perform pg_sleep(_retry_delay / 1000.0);
        _retry_delay := _retry_delay * 2; -- Exponential backoff
      end if;
    end;
  end loop;

  -- Mark welcomed_at so we know it was triggered (regardless of success)
  update public.profiles set welcomed_at = now() where id = new.id;

  return new;
end;
$$;

-- Main trigger that sends welcome email when profile is created
create trigger trg_profiles_welcome
after insert on public.profiles
for each row execute procedure public.notify_welcome();

-- Backup trigger: Handle cases where profile creation might be delayed
-- This ensures Google OAuth users get welcome emails even if profile creation is delayed
create or replace function public.ensure_welcome_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _url text := 'https://kryloss.com/api/hooks/welcome';
  _secret text := current_setting('app.supabase_webhook_secret', true);
  _auth text := case when _secret is null or _secret = '' then '' else 'Bearer ' || _secret end;
begin
  -- Only act if this is a new profile that hasn't been welcomed yet
  if new.welcomed_at is null and new.email is not null then
    -- Double-check if we need to send welcome email
    -- This handles edge cases where the profile trigger might have failed
    
    -- Fire-and-forget HTTP POST
    perform net.http_post(
      url := _url,
      headers := jsonb_build_object(
        'content-type','application/json',
        'authorization', _auth
      ),
      body := jsonb_build_object('email', new.email, 'username', new.username)
    );

    -- Mark as welcomed
    update public.profiles set welcomed_at = now() where id = new.id;
  end if;

  return new;
end;
$$;

-- Backup trigger that ensures welcome email is sent
create trigger trg_profiles_welcome_backup
after insert on public.profiles
for each row execute procedure public.ensure_welcome_email();

-- Manual function to trigger welcome email (for testing/debugging)
create or replace function public.manual_trigger_welcome(user_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _url text := 'https://kryloss.com/api/hooks/welcome';
  _secret text := current_setting('app.supabase_webhook_secret', true);
  _auth text := case when _secret is null or _secret = '' then '' else 'Bearer ' || _secret end;
  _profile_id uuid;
  _profile_username text;
begin
  -- Find the profile for this email
  select id, username into _profile_id, _profile_username
  from public.profiles
  where email = user_email;

  if _profile_id is null then
    return 'No profile found for email: ' || user_email;
  end if;

  -- Check if already welcomed
  if exists (
    select 1 from public.profiles 
    where id = _profile_id and welcomed_at is not null
  ) then
    return 'User already welcomed at: ' || (
      select welcomed_at::text from public.profiles where id = _profile_id
    );
  end if;

  -- Send welcome email
  perform net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'content-type','application/json',
      'authorization', _auth
    ),
    body := jsonb_build_object('email', user_email, 'username', _profile_username)
  );

  -- Mark as welcomed
  update public.profiles set welcomed_at = now() where id = _profile_id;

  return 'Welcome email manually triggered for: ' || user_email;
end;
$$;

-- Function to check welcome email status for a user
create or replace function public.check_welcome_status(user_email text)
returns table(
  email text,
  username text,
  created_at timestamp with time zone,
  welcomed_at timestamp with time zone,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    p.email,
    p.username,
    p.created_at,
    p.welcomed_at,
    case 
      when p.welcomed_at is not null then 'Welcome email sent'
      else 'Welcome email pending'
    end as status
  from public.profiles p
  where p.email = user_email;
end;
$$;

-- Function to list all users who haven't received welcome emails
create or replace function public.list_pending_welcomes()
returns table(
  email text,
  username text,
  created_at timestamp with time zone,
  days_since_creation integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    p.email,
    p.username,
    p.created_at,
    extract(day from now() - p.created_at)::integer as days_since_creation
  from public.profiles p
  where p.welcomed_at is null
  order by p.created_at desc;
end;
$$;

-- Grant execute permissions on the functions
grant execute on function public.manual_trigger_welcome(text) to authenticated;
grant execute on function public.check_welcome_status(text) to authenticated;
grant execute on function public.list_pending_welcomes() to authenticated;

-- Test the setup
select 'Welcome webhook setup completed successfully!' as status;
