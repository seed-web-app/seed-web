-- Admin catalog categories, richer part copy, and manually prepared customer offers.

begin;

alter table public.parts
  add column if not exists short_description text,
  add column if not exists description text;

create table if not exists public.part_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.part_categories (name, short_description)
values
  ('Body Panels', 'Primer-ready exterior body components'),
  ('Engine & Drivetrain', 'Engine, transmission, cooling and service parts'),
  ('Electrical & Lighting', 'Lighting, sensors and hybrid electrical parts'),
  ('Suspension & Steering', 'Ride, handling and steering components'),
  ('Brakes & Wheels', 'Brake, hub, wheel and ABS components'),
  ('Interior & Accessories', 'Cabin trim, mats and practical accessories')
on conflict (name) do nothing;

create table if not exists public.customer_offers (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  part_id uuid references public.parts(id) on delete set null,
  title text not null,
  message text not null,
  reference_price numeric(10,2),
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'email', 'phone')),
  status text not null default 'prepared' check (status in ('prepared', 'sent', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_customer_offers_customer on public.customer_offers(customer_id);
create index if not exists idx_customer_offers_created_at on public.customer_offers(created_at desc);
create index if not exists idx_customer_offers_status on public.customer_offers(status);

alter table public.part_categories enable row level security;
alter table public.customer_offers enable row level security;

drop policy if exists "Categories readable by authenticated users" on public.part_categories;
create policy "Categories readable by authenticated users"
  on public.part_categories for select to authenticated using (true);

drop policy if exists "Admins manage categories" on public.part_categories;
create policy "Admins manage categories"
  on public.part_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage personalized offers" on public.customer_offers;
create policy "Admins manage personalized offers"
  on public.customer_offers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.part_categories to authenticated;
grant select, insert, update, delete on public.customer_offers to authenticated;

commit;
