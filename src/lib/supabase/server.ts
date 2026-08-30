import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { seedConfig } from "@/lib/config";
import { sharedAuthCookieOptions } from "@/lib/tenancy";

export async function createSupabaseServerClient() {
  if (!seedConfig.supabaseUrl || !seedConfig.supabaseKey) return null;
  const cookieStore = await cookies();
  return createServerClient(seedConfig.supabaseUrl, seedConfig.supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => { try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, sharedAuthCookieOptions(options))); } catch { /* Server Components cannot always write cookies. */ } },
    },
  });
}

export async function getSeedProfile() {
  const client = await createSupabaseServerClient();
  if (!client) return { id: "demo-profile", username: null, demo: true };
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data: profile, error } = await client
    .from("profiles")
    .select("id,username")
    .eq("auth_user_id", user.id)
    .single();
  if (error || !profile) throw new Error("Seed profile not found.");
  return { id: profile.id, username: profile.username as string | null, demo: false };
}

export async function getSeedIdentity() {
  const client = await createSupabaseServerClient();
  if (!client) return { id: "demo-user", name: "Demo user", email: "demo@seed.local", avatarUrl: null, demo: true };
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  return { id: user.id, name: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Seed user", email: user.email ?? "", avatarUrl: user.user_metadata.avatar_url ?? null, demo: false };
}

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
