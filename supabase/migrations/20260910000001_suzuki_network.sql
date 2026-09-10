-- Migration: 20260910000001_suzuki_network.sql
-- Suzuki Parts Customer Network App (MVP)

begin;

-- 0. Clean up legacy starter schema
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_app_user() cascade;
drop function if exists public.claim_username(text) cascade;
drop table if exists public.inquiries cascade;
drop table if exists public.vehicles cascade;
drop table if exists public.parts cascade;
drop table if exists public.content_posts cascade;
drop table if exists public.dealer_settings cascade;
drop table if exists public.profiles cascade;

-- 1. Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_email on public.profiles(email);

-- 2. Vehicles table (Customer garage)
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  make text not null default 'Suzuki',
  model text not null,
  year integer not null,
  registration_no text,
  created_at timestamptz not null default now()
);

create index idx_vehicles_owner on public.vehicles(owner_id);

-- 3. Parts table
create table public.parts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  compatible_models text[] not null default '{}',
  price numeric(10,2) not null,
  condition_note text not null default 'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  primer_note text default 'Gray primer applied. Surface requires light sanding & finish coat paint matching.',
  photos text[] not null default '{}',
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  is_offer boolean not null default false,
  part_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_parts_category on public.parts(category);
create index idx_parts_status on public.parts(status);
create index idx_parts_is_offer on public.parts(is_offer);

-- 4. Inquiries table (Customer leads to dealer)
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  part_id uuid not null references public.parts(id) on delete cascade,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_inquiries_customer on public.inquiries(customer_id);
create index idx_inquiries_status on public.inquiries(status);
create index idx_inquiries_part on public.inquiries(part_id);
create index idx_inquiries_created_at on public.inquiries(created_at desc);

-- 5. Content Posts table (Dealer videos and advice)
create table public.content_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text not null,
  caption text,
  published_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_content_posts_published on public.content_posts(published_at desc);

-- 6. Dealer Settings table
create table public.dealer_settings (
  id text primary key default 'default',
  dealer_name text not null default 'Authorized Suzuki Parts Network',
  phone text not null default '+1 (800) 555-0199',
  whatsapp text not null default '+1 (555) 019-9823',
  address text not null default '450 Motorsport Expressway, Central Auto Mall',
  notification_email text not null default 'inquiries@suzukiparts-dealer.com',
  operating_hours text not null default 'Monday - Saturday: 8:00 AM - 6:30 PM',
  updated_at timestamptz not null default now()
);

insert into public.dealer_settings (id, dealer_name, phone, whatsapp, address, notification_email, operating_hours)
values (
  'default',
  'Authorized Suzuki Parts Network',
  '+1 (800) 555-0199',
  '+15550199823',
  '450 Motorsport Expressway, Central Auto Mall',
  'inquiries@suzukiparts-dealer.com',
  'Monday - Saturday: 8:00 AM - 6:30 PM'
)
on conflict (id) do nothing;

-- 7. Helper function to check if current authenticated user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- 8. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.parts enable row level security;
alter table public.inquiries enable row level security;
alter table public.content_posts enable row level security;
alter table public.dealer_settings enable row level security;

-- 9. Profiles Policies
create policy "Profiles are viewable by owner or admin"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile or admin"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "Insert profile on registration"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id or public.is_admin());

-- 10. Vehicles Policies
create policy "Vehicles viewable by owner or admin"
  on public.vehicles
  for select
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "Vehicles insertable by owner or admin"
  on public.vehicles
  for insert
  to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "Vehicles updatable by owner or admin"
  on public.vehicles
  for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "Vehicles deletable by owner or admin"
  on public.vehicles
  for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- 11. Parts Policies
create policy "Parts are readable by authenticated users"
  on public.parts
  for select
  to authenticated
  using (true);

create policy "Only admins can insert parts"
  on public.parts
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Only admins can update parts"
  on public.parts
  for update
  to authenticated
  using (public.is_admin());

create policy "Only admins can delete parts"
  on public.parts
  for delete
  to authenticated
  using (public.is_admin());

-- 12. Inquiries Policies
create policy "Inquiries viewable by customer or admin"
  on public.inquiries
  for select
  to authenticated
  using (customer_id = auth.uid() or public.is_admin());

create policy "Customers can create inquiries"
  on public.inquiries
  for insert
  to authenticated
  with check (customer_id = auth.uid() or public.is_admin());

create policy "Admins can update inquiries"
  on public.inquiries
  for update
  to authenticated
  using (public.is_admin());

create policy "Admins can delete inquiries"
  on public.inquiries
  for delete
  to authenticated
  using (public.is_admin());

-- 13. Content Posts Policies
create policy "Content posts readable by authenticated users"
  on public.content_posts
  for select
  to authenticated
  using (true);

create policy "Only admins can manage content posts"
  on public.content_posts
  for all
  to authenticated
  using (public.is_admin());

-- 14. Dealer Settings Policies
create policy "Dealer settings readable by authenticated users"
  on public.dealer_settings
  for select
  to authenticated
  using (true);

create policy "Only admins can update dealer settings"
  on public.dealer_settings
  for update
  to authenticated
  using (public.is_admin());

-- 15. User creation trigger from auth.users to public.profiles
create or replace function public.handle_new_network_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'customer'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_network_user();

-- Backfill any existing users in auth.users into public.profiles
insert into public.profiles (id, full_name, email, avatar_url, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email,
  u.raw_user_meta_data->>'avatar_url',
  case 
    when u.email = 'shouryasaad6@gmail.com' then 'admin'
    else 'customer'
  end
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

-- 16. Supabase Storage: setup parts bucket
insert into storage.buckets (id, name, public)
values ('parts', 'parts', true)
on conflict (id) do nothing;

drop policy if exists "Parts photos are publicly readable" on storage.objects;
create policy "Parts photos are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'parts');

drop policy if exists "Admins can upload parts photos" on storage.objects;
create policy "Admins can upload parts photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'parts' and public.is_admin());

-- 17. Seed Catalog Data: Authentic Suzuki Parts
insert into public.parts (
  name,
  category,
  compatible_models,
  price,
  condition_note,
  primer_note,
  photos,
  status,
  is_offer,
  part_number
)
values
(
  'Swift Sport Front Bumper Fascia & Lower Grille Set',
  'Body Panels',
  array['Swift (2018-2024)', 'Swift Sport (ZC33S)'],
  380.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Factory coated in electro-deposit gray primer. Requires light sanding, degreasing, and top-coat color matching.',
  array[
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?auto=format&fit=crop&w=1200&q=80'
  ],
  'available',
  true,
  'SZ-71711-52R20-PRM'
),
(
  'Jimny JB74 Heavy-Duty Heritage Front Grille',
  'Body Panels',
  array['Jimny (JB74)', 'Jimny 5-Door (JC74)'],
  245.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Matte gray primer finish. Ready for custom finish or direct black textured raptor liner coating.',
  array[
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'
  ],
  'available',
  true,
  'SZ-9911C-78R00-ZSC'
),
(
  'Grand Vitara AllGrip Rear Diffuser & Underguard',
  'Body Panels',
  array['Grand Vitara (2022-Present)', 'S-Cross (2022+)'],
  290.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Protective gray primer base. Aerodynamic lower diffuser section.',
  array[
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
  ],
  'available',
  false,
  'SZ-71811-65T00-PRM'
),
(
  'Swift ZXi Full LED Projector Headlamp Unit (Right)',
  'Electrical & Lighting',
  array['Swift (2020-2024)', 'Dzire (2020+)'],
  310.00,
  'Factory sealed OEM replacement assembly with integrated DRL and leveling motor.',
  'Clear optical polycarbonate lens with anti-UV hard coat.',
  array[
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'
  ],
  'available',
  false,
  'SZ-35120-53R10'
),
(
  'Jimny 40mm OEM-Tuned Performance Suspension Lift Kit',
  'Suspension & Steering',
  array['Jimny (JB74/JB64)'],
  690.00,
  'Complete set: 4 progressive matched coil springs, heavy-duty nitrogen gas shock absorbers, and brake line brackets.',
  'High-tensile powder-coated finish for corrosion and gravel impact resistance.',
  array[
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'
  ],
  'available',
  true,
  'SZ-41000-78R40-LIFT'
),
(
  'Baleno Front Fenders Pair (Left + Right OEM Spec)',
  'Body Panels',
  array['Baleno (2019-2024)', 'Glanza'],
  260.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Stamped automotive grade steel in protective gray primer. Test-fitted for exact gap tolerance.',
  array[
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'
  ],
  'available',
  false,
  'SZ-57611-68P00-PRM'
),
(
  'K14C / K14D Boosterjet 1.4L Turbo Major Service Kit',
  'Engine & Drivetrain',
  array['Swift Sport (ZC33S)', 'Vitara 1.4T', 'S-Cross 1.4T'],
  185.00,
  'Genuine Suzuki maintenance package: Iridium spark plugs, OEM oil filter, high-flow air filter, and cabin pollen filter.',
  'Factory boxed genuine Suzuki maintenance components.',
  array[
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'
  ],
  'available',
  false,
  'SZ-16510-61A31-KIT'
),
(
  'Brezza / Grand Vitara Front Brake Rotor & Ceramic Pad Kit',
  'Brakes & Wheels',
  array['Brezza (2020+)', 'Grand Vitara', 'Urban Cruiser'],
  215.00,
  'Ventilated high-carbon alloy cast discs paired with low-dust OEM ceramic brake pads.',
  'Anti-rust zinc electroplating on non-friction surfaces.',
  array[
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'
  ],
  'available',
  false,
  'SZ-55311-61M00-BRK'
),
(
  'Alto K10 / Celerio Lightweight Front Hood Panel',
  'Body Panels',
  array['Alto (2020+)', 'Alto K10', 'Celerio'],
  195.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Coated in protective electro-deposition gray primer. Pre-cut windshield washer nozzle ports.',
  array[
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
  ],
  'available',
  false,
  'SZ-57300-62S00-PRM'
);

-- 18. Seed Content Posts (Dealer care videos and tips)
insert into public.content_posts (title, video_url, caption, published_at)
values
(
  'Understanding Suzuki Smart Hybrid: Lithium-Ion Pack Maintenance & Braking Energy Recovery',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Discover how the Suzuki Dualjet Smart Hybrid Integrated Starter Generator (ISG) harvests kinetic deceleration energy into the 12V lithium-ion secondary battery. Tips on maximizing battery lifespan during summer months.',
  now() - interval '2 days'
),
(
  'Why Suzuki OEM Body Parts Ship in Gray Primer: Professional Prep & Paint Guide',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'A master technician walkthrough explaining the automotive electro-deposition gray primer applied to all replacement fenders and bumpers, including surface scuffing with 800-grit wet sandpaper before base-coat application.',
  now() - interval '5 days'
),
(
  'Jimny JB74 AllGrip Pro 4WD Mode Guide: 2H vs 4H vs 4L Transfer Case Explained',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Never engage 4H on dry tarmac! Here is our dealership technical breakdown on how the vacuum-actuated front hubs lock, when to select low range (4L), and how brake LSD traction control keeps you moving on trail ascents.',
  now() - interval '9 days'
),
(
  'Boosterjet Turbo Maintenance: Oil Viscosity & Cool-Down Routine for K14C Engines',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Direct injection and high turbo boost require strict adherence to Suzuki 5W-30 synthetic oil standards. Learn why 60-second idle cool-downs prevent bearing coking after highway runs.',
  now() - interval '14 days'
);

commit;

notify pgrst, 'reload schema';
