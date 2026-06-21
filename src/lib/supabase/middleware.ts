import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Optimize: Skip session refresh/getUser calls for Next.js route prefetching.
  // This prevents multiple redundant network roundtrips to Supabase when sidebar links are prefetched.
  const isPrefetch = 
    request.headers.get("x-middleware-prefetch") === "1" || 
    request.headers.get("purpose") === "prefetch";
    
  if (isPrefetch) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session - IMPORTANT
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/customers") ||
    request.nextUrl.pathname.startsWith("/backups") ||
    request.nextUrl.pathname.startsWith("/settings");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect root to dashboard or login
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated, forward user headers to avoid redundant database calls in Server Components
  if (user) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-email", user.email || "");
    requestHeaders.set("x-user-id", user.id);
    
    // Create new response with forwarded headers
    const responseWithHeaders = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    // Copy cookies from supabaseResponse to responseWithHeaders
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      responseWithHeaders.cookies.set(cookie.name, cookie.value, {
        domain: cookie.domain,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
      });
    });
    
    return responseWithHeaders;
  }

  return supabaseResponse;
}
