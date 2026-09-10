# New web app

This repository is a clean Next.js foundation connected to the existing GitHub,
Vercel, and Supabase projects.

The app intentionally contains only:

- Google sign-in through Supabase Auth
- one profile per authenticated user
- one unique username/subdomain per profile
- a blank authenticated workspace

## Local setup

Copy `.env.example` to `.env.local`, fill in the existing Supabase values, and
run:

```bash
npm install
npm run dev
```

The wildcard domain and production callback URLs remain configured in Vercel
and Supabase.
