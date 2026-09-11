# Suzuki Parts Customer Network App (MVP)

A production-ready MVP web application for an authorized **Suzuki auto-parts dealer**.
This is a **customer network app, NOT an e-commerce store**. There is no cart, checkout, or online payment. The app connects Suzuki vehicle owners directly with dealership parts specialists and turns customer requests into offline sales.

---

## Non-Goals (Strictly Out of Scope)
- ❌ No payment gateways, cart, or checkout
- ❌ No public/guest browsing — all catalog and panel access requires verified Google OAuth
- ❌ No automated part fulfillment — a "request" is a qualified lead dispatched to dealer staff

---

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **Styling**: Tailwind CSS with Suzuki Automotive Brand design tokens
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth with Google OAuth, Storage)
- **Animations & Icons**: Framer Motion, Lucide React

---

## Data Model & Schema

All tables enforce PostgreSQL Row Level Security (RLS):

- `profiles` — `id` (auth uid), `full_name`, `phone`, `email`, `role` (`customer` | `admin`), `avatar_url`, `created_at`
- `vehicles` — `id`, `owner_id` (fk profiles), `make` ('Suzuki'), `model`, `year`, `registration_no`, `created_at`
- `parts` — `id`, `name`, `category`, `compatible_models`, `price`, `condition_note`, `primer_note`, `photos`, `status` (`available` | `reserved` | `sold`), `is_offer`, `part_number`
- `inquiries` — `id`, `customer_id`, `vehicle_id`, `part_id`, `message`, `status` (`new` | `contacted` | `closed`), `admin_notes`, `created_at`
- `content_posts` — `id`, `title`, `video_url`, `caption`, `published_at`, `created_by`
- `dealer_settings` — `id`, `dealer_name`, `phone`, `whatsapp`, `address`, `notification_email`, `operating_hours`

---

## Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd SEED
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 3. Run Supabase Migrations
Apply every migration in `supabase/migrations` in timestamp order. With the Supabase CLI linked to the project:
```bash
supabase db push
```
Alternatively, run each SQL file against `DATABASE_URL` in filename order or paste them into the Supabase SQL Editor in that order.

### 4. Start Local Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

---

## Google OAuth Configuration (Supabase)

To enable Google sign-in:

1. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
   - Create an **OAuth 2.0 Client ID** (Web application).
   - Under **Authorized redirect URIs**, add your Supabase Auth URL:
     `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**.

2. **Supabase Dashboard**:
   - Navigate to **Authentication** → **Providers** → **Google**.
   - Toggle **Enable Sign in with Google**.
   - Paste the **Client ID** and **Client Secret**.
   - Under **Authentication** → **URL Configuration**, set:
     - Site URL: `http://localhost:3000` (or production URL)
     - Redirect URLs: `http://localhost:3000/auth/callback`, `https://your-domain.com/auth/callback`

---

## How to Seed the First Admin User

There is **no public registration for admins**. Every user signs in via Google OAuth. To grant the `admin` role:

1. Sign in once with the admin's Google account at `/login`.
2. Run this SQL query in the Supabase SQL Editor:
   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'admin@yourdealership.com';
   ```
3. Refresh the app. The user will be recognized as an administrator and automatically routed to the `/admin` dealer console.

---

## App Screens & Workflows

### Customer App
- **Splash / Landing (`/`)**: High-brand Suzuki presentation with value propositions and Google login CTA.
- **Google Sign-In (`/login`)**: Minimalist, single-click authentication.
- **Onboarding (`/onboarding`)**: First-time vehicle registration (Suzuki model & year) and contact phone number.
- **Home Feed (`/home`)**: Parts catalog with reference prices, category & model filters, and the standing condition disclaimer:
  > *"Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal."*
- **Part Detail (`/parts/[id]`)**: Multi-angle photo gallery, fitment specifications, and **"Request this part"** CTA creating structured leads.
- **Content Feed (`/content`)**: Dealership technical video feed (~2x/week) covering hybrid maintenance, turbo care, and primer prep.
- **Profile & Garage (`/profile`)**: Manage registered vehicles and track real-time inquiry statuses (`new` → `contacted` → `closed`).

### Admin Panel (`/admin`, `role = admin` only)
- **Dashboard (`/admin`)**: 4 KPI cards, inquiry status breakdown, and recent activity logs.
- **Parts Management (`/admin/parts`)**: Catalog table, Add/Edit part form (with photo URLs, primer disclaimer, and offer toggles), and archive/delete.
- **Inquiries Management (`/admin/inquiries`)**: Requests table with Click-to-Call, Click-to-WhatsApp, status workflow switcher, and internal quotation `admin_notes`.
- **Content Management (`/admin/content`)**: Publish and edit technical videos and care tips.
- **Users Directory (`/admin/users`)**: Customer roster with garages and full inquiry history.
- **Settings (`/admin/settings`)**: Dealership business contact details, notification email, and role instructions.
