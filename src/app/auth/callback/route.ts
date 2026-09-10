import { NextResponse } from "next/server";
import { createSupabaseServerClient, getAppProfile } from "@/lib/supabase/server";
import { dashboardUrl, rootUrl } from "@/lib/tenancy";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(rootUrl("/login?error=no_code"));

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(rootUrl("/login?error=auth"));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(rootUrl("/login?error=exchange_failed"));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      rootUrl("/login?error=user_verification_failed"),
    );
  }

  const profile = await getAppProfile();
  return NextResponse.redirect(
    profile?.username
      ? dashboardUrl(profile.username)
      : rootUrl("/setup/username"),
  );
}
