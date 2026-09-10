import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.redirect(`${origin}/login?error=user_verification_failed`);
  }

  // Admin always lands in the admin panel
  if (profile.role === "admin") {
    return NextResponse.redirect(`${origin}/admin`);
  }

  // Check if customer has registered their first vehicle
  const { count } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", profile.id);

  if (count === 0) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}/home`);
}
