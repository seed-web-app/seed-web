-- Migration: 20260910000002_amazon_mauritius_network.sql
-- Amazon-Style Suzuki Mauritius Owners Network & Marketplace Expansion

begin;

-- 1. Car Models Showcase Table
create table if not exists public.car_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  price_guide text,
  specs jsonb not null default '{}'::jsonb,
  features text[] not null default '{}',
  image_url text not null,
  gallery text[] not null default '{}',
  description text,
  created_at timestamptz not null default now()
);

alter table public.car_models enable row level security;

create policy "Car models viewable by authenticated users"
  on public.car_models for select to authenticated using (true);

create policy "Admins can manage car models"
  on public.car_models for all to authenticated using (public.is_admin());

-- 2. News & Tech Articles Table
create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  summary text,
  content text,
  image_url text not null,
  published_at timestamptz not null default now()
);

alter table public.news_articles enable row level security;

create policy "News articles viewable by authenticated users"
  on public.news_articles for select to authenticated using (true);

create policy "Admins can manage news articles"
  on public.news_articles for all to authenticated using (public.is_admin());

-- 3. Forum Threads Table
create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_name text not null,
  author_id uuid references public.profiles(id) on delete set null,
  category text not null,
  replies_count int not null default 0,
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.forum_threads enable row level security;

create policy "Forum threads viewable by authenticated users"
  on public.forum_threads for select to authenticated using (true);

create policy "Authenticated users can create forum threads"
  on public.forum_threads for insert to authenticated with check (true);

create policy "Users can delete own threads or admin"
  on public.forum_threads for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- 4. Forum Replies Table
create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_name text not null,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.forum_replies enable row level security;

create policy "Forum replies viewable by authenticated users"
  on public.forum_replies for select to authenticated using (true);

create policy "Authenticated users can create replies"
  on public.forum_replies for insert to authenticated with check (true);

-- 5. Seed Car Models in Mauritius
insert into public.car_models (name, tagline, price_guide, specs, features, image_url, gallery, description)
values
(
  'Suzuki Jimny 5-Door',
  'The Iconic 4x4, Now with Extended Wheelbase & Rear Doors',
  'From Rs 1,450,000 (MUR)',
  jsonb_build_object(
    'engine', '1.5L K15B 4-Cylinder Petrol',
    'transmission', '5-Speed Manual or 4-Speed Automatic',
    'power', '102 PS @ 6,000 rpm / 130 Nm',
    'fuel_economy', '6.8 L/100km Combined',
    'drive_type', 'AllGrip Pro Part-Time 4WD with Low Range'
  ),
  array['Ladder Frame Chassis', 'Rigid Axle 3-Link Suspension', '9-Inch Smartplay Display', 'Hill Descent & Hill Hold Control', 'Rear AC Vents & Extended Legroom'],
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  array[
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'
  ],
  'Engineered for both off-road trails in Chamarel and coastal cruising in Mauritius. Features heavy-duty solid axles, high ground clearance, and authentic Suzuki 4x4 heritage.'
),
(
  'Suzuki Swift Sport (ZC33S)',
  'Pure Hot Hatch Excitement with Boosterjet Turbo Power',
  'From Rs 1,290,000 (MUR)',
  jsonb_build_object(
    'engine', '1.4L K14D Boosterjet Turbo with 48V Hybrid',
    'transmission', '6-Speed Short-Throw Manual',
    'power', '129 PS / 235 Nm Torque',
    'fuel_economy', '5.6 L/100km Combined',
    'drive_type', 'Front-Wheel Drive with Monroe Sport Dampers'
  ),
  array['Monroe Sports Suspension', 'Dual Exhaust Tips', 'Semi-Bucket Sports Seats', 'Carbon-Look Aero Kit', 'Apple CarPlay & Android Auto'],
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  array[
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80'
  ],
  'A lightweight 970kg sports hatchback that handles island coastal winding roads with unmatched agility and responsive turbo thrust.'
),
(
  'Suzuki Grand Vitara AllGrip Hybrid',
  'Premium SUV with Dualjet Hybrid Efficiency & Intelligent AWD',
  'From Rs 1,680,000 (MUR)',
  jsonb_build_object(
    'engine', '1.5L Dualjet Petrol with Smart Hybrid ISG',
    'transmission', '6-Speed Automatic with Paddle Shifters',
    'power', '103 PS / 138 Nm + Electric Assist',
    'fuel_economy', '4.9 L/100km Combined',
    'drive_type', 'AllGrip Select Electronic 4WD (Auto/Sport/Snow/Lock)'
  ),
  array['Panoramic Sunroof', '360-Degree View Camera', 'Head-Up Display', 'Ventilated Front Seats', 'Wireless Phone Charging'],
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  array[
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
  ],
  'Designed for comfortable family touring across Mauritius, from Grand Baie to Le Morne, delivering exceptional fuel savings and all-weather traction.'
),
(
  'Suzuki Fronx Turbo Coupe SUV',
  'Dynamic Coupe Crossover Styling with Boosterjet Agility',
  'From Rs 1,180,000 (MUR)',
  jsonb_build_object(
    'engine', '1.0L Boosterjet Turbo Direct Injection',
    'transmission', '6-Speed Torque Converter Automatic',
    'power', '100 PS / 148 Nm Torque',
    'fuel_economy', '5.2 L/100km Combined',
    'drive_type', 'Front-Wheel Drive'
  ),
  array['Fastback Coupe Roofline', 'Full-Width Connected LED Tail Lamp', 'UV Cut Privacy Glass', 'Head-Up Display', 'Wireless Apple CarPlay'],
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  array[
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
  ],
  'Modern aerodynamic crossover SUV featuring elevated ground clearance, bold geometric grille, and responsive urban turbo performance.'
),
(
  'Suzuki Baleno Dualjet',
  'Spacious Urban Hatchback with Premium Technology',
  'From Rs 950,000 (MUR)',
  jsonb_build_object(
    'engine', '1.5L K15B 16-Valve Multi-Point Injection',
    'transmission', '4-Speed Automatic or 5-Speed Manual',
    'power', '105 PS / 138 Nm Torque',
    'fuel_economy', '5.4 L/100km Combined',
    'drive_type', 'Front-Wheel Drive'
  ),
  array['Surround Sense Audio', '318 Liters Boot Capacity', 'Automatic Climate Control', 'Cruise Control', 'Electronic Stability Program'],
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  array[
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'
  ],
  'The premier family hatchback in Mauritius known for low running costs, spacious rear legroom, and rock-solid reliability in island traffic.'
),
(
  'Suzuki Ertiga 7-Seater Hybrid',
  'Versatile Multi-Purpose Vehicle for Families & Commercial Tours',
  'From Rs 1,120,000 (MUR)',
  jsonb_build_object(
    'engine', '1.5L K15B Smart Hybrid Petrol',
    'transmission', '4-Speed Automatic with Overdrive',
    'power', '105 PS / 138 Nm Torque',
    'fuel_economy', '5.8 L/100km Combined',
    'drive_type', 'Front-Wheel Drive'
  ),
  array['Flexible 3-Row 7-Seat Seating', 'Roof-Mounted Rear AC', 'One-Touch Tumble 2nd Row', 'Cooled Cup Holders', 'Keyless Push Start'],
  'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?auto=format&fit=crop&w=1200&q=80',
  array[
    'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?auto=format&fit=crop&w=1200&q=80'
  ],
  'The definitive choice for large Mauritian households and coastal excursion transfers, seating 7 adults in full comfort.'
)
on conflict do nothing;

-- 6. Seed News Articles
insert into public.news_articles (title, category, summary, content, image_url, published_at)
values
(
  'Mauritius Carbon Duty Exemptions on Suzuki Smart Hybrid Vehicles Announced',
  'Policies & Regulations',
  'The Ministry of Finance confirms 0% excise duty and rebate benefits for Suzuki Dualjet Smart Hybrid registrations.',
  'Under the latest national green mobility initiative in Mauritius, all registered Suzuki Smart Hybrid vehicles (including the Grand Vitara Hybrid, Swift Hybrid, and Ertiga Hybrid) qualify for reduced registration fees and exemption from CO2 environmental surcharges. Dealerships across Phoenix and Port Louis confirm immediate price advantages for buyers.',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  now() - interval '1 day'
),
(
  'Suzuki Unveils eVX Electric SUV: Mauritius Island Launch Timeline',
  'Upcoming Technology',
  'Suzuki reveals production details for its flagship all-electric 4WD SUV with 500km range.',
  'Suzuki Motor Corporation has showcased the final production specs for the upcoming eVX electric SUV. Engineered with an 60kWh battery pack and electronic AllGrip-e all-wheel-drive, the vehicle is slated for right-hand-drive island markets by mid-2027. Local service training for high-voltage diagnostics has begun at the central workshop.',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
  now() - interval '4 days'
),
(
  'Why Suzuki OEM Body Parts Ship in Protective Gray Primer: Professional Prep Guide',
  'Technical Guide',
  'Everything Mauritian owners need to know about electro-deposit primer and salt air rust prevention.',
  'All replacement body panels—such as Swift Sport bumpers, Jimny grilles, and Baleno fenders—ship from the factory in a protective electro-deposit gray primer. In tropical coastal climates like Mauritius, this primer prevents oxidation during transit. Technicians recommend wet-sanding with 800-grit paper followed by genuine 2K urethane top-coat matching.',
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  now() - interval '7 days'
),
(
  'New Vehicle Fitness Examination Regulations for Commercial Suzuki Vans in Mauritius',
  'Policies & Regulations',
  'National Transport Authority (NTA) updates inspection standards for brakes, suspension, and tinting.',
  'The NTA Mauritius has revised vehicle fitness certificate testing protocols for commercial transport vehicles. Operators of Suzuki Eeco and Ertiga fleets are advised to ensure brake rotor thickness meets OEM tolerance and all lighting assemblies maintain clear polycarbonate visibility.',
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80',
  now() - interval '10 days'
),
(
  'Boosterjet Turbo Maintenance: Optimal Viscosity for Island Tropical Climates',
  'Upcoming Technology',
  'High ambient temperatures require strict adherence to 5W-30 synthetic motor oil.',
  'Direct-injection turbocharged engines (such as the K14C in the Swift Sport) experience high thermal cycles when commuting in Port Louis traffic. Master mechanics recommend adhering to 10,000km oil change intervals with genuine Suzuki ECSTAR lubricants to protect turbo turbine bearings.',
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80',
  now() - interval '15 days'
)
on conflict do nothing;

-- 7. Seed Forum Threads & Discussions
insert into public.forum_threads (title, content, author_name, category, replies_count, likes_count, created_at)
values
(
  'Best 4x4 trails in Mauritius for Jimny JB74? (Chamarel vs Vallée des Couleurs)',
  'Hey everyone! Just got my Jimny 5-Door and looking for moderate weekend trails that test the AllGrip Pro low range without scratching the side mirrors. Anyone done the river crossing near Chamarel recently? How are the muddy inclines after the heavy rains?',
  'Kev_Jimny_MU',
  'Jimny 4x4 & Off-Roading Mauritius',
  4,
  18,
  now() - interval '2 days'
),
(
  'Swift Sport ZC33S fuel consumption in Port Louis morning traffic',
  'Quick feedback for fellow Swift owners: commuting from Grand Baie to Ebene daily on the M2 motorway. In pure highway cruising I get 5.1L/100km, but once stuck in Quay D morning rush it jumps to 7.2L. What are you guys averaging with the 48V hybrid assist?',
  'Raj_SwiftSport',
  'Swift Performance & Tuning',
  6,
  12,
  now() - interval '4 days'
),
(
  'Where to get gray primer bumper painted properly in Phoenix / Port Louis?',
  'I ordered a genuine Swift front bumper from the dealer catalog that arrived in standard gray primer. Need recommendations for a high-standard spray booth that can color-match Suzuki Champion Yellow (ZFT) with multi-stage clear coat.',
  'Yannick_Motors',
  'Maintenance & Garages',
  5,
  9,
  now() - interval '6 days'
),
(
  'Grand Vitara Hybrid: 20,000km long-term review after 1 year in Mauritius',
  'Just completed our 20k km service at the authorized dealer. The 12V lithium-ion battery has been completely flawless through summer heat. Regenerative braking saves so much brake pad wear coming down Plaine Magnien hill. Highly recommend!',
  'Aline_GVitara',
  'General Discussion',
  8,
  24,
  now() - interval '8 days'
)
on conflict do nothing;

-- Seed Replies
insert into public.forum_replies (thread_id, author_name, content, created_at)
select id, 'Vikash_4WD', 'The Chamarel trail near the waterfall ridge is superb right now! Just make sure you drop tire pressure to 18 PSI on the rocky mud sections.', now() - interval '1 day'
from public.forum_threads where title like '%Best 4x4 trails%' limit 1;

insert into public.forum_replies (thread_id, author_name, content, created_at)
select id, 'David_JimnyJB74', 'Agreed with Vikash. Also ensure your vacuum 4WD lines have breathers if you cross more than 30cm water near the sugar estate.', now() - interval '18 hours'
from public.forum_threads where title like '%Best 4x4 trails%' limit 1;

insert into public.forum_replies (thread_id, author_name, content, created_at)
select id, 'Sunil_M', 'For Champion Yellow paint matching, the body shop opposite Bagatelle Mall has a computerized spectrophotometer calibrated for Japanese paint codes.', now() - interval '3 days'
from public.forum_threads where title like '%Where to get gray primer%' limit 1;

-- 8. Seed 70+ Categorized Dummy Parts (10-20 parts in each category)
-- Clean existing parts to avoid duplicate collisions, then insert fresh full catalog
delete from public.parts where true;

insert into public.parts (name, category, compatible_models, price, condition_note, primer_note, photos, status, is_offer, part_number)
values
-- CATEGORY 1: BODY PANELS (15 parts - all featuring primer note)
(
  'Swift Sport Front Bumper Fascia & Lower Spoiler Grille',
  'Body Panels',
  array['Swift (2018-2024)', 'Swift Sport (ZC33S)'],
  380.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Electro-deposit gray primer applied. Requires degreasing, light 800-grit wet sanding, and paint matching.',
  array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-71711-52R20-PRM'
),
(
  'Jimny JB74 Heritage Honeycomb Front Grille',
  'Body Panels',
  array['Jimny (JB74)', 'Jimny 5-Door (JC74)'],
  245.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Matte gray primer base. Ready for color coat or textured black finish.',
  array['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-9911C-78R00-ZSC'
),
(
  'Grand Vitara AllGrip Lower Rear Diffuser & Underguard',
  'Body Panels',
  array['Grand Vitara (2022+)', 'S-Cross'],
  290.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Factory coated in gray primer. Aerodynamic lower section.',
  array['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-71811-65T00-PRM'
),
(
  'Baleno Front Fenders Assembly (Left & Right Pair)',
  'Body Panels',
  array['Baleno (2019-2024)', 'Glanza'],
  260.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Stamped automotive grade steel in protective gray primer. Test-fitted for exact gap alignment.',
  array['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-57611-68P00-PRM'
),
(
  'Alto K10 / Celerio Lightweight Front Hood Panel',
  'Body Panels',
  array['Alto K10', 'Alto', 'Celerio'],
  195.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Coated in protective electro-deposition gray primer. Pre-cut washer nozzle ports.',
  array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-57300-62S00-PRM'
),
(
  'Swift Sport Rear Bumper with Twin Diffuser Ports',
  'Body Panels',
  array['Swift Sport (ZC33S)', 'Swift'],
  360.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Gray primer coat applied. Features pre-molded exhaust cutouts.',
  array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-71811-52R50-PRM'
),
(
  'Jimny Heavy-Duty Steel Wheel Arch Fender Flares (Set of 4)',
  'Body Panels',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  320.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Gray primer base. Provides +30mm tire clearance for off-road fitments.',
  array['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-77210-78R10-SET'
),
(
  'Ertiga 7-Seater Rear Tailgate Hatch Door Panel',
  'Body Panels',
  array['Ertiga (2019+)', 'XL6'],
  420.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Factory electro-deposit gray primer. Hinges and wiring harnesses pass-through pre-cut.',
  array['https://images.unsplash.com/photo-1600793575654-910699b5e4d4?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-69100-73R00-PRM'
),
(
  'Fronx Front Under-Bumper Skid Plate Garnish',
  'Body Panels',
  array['Fronx (2023+)', 'Brezza'],
  210.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Gray primer finish for custom silver metallic or gloss black matching.',
  array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-71712-68T00-PRM'
),
(
  'Swift Aerodynamic Side Skirts Pair (Left & Right)',
  'Body Panels',
  array['Swift (2018-2024)', 'Swift Sport'],
  230.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Gray primer finish. Includes heavy-duty 3M mounting tape & clips.',
  array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-77510-52R00-PRM'
),
(
  'Jimny Raised Air Intake Snorkel Body Kit',
  'Body Panels',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  285.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'UV-stabilized primer finish with high-flow air ducting.',
  array['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-13800-78R00-SNK'
),
(
  'Grand Vitara Front Bumper Upper & Lower Shell',
  'Body Panels',
  array['Grand Vitara (2022+)'],
  395.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Two-piece bumper shell coated in protective gray primer.',
  array['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-71711-65T10-PRM'
),
(
  'S-Presso Rugged Wheel Arch Cladding Trim Set',
  'Body Panels',
  array['S-Presso'],
  165.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Tough ABS composite in primer base. Resists stone chipping.',
  array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-77200-62R00-TRM'
),
(
  'Swift Sport High-Downforce Roof Spoiler Wing',
  'Body Panels',
  array['Swift Sport', 'Swift'],
  275.00,
  'Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.',
  'Lightweight molded primer wing ready for piano black or body color spray.',
  array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-990E0-52R05-WNG'
),

-- CATEGORY 2: ENGINE & DRIVETRAIN (12 parts)
(
  'K14C / K14D Boosterjet 1.4L Turbo Major Service Kit',
  'Engine & Drivetrain',
  array['Swift Sport (ZC33S)', 'Vitara 1.4T', 'S-Cross 1.4T'],
  185.00,
  'Genuine Suzuki maintenance package: Iridium spark plugs, OEM oil filter, high-flow air filter, and cabin filter.',
  null,
  array['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-16510-61A31-KIT'
),
(
  'K15B Engine Complete Water Pump Assembly',
  'Engine & Drivetrain',
  array['Jimny (JB74)', 'Ertiga', 'Baleno'],
  115.00,
  'Factory cast aluminum water pump with high-durability impeller and gasket.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-17400-77R00'
),
(
  'Jimny Heavy-Duty Exedy Clutch Disc & Pressure Plate Kit',
  'Engine & Drivetrain',
  array['Jimny (JB74/JB64)'],
  280.00,
  'High-torque friction disc and heavy-duty release bearing for rock crawling and trail durability.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-22100-78R00-CLT'
),
(
  'Swift / Baleno K12M Dualjet Spark Plugs (Set of 4 Iridium)',
  'Engine & Drivetrain',
  array['Swift', 'Baleno', 'Ignis'],
  65.00,
  'OEM laser iridium spark plugs for optimal combustion and low emissions.',
  null,
  array['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-09482-00647-4PK'
),
(
  'Grand Vitara All-Aluminum Dual-Core Radiator Assembly',
  'Engine & Drivetrain',
  array['Grand Vitara', 'S-Cross'],
  210.00,
  'Enhanced cooling capacity engineered for tropical island ambient temperatures.',
  null,
  array['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-17700-65T00'
),
(
  'K15C Dualjet Smart Hybrid Serpentine Drive Belt',
  'Engine & Drivetrain',
  array['Grand Vitara Hybrid', 'Ertiga Hybrid', 'Fronx'],
  42.00,
  'Heavy-duty EPDM ribbed accessory belt for Integrated Starter Generator (ISG).',
  null,
  array['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-17521-65T00'
),
(
  'Jimny JB74 Front & Rear Differential Oil Seal Set',
  'Engine & Drivetrain',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  48.00,
  'Double-lip synthetic rubber seals to prevent oil leakage during water wading.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-09283-40018-SET'
),
(
  'Swift Sport High-Flow Washable Engine Air Filter',
  'Engine & Drivetrain',
  array['Swift Sport (ZC33S)'],
  78.00,
  'Multi-layer cotton gauze media providing +15% airflow while maintaining filtration efficiency.',
  null,
  array['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-13780-52R00-HFL'
),
(
  'Suzuki OEM Magnetic Engine Oil Drain Plug & Copper Crush Washers',
  'Engine & Drivetrain',
  array['All Suzuki Models'],
  22.00,
  'Neodymium magnet captures microscopic ferrous metal shavings to extend engine life.',
  null,
  array['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-11518-77R00-MAG'
),
(
  'Ertiga / XL6 Heavy-Duty Hydraulic Engine Mount',
  'Engine & Drivetrain',
  array['Ertiga', 'XL6', 'Brezza'],
  135.00,
  'Fluid-filled vibration isolation mount restores quiet cabin idle.',
  null,
  array['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-11610-73R00'
),
(
  'K14C Turbocharger Wastegate Actuator Assembly',
  'Engine & Drivetrain',
  array['Swift Sport (ZC33S)', 'Vitara 1.4T'],
  160.00,
  'Calibrated electronic boost pressure regulation unit for direct fitment on factory turbo.',
  null,
  array['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-13900-52R00-ACT'
),
(
  'Suzuki ECSTAR 5W-30 Full Synthetic Oil (4L Bottle)',
  'Engine & Drivetrain',
  array['All Suzuki Models'],
  55.00,
  'Official factory formulated lubricant engineered for Suzuki Dualjet & Boosterjet motors.',
  null,
  array['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-99000-21E80-047'
),

-- CATEGORY 3: ELECTRICAL & LIGHTING (12 parts)
(
  'Swift ZXi Full LED Projector Headlamp Unit (Right Hand Side)',
  'Electrical & Lighting',
  array['Swift (2020-2024)', 'Dzire'],
  310.00,
  'Factory sealed OEM replacement assembly with integrated DRL and leveling motor.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-35120-53R10'
),
(
  'Swift ZXi Full LED Projector Headlamp Unit (Left Hand Side)',
  'Electrical & Lighting',
  array['Swift (2020-2024)', 'Dzire'],
  310.00,
  'Factory sealed OEM replacement assembly with integrated DRL and leveling motor.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-35320-53R10'
),
(
  'Jimny JB74 Round LED Headlight Units with Halo Ring DRL (Pair)',
  'Electrical & Lighting',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  340.00,
  'Classic circular projector design with IP68 waterproof rating and high-intensity beam.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-35100-78R20-SET'
),
(
  'Grand Vitara Connected LED Tail Lamp Lightbar Unit',
  'Electrical & Lighting',
  array['Grand Vitara (2022+)'],
  260.00,
  'Full-width rear luggage door lightbar with animated startup sequence.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-35650-65T00'
),
(
  'Suzuki Smart Hybrid 12V Lithium-Ion Secondary Battery Unit',
  'Electrical & Lighting',
  array['Grand Vitara Hybrid', 'Swift Hybrid', 'Ertiga Hybrid'],
  750.00,
  'Original factory certified battery pack for Dualjet Smart Hybrid regenerative braking.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-96510-68T00-BAT'
),
(
  'Jimny High-Output LED Bumper Fog Lamps (Pair)',
  'Electrical & Lighting',
  array['Jimny', 'Swift', 'Baleno'],
  125.00,
  'Wide 60-degree amber/white switchable fog lamp lenses for heavy island rain & mist.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-990E0-78R06-FOG'
),
(
  'Baleno / Fronx High-Resolution Rear Park Assist Camera Kit',
  'Electrical & Lighting',
  array['Baleno', 'Fronx', 'Ertiga'],
  95.00,
  'Wide 140-degree angle with dynamic trajectory guidelines and night vision sensor.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-39970-68P00'
),
(
  'Swift Sport Heated Electric Power Folding Door Mirror (Right)',
  'Electrical & Lighting',
  array['Swift Sport', 'Swift'],
  145.00,
  'Integrated LED turn indicator, blind spot monitoring glass, and heating element.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-84701-52R40'
),
(
  'Suzuki OEM 12V 80A Denso Alternator Assembly',
  'Electrical & Lighting',
  array['Swift', 'Baleno', 'Jimny'],
  290.00,
  'Factory remanufactured Denso internal regulator alternator for steady battery charging.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-31400-68P00'
),
(
  'Jimny Amber LED Roof Clearance Running Lights (Set of 4)',
  'Electrical & Lighting',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  110.00,
  'Low-profile aerodynamic roof cab lights with waterproof wiring harness.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-990E0-78R11-CLR'
),
(
  'Suzuki Genuine Dual-Tone European Horn Kit',
  'Electrical & Lighting',
  array['All Suzuki Models'],
  45.00,
  'Authoritative 400Hz/500Hz twin disc horns with relay and plug-and-play bracket.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-38500-61M00'
),
(
  'K15B Engine Mass Air Flow (MAF) Sensor',
  'Electrical & Lighting',
  array['Jimny', 'Ertiga', 'Vitara'],
  88.00,
  'Precision hot-wire sensor for exact air-fuel mixture management and cold start response.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-13800-65J00'
),

-- CATEGORY 4: SUSPENSION & STEERING (10 parts)
(
  'Jimny 40mm OEM-Tuned Performance Suspension Lift Kit',
  'Suspension & Steering',
  array['Jimny (JB74/JB64)', 'Jimny 5-Door'],
  690.00,
  'Complete set: 4 progressive matched coil springs, heavy-duty nitrogen gas shock absorbers, and extended brake lines.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-41000-78R40-LIFT'
),
(
  'Swift Sport Monroe Rear Sport Shock Absorbers (Pair)',
  'Suspension & Steering',
  array['Swift Sport (ZC33S)'],
  210.00,
  'Factory tuned damping curves reduce body roll in high-speed cornering.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-41800-52R00'
),
(
  'Jimny Heavy-Duty Steering Damper Stabilizer Unit',
  'Suspension & Steering',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  145.00,
  'Eliminates steering wheel wobble when driving over rough Mauritian basalt gravel roads.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-48700-78R00-DMP'
),
(
  'Grand Vitara Front MacPherson Strut Assembly (Right)',
  'Suspension & Steering',
  array['Grand Vitara (2022+)'],
  175.00,
  'Pre-assembled nitrogen gas strut with dust boot and bump stop.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-41601-65T00'
),
(
  'Baleno / Swift Lower Control Arm with Ball Joint (Left)',
  'Suspension & Steering',
  array['Baleno', 'Swift', 'Dzire'],
  115.00,
  'Stamped steel wishbone arm with pre-pressed polyurethane rubber silentblocks.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-45202-68P00'
),
(
  'Jimny Adjustable Heavy-Duty Panhard Rod (Front)',
  'Suspension & Steering',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  165.00,
  'Maintains axle alignment after installing suspension lift kits.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-48710-78R10-ADJ'
),
(
  'Ertiga Heavy-Duty Rear Overload Helper Coil Springs (Pair)',
  'Suspension & Steering',
  array['Ertiga (2019+)', 'XL6'],
  155.00,
  'Prevents rear end sagging when fully loaded with 7 passengers and airport luggage.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-41311-73R00-HD'
),
(
  'Swift / Ciaz Steering Rack Tie Rod Ends & Boots Kit',
  'Suspension & Steering',
  array['Swift', 'Ciaz', 'Baleno'],
  68.00,
  'Forged steel outer tie rod ends with nylon grease boots for sharp steering response.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-48810-68P00-KIT'
),
(
  'Jimny Solid Axle 3-Link Radius Arm Bushings (Set of 6)',
  'Suspension & Steering',
  array['Jimny (JB74/JB64)'],
  92.00,
  'High-shore elastomer bushes providing maximum axle articulation on rocky trails.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-46210-78R00-BSH'
),
(
  'Front Stabilizer Anti-Roll Bar Link Bushings & Hardware',
  'Suspension & Steering',
  array['Swift', 'Baleno', 'Fronx'],
  38.00,
  'Restores tight handling and eliminates clunking noises over speed bumps.',
  null,
  array['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-42420-68P00-LNK'
),

-- CATEGORY 5: BRAKES & WHEELS (10 parts)
(
  'Brezza / Grand Vitara Front Ventilated Brake Rotor & Ceramic Pad Kit',
  'Brakes & Wheels',
  array['Brezza', 'Grand Vitara', 'Urban Cruiser'],
  215.00,
  'Ventilated high-carbon alloy cast discs paired with low-dust OEM ceramic brake pads.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-55311-61M00-BRK'
),
(
  'Swift Sport High-Carbon Slotted Front Brake Discs (Pair)',
  'Brakes & Wheels',
  array['Swift Sport (ZC33S)'],
  180.00,
  'Precision CNC machined directional curved slots expel brake dust and reduce fade on steep mountain descents.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-55311-52R00-SLT'
),
(
  'Jimny JB74 15-Inch Heavy-Duty Satin Black Steel Wheel',
  'Brakes & Wheels',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  135.00,
  'Indestructible 5.5J steel rim with 5x139.7 bolt pattern designed for rugged rock crawling.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-43210-78R00-STL'
),
(
  'Swift Sport OEM 17-Inch Dual-Tone Diamond-Cut Alloy Wheel',
  'Brakes & Wheels',
  array['Swift Sport', 'Swift'],
  245.00,
  'Original factory alloy rim with polished diamond-face and gloss black accents.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-43210-52R10-ALU'
),
(
  'Baleno / Ertiga Front Ceramic Low-Dust Brake Pads (Axle Set)',
  'Brakes & Wheels',
  array['Baleno', 'Ertiga', 'Swift'],
  58.00,
  'Quiet ceramic compound provides progressive bite and prevents black wheel dust buildup.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-55810-68P00'
),
(
  'Jimny Stainless Steel Braided Extended Brake Hose Lines',
  'Brakes & Wheels',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  98.00,
  'Teflon inner core with stainless outer braid. Zero expansion under hard emergency stops.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-51540-78R00-BRD'
),
(
  'Grand Vitara / S-Cross Electric Parking Brake Rear Caliper (Right)',
  'Brakes & Wheels',
  array['Grand Vitara', 'S-Cross'],
  190.00,
  'Single-piston floating caliper with integrated electronic servo actuator motor.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-55401-65T00'
),
(
  'Swift / Celerio Rear Drum Brake Shoes & Spring Hardware Kit',
  'Brakes & Wheels',
  array['Swift', 'Celerio', 'Alto'],
  62.00,
  'Complete bonded lining shoes set with return springs and automatic adjuster clips.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-53200-68P00-KIT'
),
(
  'Suzuki OEM Wheel Center Cap Hub Badges (Set of 4 Chrome)',
  'Brakes & Wheels',
  array['All Suzuki Models'],
  32.00,
  'Chrome plated Suzuki S emblem snap-on caps for alloy wheels.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-43252-65J00-4PK'
),
(
  'ABS Wheel Speed Sensor (Front Axle Direct Replacement)',
  'Brakes & Wheels',
  array['Swift', 'Jimny', 'Baleno'],
  54.00,
  'Magnetic hall sensor prevents traction control and ABS warning lights.',
  null,
  array['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-56210-68P00'
),

-- CATEGORY 6: INTERIOR & ACCESSORIES (10 parts)
(
  'Jimny JB74 All-Weather 3D Molded Rubber Floor Mats Set',
  'Interior & Accessories',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  120.00,
  'High-lip containment edges trap tropical rainwater, mud, and beach sand completely.',
  null,
  array['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-75901-78R00-3DM'
),
(
  'Swift Sport Red-Stitched Perforated Leather Steering Wheel',
  'Interior & Accessories',
  array['Swift Sport (ZC33S)', 'Swift'],
  295.00,
  'Thick flat-bottom steering rim with thumb grips and integrated audio cruise controls.',
  null,
  array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-48110-52R10-RED'
),
(
  'Grand Vitara Heavy-Duty Aluminium Aerodynamic Roof Rack Crossbars',
  'Interior & Accessories',
  array['Grand Vitara (2022+)', 'S-Cross'],
  185.00,
  'Direct lockable clamp fitment onto integrated roof rails with 75kg load capacity.',
  null,
  array['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-78901-65T00-BAR'
),
(
  'Jimny Center Console Armrest with Dual USB Charging Ports',
  'Interior & Accessories',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  85.00,
  'Padded black leatherette armrest adds critical storage and smartphone charging.',
  null,
  array['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-9914C-78R00-ARM'
),
(
  'Suzuki 9-Inch Touchscreen Android Auto & Apple CarPlay Infotainment',
  'Interior & Accessories',
  array['Swift', 'Jimny', 'Baleno', 'Ertiga'],
  360.00,
  'Capacitive HD IPS touchscreen with GPS navigation and steering wheel control integration.',
  null,
  array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-39100-68T00-INF'
),
(
  'Ertiga 7-Seater Tailored Heavy-Duty Canvas Seat Covers (Full Set)',
  'Interior & Accessories',
  array['Ertiga (2019+)', 'XL6'],
  195.00,
  'Waterproof UV-treated marine canvas protecting all 3 rows against spills and sun exposure.',
  null,
  array['https://images.unsplash.com/photo-1600793575654-910699b5e4d4?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-99000-73R00-SEAT'
),
(
  'Swift Stainless Steel Illuminated Door Sill Scuff Plates (Set of 4)',
  'Interior & Accessories',
  array['Swift (2018-2024)', 'Swift Sport'],
  78.00,
  'Brushed stainless steel plates with LED backlit red SWIFT wordmark.',
  null,
  array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-990E0-52R60-ILL'
),
(
  'Jimny Fold-Down Rear Cargo Tailgate Picnic Table',
  'Interior & Accessories',
  array['Jimny (JB74)', 'Jimny 5-Door'],
  110.00,
  'Mounts inside rear tailgate door, folding down into a rigid meal and equipment prep table.',
  null,
  array['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'],
  'available', true, 'SZ-990E0-78R15-TBL'
),
(
  'Grand Vitara Custom Fit Magnetic Sunshade Curtains (Set of 6)',
  'Interior & Accessories',
  array['Grand Vitara (2022+)'],
  68.00,
  'Precision magnetic frame clips keep out tropical sun while allowing window roll-down.',
  null,
  array['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-990E0-65T00-SUN'
),
(
  'Suzuki Original Leather Key Fob Protection Case with Red Stitching',
  'Interior & Accessories',
  array['All Smart-Key Suzuki Models'],
  28.00,
  'Protects smart key fob from drops and scuffs with embossed Suzuki S emblem.',
  null,
  array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'],
  'available', false, 'SZ-99000-KEY-FOB'
);

commit;

notify pgrst, 'reload schema';
