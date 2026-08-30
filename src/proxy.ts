import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { rootUrl, sharedAuthCookieOptions } from "@/lib/tenancy";

function redirectWithCookies(url: string, source: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of source.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export async function proxy(request: NextRequest) {
  if (process.env.SEED_DEMO_MODE === "true") return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        for (const { name, value } of items) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of items) {
          response.cookies.set(
            name,
            value,
            sharedAuthCookieOptions(options),
          );
        }
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const protectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/onboarding") ||
    request.nextUrl.pathname.startsWith("/setup/username");

  if (!user && protectedRoute) {
    return redirectWithCookies(rootUrl("/login"), response);
  }
  if (user && request.nextUrl.pathname === "/login") {
    return redirectWithCookies(rootUrl("/setup/username"), response);
  }
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/setup/username/:path*",
    "/login",
  ],
};
