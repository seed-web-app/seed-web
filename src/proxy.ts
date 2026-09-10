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
        for (const { name, value } of items) {
          request.cookies.set(name, value);
        }
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
  const pathname = request.nextUrl.pathname;
  const tenant = usernameFromHost(request.headers.get("host"));

  if (tenant && !user) {
    return redirectWithCookies(rootUrl("/login"), response);
  }

  const protectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/setup/username") ||
    pathname.startsWith("/api/profile");

  if (protectedRoute && !user) {
    return redirectWithCookies(rootUrl("/login"), response);
  }

  if (pathname === "/login" && user) {
    return redirectWithCookies(rootUrl("/dashboard"), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback).*)",
  ],
};
