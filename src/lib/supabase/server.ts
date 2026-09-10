import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appConfig } from "@/lib/config";
import { sharedAuthCookieOptions } from "@/lib/tenancy";

export async function createSupabaseServerClient() {
  if (!appConfig.supabaseUrl || !appConfig.supabaseKey) return null;

  const cookieStore = await cookies();
  return createServerClient(appConfig.supabaseUrl, appConfig.supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          for (const { name, value, options } of items) {
            cookieStore.set(
              name,
              value,
              sharedAuthCookieOptions(options),
            );
          }
        } catch {
          // Server Components cannot write cookies; Proxy refreshes the session.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getAppProfile() {
  const client = await createSupabaseServerClient();
  if (!client) return null;

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data: existingProfile } = await client
    .from("profiles")
    .select("id,username")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return {
      id: existingProfile.id as string,
      username: existingProfile.username as string | null,
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data: createdProfile } = await admin
    .from("profiles")
    .upsert(
      {
        auth_user_id: user.id,
        display_name:
          user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
        avatar_url: user.user_metadata?.avatar_url ?? null,
      },
      { onConflict: "auth_user_id" },
    )
    .select("id,username")
    .single();

  return createdProfile
    ? {
        id: createdProfile.id as string,
        username: createdProfile.username as string | null,
      }
    : null;
}

export async function getAppIdentity() {
  const client = await createSupabaseServerClient();
  if (!client) return null;

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  return {
    id: user.id,
    name:
      user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
    email: user.email ?? "",
  };
}
