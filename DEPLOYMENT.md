# Seed production release

## Required accounts

- A Supabase project for Seed's control plane with Google Auth enabled
- A GitHub App with repository contents read/write and metadata read access
- A Supabase OAuth integration with the minimum management scopes listed in `.env.example`
- A Vercel connectable account integration
- A Vercel project connected to the Seed GitHub repository

## Release sequence

1. Apply `supabase/migrations/20260830000000_seed_control_plane.sql` to the Seed control-plane project.
2. Configure Google OAuth callback URLs for `https://YOUR_DOMAIN/auth/callback`.
3. Configure provider callbacks:
   - GitHub App setup/callback: `https://YOUR_DOMAIN/api/connections/github/callback`
   - Supabase OAuth: `https://YOUR_DOMAIN/api/connections/supabase/callback`
   - Vercel Integration: `https://YOUR_DOMAIN/api/connections/vercel/callback`
4. Add every value from `.env.example` to Vercel. Mark all non-`NEXT_PUBLIC_` credentials as sensitive.
5. Set `NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN` and `SEED_DEMO_MODE=false`.
6. Run `npm run release:check` in an environment containing the production variables.
7. Deploy a preview and verify Google login, project creation, each provider connection, Ask Seed, `/api/health`, and logout.
8. Promote the verified preview to production.

## Release blockers

- Do not publish live mode while `SEED_DEMO_MODE=true`.
- Do not reuse preview Supabase credentials in production.
- Replace the starter privacy policy and terms with legal-entity-specific text before accepting public users.
- Configure a support/security email in `SECURITY.md` before public launch.
- Set budget/rate limits in the provider accounts before onboarding users.

## Rollback

Promote the previous known-good Vercel deployment. Database migrations in V1 are additive; never roll them back by dropping production data. Create a forward repair migration instead.
