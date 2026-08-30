-- Seed control plane. Provider tokens are encrypted server-side and intentionally have no browser SELECT policy.
create extension if not exists pgcrypto;
create type public.project_type as enum ('business_website', 'lead_website', 'booking_website');
create type public.project_status as enum ('draft', 'ready', 'building', 'live', 'needs_attention');
create type public.connection_status as enum ('not_connected', 'connecting', 'connected', 'needs_attention');
create type public.run_status as enum ('pending', 'running', 'waiting_for_user', 'completed', 'failed', 'rolled_back');
create table public.profiles (id uuid primary key default gen_random_uuid(), auth_user_id uuid not null unique references auth.users(id) on delete cascade, display_name text, avatar_url text, created_at timestamptz not null default now());
create table public.workspaces (id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references public.profiles(id) on delete cascade, name text not null check (char_length(name) between 1 and 120), created_at timestamptz not null default now());
create table public.projects (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, name text not null check (char_length(name) between 1 and 120), slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), project_type public.project_type not null, status public.project_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id, slug));
create table public.provider_connections (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, provider text not null check (provider in ('github','supabase','vercel','openai')), encrypted_access_data text not null, scopes text[] not null default '{}', status public.connection_status not null default 'not_connected', connected_at timestamptz, updated_at timestamptz not null default now(), unique(workspace_id, provider));
create table public.project_resources (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, provider text not null, external_id text not null, metadata_json jsonb not null default '{}', status text not null, last_synced_at timestamptz, unique(project_id, provider, external_id));
create table public.seed_runs (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, user_request text not null, status public.run_status not null default 'pending', created_at timestamptz not null default now(), completed_at timestamptz);
create table public.seed_run_steps (id uuid primary key default gen_random_uuid(), seed_run_id uuid not null references public.seed_runs(id) on delete cascade, step_type text not null, status public.run_status not null default 'pending', input_summary text, output_summary text, error_code text, error_message text, started_at timestamptz, completed_at timestamptz);
create table public.project_snapshots (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, git_commit_sha text, schema_hash text, deployment_id text, created_at timestamptz not null default now());
create table public.audit_events (id uuid primary key default gen_random_uuid(), actor_user_id uuid not null references public.profiles(id) on delete cascade, workspace_id uuid not null references public.workspaces(id) on delete cascade, project_id uuid references public.projects(id) on delete set null, seed_run_id uuid references public.seed_runs(id) on delete set null, tool_name text not null, created_at timestamptz not null default now(), metadata jsonb not null default '{}');
alter table public.profiles enable row level security; alter table public.workspaces enable row level security; alter table public.projects enable row level security; alter table public.provider_connections enable row level security; alter table public.project_resources enable row level security; alter table public.seed_runs enable row level security; alter table public.seed_run_steps enable row level security; alter table public.project_snapshots enable row level security; alter table public.audit_events enable row level security;
create function public.is_workspace_member(target_workspace_id uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.workspaces w join public.profiles p on p.id = w.owner_user_id where w.id = target_workspace_id and p.auth_user_id = auth.uid()) $$;
create policy "profile owner" on public.profiles for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
create policy "workspace owner read" on public.workspaces for select using (public.is_workspace_member(id));
create policy "workspace owner update" on public.workspaces for update using (public.is_workspace_member(id)) with check (public.is_workspace_member(id));
create policy "workspace owner delete" on public.workspaces for delete using (public.is_workspace_member(id));
create policy "workspace owner insert" on public.workspaces for insert with check (exists (select 1 from public.profiles p where p.id = owner_user_id and p.auth_user_id = auth.uid()));
create policy "project workspace member" on public.projects for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "resources workspace member" on public.project_resources for all using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id)));
create policy "runs workspace member" on public.seed_runs for all using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id)));
create policy "run steps workspace member" on public.seed_run_steps for all using (exists (select 1 from public.seed_runs r join public.projects p on p.id = r.project_id where r.id = seed_run_id and public.is_workspace_member(p.workspace_id))) with check (exists (select 1 from public.seed_runs r join public.projects p on p.id = r.project_id where r.id = seed_run_id and public.is_workspace_member(p.workspace_id)));
create policy "snapshots workspace member" on public.project_snapshots for all using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id)));
create policy "audit workspace member" on public.audit_events for select using (public.is_workspace_member(workspace_id));
-- provider_connections deliberately has no user policy. Read/write it only via authenticated server routes using the service role after ownership checks.

create function public.handle_new_seed_user() returns trigger language plpgsql security definer set search_path = public as $$
declare new_profile_id uuid;
begin
  insert into public.profiles (auth_user_id, display_name, avatar_url) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url') returning id into new_profile_id;
  insert into public.workspaces (owner_user_id, name) values (new_profile_id, 'My workspace');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_seed_user();

-- Atomic service-role-only claim for long-running Seed jobs.
create function public.claim_next_seed_run() returns setof public.seed_runs language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.seed_runs
  set status = 'running'
  where id = (
    select id from public.seed_runs where status = 'pending' order by created_at for update skip locked limit 1
  )
  returning *;
end;
$$;
revoke all on function public.claim_next_seed_run() from public, anon, authenticated;
grant execute on function public.claim_next_seed_run() to service_role;
