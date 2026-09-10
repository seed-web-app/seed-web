# Suzuki Parts Customer Network App - Build Progress

This document tracks every task required to deliver the production-ready MVP for the Suzuki auto-parts customer network web app. It is continuously updated across milestones.

---

## 1. Project Initialization & Setup
- [x] Create `PROGRESS.md` tracking document
- [x] Install dependencies (`tailwindcss@^3`, `postcss`, `autoprefixer`, `framer-motion`, `lucide-react`)
- [x] Configure Tailwind CSS & PostCSS with Suzuki automotive design system tokens
- [x] Initialize global styles and utility classes in `src/app/globals.css`

## 2. Data Model & Supabase Setup
- [x] Write complete SQL migration `supabase/migrations/20260910000001_suzuki_network.sql`:
  - [x] `profiles` table (auth uid, full_name, phone, email, role: customer | admin, created_at)
  - [x] `vehicles` table (id, owner_id, make, model, year, registration_no, created_at)
  - [x] `parts` table (id, name, category, compatible_models, price, condition_note, primer_note, photos, status, is_offer, created_at)
  - [x] `inquiries` table (id, customer_id, vehicle_id, part_id, message, status: new | contacted | closed, admin_notes, created_at)
  - [x] `content_posts` table (id, title, video_url, caption, published_at, created_by)
  - [x] `dealer_settings` table (phone, whatsapp, address, notification_email)
  - [x] Supabase Row Level Security (RLS) policies for all tables
  - [x] Auth trigger to auto-create profiles on Google OAuth signup
  - [x] Realistic Suzuki seed data (parts catalog, dealer care videos, demo settings)
- [x] Applied migration to Supabase database successfully
- [x] TypeScript definitions in `src/lib/types.ts`
- [x] Supabase client and server-side data access helpers in `src/lib/supabase/`

## 3. Authentication & Role-Based Access
- [x] Configure Google OAuth server actions (`signInWithGoogle`, `signOut`)
- [x] Next 16 `src/proxy.ts` route protection:
  - [x] Public routes: `/`, `/login`, `/auth/callback`
  - [x] Customer protected routes: `/home`, `/parts/*`, `/content`, `/profile`, `/onboarding`
  - [x] Admin protected routes: `/admin/*`
  - [x] Role enforcement (non-admin blocked from `/admin/*`, authenticated users redirected appropriately)
- [x] OAuth Callback route (`src/app/auth/callback/route.ts`):
  - [x] Role check (`admin` -> `/admin`, `customer` -> check vehicles -> `/onboarding` or `/home`)

## 4. Customer Application Screens
- [x] Splash / Landing page (`src/app/page.tsx`):
  - [x] High-brand Suzuki aesthetic, confident headline, single CTA
- [x] Google Sign-In page (`src/app/login/page.tsx`):
  - [x] Minimalist, automotive luxury treatment, Framer Motion polish
- [x] Customer Shared Navbar & Footer (`src/components/customer/Navbar.tsx`)
- [x] Customer Onboarding (`src/app/onboarding/page.tsx`):
  - [x] Register first vehicle (Make: Suzuki, Model, Year, Reg No) and contact phone
- [x] Parts Home Feed (`src/app/home/page.tsx`):
  - [x] Standing condition disclaimer banner (*"Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal."*)
  - [x] Search by part name / model
  - [x] Category & Model filters
  - [x] Part cards with reference price, condition summary, offer badges
- [x] Part Detail page (`src/app/parts/[id]/page.tsx`):
  - [x] Multi-photo gallery preview
  - [x] Reference price & condition callouts
  - [x] Compatible models list
  - [x] "Request this part" modal/CTA (creates `inquiries` row)
- [x] Content Feed (`src/app/content/page.tsx`):
  - [x] Dealer video feed (~2x/week car care & hybrid tips)
  - [x] Responsive video player / YouTube embed with captions
- [x] Customer Profile & Garage (`src/app/profile/page.tsx`):
  - [x] Edit contact info (name, phone)
  - [x] Vehicle garage management (view, add, remove vehicles)
  - [x] Past inquiries tracker with live status badges (`new`, `contacted`, `closed`)

## 5. Admin Panel (`role = admin`)
- [x] Admin Shell Layout (`src/app/admin/layout.tsx`):
  - [x] Dealer dashboard sidebar navigation, role indicator, quick customer switch
- [x] Admin Dashboard (`src/app/admin/page.tsx`):
  - [x] KPI cards: total customers, total vehicles, total parts, new inquiries this week
  - [x] Inquiry status breakdown (new / contacted / closed counts)
  - [x] Recent activity lists (latest 10 inquiries and latest 10 customers)
- [x] Parts Management (`src/app/admin/parts/page.tsx`):
  - [x] Parts data table with search, category & status filtering
  - [x] Add/Edit part form (photos, condition disclaimer, models, offer toggle, status)
  - [x] Delete / archive action
- [x] Inquiries Management (`src/app/admin/inquiries/page.tsx`):
  - [x] Requests table (customer, phone, vehicle, part, date, status)
  - [x] Filter by status (`new`, `contacted`, `closed`), sort newest first
  - [x] Detail view with Click-to-Call & Click-to-WhatsApp
  - [x] Status workflow control (`new` -> `contacted` -> `closed`) & admin notes
- [x] Content Management (`src/app/admin/content/page.tsx`):
  - [x] Video posts list
  - [x] Add / edit / delete video posts
- [x] Users Directory (`src/app/admin/users/page.tsx`):
  - [x] Registered customers directory with vehicle & inquiry counts
  - [x] Drill-down into customer profile, garage, and inquiry history
- [x] Dealer Settings (`src/app/admin/settings/page.tsx`):
  - [x] Business contact info (phone, WhatsApp, address, email notification)
  - [x] Admin seeding instructions

## 6. Verification, Documentation & Delivery
- [x] Clean `.env.example`
- [x] Comprehensive `README.md` (setup, Supabase setup, Google OAuth config, seeding first admin)
- [x] Codebase lint & build verification (`npm run lint && npm run build` passed with 0 errors)
- [x] Complete walkthrough report (`walkthrough.md`)

---

## Status: All Tasks Complete
- Production MVP fully built, verified, and database migrated.
- Ready for end-user pairing and dealer testing.
