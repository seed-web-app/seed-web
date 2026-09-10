import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appConfig } from "@/lib/config";
import type { Profile, Vehicle, DealerSettings } from "@/lib/types";

export async function createSupabaseServerClient() {
  if (!appConfig.supabaseUrl || !appConfig.supabaseKey) return null;

  const cookieStore = await cookies();
  return createServerClient(appConfig.supabaseUrl, appConfig.supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server components cannot write cookies; proxy / middleware handles session refresh
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

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) return profile as Profile;

  // Auto-create profile if missing
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data: created } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Suzuki Owner",
      email: user.email ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "customer",
    })
    .select("*")
    .single();

  return (created as Profile) ?? null;
}

export async function getUserVehicles(userId: string): Promise<Vehicle[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  return (data as Vehicle[]) ?? [];
}

export async function getDealerSettings(): Promise<DealerSettings> {
  const fallback: DealerSettings = {
    id: "default",
    dealer_name: "Authorized Suzuki Parts Network",
    phone: "+1 (800) 555-0199",
    whatsapp: "+15550199823",
    address: "450 Motorsport Expressway, Central Auto Mall",
    notification_email: "inquiries@suzukiparts-dealer.com",
    operating_hours: "Monday - Saturday: 8:00 AM - 6:30 PM",
    updated_at: new Date().toISOString(),
  };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallback;

  const { data } = await supabase
    .from("dealer_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  return (data as DealerSettings) ?? fallback;
}
