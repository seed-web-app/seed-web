import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_EXACT_ROUTES = ["/", "/login"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow API and auth callback routes without intercepting
  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    return NextResponse.next({ request });
  }

  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("auth-token") || c.name.startsWith("sb-"));

  const isPublicRoute = PUBLIC_EXACT_ROUTES.includes(pathname);

  // If unauthenticated visitor tries to access protected customer or admin routes, redirect to root login
  if (!hasAuthCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If unauthenticated and on public route, render the clean login screen immediately
  if (!hasAuthCookie && isPublicRoute) {
    return NextResponse.next({ request });
  }

  // User has auth cookies: verify session with Supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

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
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If auth cookie was invalid or expired, redirect protected routes to root login
  if (!user) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // User is authenticated: handle redirects from login/root to appropriate dashboard
  if (isPublicRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Admin route protection: requires verified admin profile
  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|suzuki-parts|Suzuki Spare Parts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
