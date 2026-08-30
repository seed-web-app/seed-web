import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // A demo deployment intentionally exposes the mock onboarding and dashboard
  // without creating Supabase auth sessions. Production mode remains protected.
  if (process.env.SEED_DEMO_MODE === "true") return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => { items.forEach(({name,value}) => request.cookies.set(name,value)); response = NextResponse.next({ request }); items.forEach(({name,value,options}) => response.cookies.set(name,value,options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/onboarding"))) return NextResponse.redirect(new URL("/login", request.url));
  if (user && request.nextUrl.pathname === "/login") return NextResponse.redirect(new URL("/dashboard", request.url));
  return response;
}
export const config = { matcher: ["/dashboard/:path*", "/onboarding", "/login"] };
