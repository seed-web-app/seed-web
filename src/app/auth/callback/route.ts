import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rootUrl } from "@/lib/tenancy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(rootUrl("/login?error=no_code"));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(rootUrl("/login?error=database_unavailable"));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(rootUrl("/login?error=exchange_failed"));
  }

  // Verify server-side that getUser() returns a genuine authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(rootUrl("/login?error=user_verification_failed"));
  }

  // Check if profile and username exist
  const { getSeedProfile } = await import("@/lib/supabase/server");
  const profile = await getSeedProfile();

  if (profile?.username) {
    const { dashboardUrl } = await import("@/lib/tenancy");
    return NextResponse.redirect(dashboardUrl(profile.username));
  }

  return NextResponse.redirect(rootUrl("/setup/username"));
}
