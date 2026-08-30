import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { rootUrl, sharedAuthCookieOptions, usernameFromHost } from "@/lib/tenancy";

function redirectWithCookies(url: string, source: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of source.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export async function proxy(request: NextRequest) {
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

  const host = request.headers.get("host");
  const tenant = usernameFromHost(host);
  const pathname = request.nextUrl.pathname;

  // Rule 1: If accessing a tenant subdomain (e.g. username.bestmodel.fun)
  if (tenant) {
    if (!user) {
      // Unauthenticated user trying to access any tenant subdomain must be redirected to main login
      return redirectWithCookies(rootUrl("/login"), response);
    }
  }

  // Rule 2: Protected routes on any domain
  const protectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/setup/username");

  if (!user && protectedRoute) {
    return redirectWithCookies(rootUrl("/login"), response);
  }

  if (user && pathname === "/login") {
    return redirectWithCookies(rootUrl("/dashboard"), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|auth/callback|api/health).*)",
  ],
};
