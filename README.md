# Seed

Seed is an open-source AI technical manager for non-technical users. It manages projects in the user's own GitHub, Supabase, Vercel, and OpenAI accounts and is never a runtime dependency of a generated website.

## What is implemented

- Google sign-in through Supabase Auth, with a safe local demo mode
- Guided business, lead, and booking website onboarding
- Projects, overview, website, customers, bookings, media, Ask Seed, and settings experiences
- Provider-neutral source, database, deployment, and AI contracts
- GitHub, Supabase Management API, Vercel, and OpenAI adapter foundations
- Structured OpenAI Responses API planning with deterministic fallback
- Mandatory Seed Guard, controlled tool registry, drift inspection, snapshots, and approval gates
- Database-backed background run queue with independently persisted steps
- AES-256-GCM server-side credential encryption
- Supabase control-plane schema, RLS, OAuth state protection, and audit events
- Versioned Seed Skills and separate policies

The full product works locally in demo mode. Real provider actions are disabled until the relevant OAuth apps and the Seed control-plane Supabase project are configured. This prevents the interface from pretending an external deployment or database change succeeded.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Use `/login`, `/onboarding`, or `/dashboard` directly.

## Configure live mode

1. Create the Seed control-plane Supabase project.
2. Enable Google in Supabase Auth and add local and production callback URLs.
3. Apply [`supabase/migrations/20260830000000_seed_control_plane.sql`](supabase/migrations/20260830000000_seed_control_plane.sql).
4. Add the Supabase URL, publishable key, and service-role key to `.env.local`.
5. Generate `SEED_CREDENTIAL_ENCRYPTION_KEY` with `openssl rand -base64 32`.
6. Configure GitHub App, Supabase OAuth, and Vercel Integration credentials.
7. Set `SEED_DEMO_MODE=false`.

Never expose service-role keys, OAuth secrets, provider tokens, GitHub private keys, or OpenAI keys through a `NEXT_PUBLIC_*` variable.

## Verify

```bash
npm run check
```

This runs lint, safety tests, strict TypeScript checking, and the production build.

OpenAI planning uses the Responses API with structured outputs, `store: false`, and no provider credentials in model input.
