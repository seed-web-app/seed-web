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
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile } = await client
    .from("profiles")
    .select("id,username")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profile) {
    return { id: profile.id, username: profile.username as string | null, demo: false };
  }

  // If user was created via OAuth but trigger was missed or delayed, create profile via admin
  const admin = createSupabaseAdminClient();
  if (admin) {
    const displayName =
      user.user_metadata?.full_name ??
      user.email?.split("@")[0] ??
      "Seed User";
    const avatarUrl = user.user_metadata?.avatar_url ?? null;

    const { data: createdProfile } = await admin
      .from("profiles")
      .upsert(
        {
          auth_user_id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
        },
        { onConflict: "auth_user_id" },
      )
      .select("id,username")
      .single();

    if (createdProfile) {
      // Ensure workspace exists
      await admin
        .from("workspaces")
        .upsert(
          { owner_user_id: createdProfile.id, name: "My workspace" },
          { onConflict: "owner_user_id" }
        );

      return {
        id: createdProfile.id,
        username: createdProfile.username as string | null,
        demo: false,
      };
    }
  }

  return null;
}

export async function getSeedIdentity() {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  return { id: user.id, name: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Seed user", email: user.email ?? "", avatarUrl: user.user_metadata.avatar_url ?? null, demo: false };
}

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
