-- Enable network HTTP from Postgres
create extension if not exists pg_net;

-- Add welcomed_at column if it doesn't exist
alter table public.profiles add column if not exists welcomed_at timestamp with time zone;

-- Trigger function: POST to our Next.js webhook when a profile is created
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
begin
  -- Only act if email exists (defensive)
  if new.email is null then
    return new;
  end if;

  -- Only act if this is a new profile (welcomed_at is null)
  if new.welcomed_at is not null then
    return new;
  end if;

  -- Fire-and-forget HTTP POST; ignore response (best effort)
  perform net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'content-type','application/json',
      'authorization', _auth
    ),
    body := jsonb_build_object('email', new.email, 'username', new.username)
  );

  -- Mark welcomed_at so we know it was triggered
  update public.profiles set welcomed_at = now() where id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_profiles_welcome on public.profiles;
create trigger trg_profiles_welcome
after insert on public.profiles
for each row execute procedure public.notify_welcome();
