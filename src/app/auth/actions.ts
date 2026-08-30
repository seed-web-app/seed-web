"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/onboarding?demo=1");
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback`, queryParams: { access_type: "offline", prompt: "consent" } } });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
