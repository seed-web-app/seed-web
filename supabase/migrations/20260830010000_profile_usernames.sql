alter table public.profiles
  add column if not exists username text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (
        username is null
        or username ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
      );
  end if;
end
$$;

create unique index if not exists profiles_username_unique
  on public.profiles (username)
  where username is not null;

create or replace function public.claim_seed_username(requested_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_username text := lower(trim(requested_username));
  existing_username text;
  changed_rows integer;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if normalized_username !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' then
    raise exception 'invalid_username' using errcode = '22023';
  end if;

  if normalized_username = any(array[
    'admin','api','app','auth','bestmodel','dashboard','docs','ftp','help',
    'localhost','login','mail','seed','status','support','www'
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
    get diagnostics changed_rows = row_count;
  exception when unique_violation then
    raise exception 'username_unavailable' using errcode = '23505';
  end;

  if changed_rows = 0 then
    select p.username
    into existing_username
    from public.profiles p
    where p.auth_user_id = auth.uid();
    return existing_username;
  end if;

  return normalized_username;
end;
$$;

revoke all on function public.claim_seed_username(text) from public, anon;
grant execute on function public.claim_seed_username(text) to authenticated;
