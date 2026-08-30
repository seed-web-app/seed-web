"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rootUrl } from "@/lib/tenancy";

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/onboarding?demo=1");
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: rootUrl("/auth/callback"), queryParams: { access_type: "offline", prompt: "consent" } } });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect(rootUrl("/"));
}
