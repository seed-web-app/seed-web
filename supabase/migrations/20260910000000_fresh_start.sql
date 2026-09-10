begin;

-- This project is intentionally reset to the smallest schema needed by the
-- new app. Supabase-managed auth and storage schemas are left untouched.
drop schema if exists public cascade;
create schema public authorization postgres;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant create on schema public to postgres, service_role;

alter default privileges for role postgres in schema public
  grant all on tables to postgres, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to postgres, service_role;
alter default privileges for role postgres in schema public
  grant all on functions to postgres, service_role;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  username text,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null
    or username ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
  )
);

create unique index profiles_username_unique
  on public.profiles (username)
  where username is not null;

alter table public.profiles enable row level security;

create policy "profile owner can read"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id);

grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

create function public.handle_new_app_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (auth_user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_app_user();

revoke all on function public.handle_new_app_user()
  from public, anon, authenticated;

create function public.claim_username(requested_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_username text := lower(trim(requested_username));
  existing_username text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if normalized_username !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' then
    raise exception 'invalid_username' using errcode = '22023';
  end if;

  if normalized_username = any(array[
    'account','admin','api','app','auth','dashboard','help','localhost',
    'login','status','support','www'
  ]) then
    raise exception 'username_reserved' using errcode = '22023';
  end if;

  select p.username
    into existing_username
    from public.profiles p
    where p.auth_user_id = auth.uid();

  if not found then
    raise exception 'profile_not_found' using errcode = '42501';
  end if;

  if existing_username is not null then
    return existing_username;
  end if;

  begin
    update public.profiles p
      set username = normalized_username
      where p.auth_user_id = auth.uid()
        and p.username is null;
  exception when unique_violation then
    raise exception 'username_unavailable' using errcode = '23505';
  end;

  return normalized_username;
end;
$$;

revoke all on function public.claim_username(text) from public, anon;
grant execute on function public.claim_username(text) to authenticated, service_role;

commit;

notify pgrst, 'reload schema';
