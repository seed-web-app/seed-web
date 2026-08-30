import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rootUrl } from "@/lib/tenancy";

export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get("code"); const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/setup/username";
  if (code) { const supabase = await createSupabaseServerClient(); if (supabase) { const { error } = await supabase.auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(rootUrl(next)); } }
  return NextResponse.redirect(rootUrl("/login?error=callback"));
}
