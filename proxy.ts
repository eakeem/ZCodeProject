import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protects /admin/* routes. Session validation itself happens in
// server components (lib/auth getCurrentTenant) since that needs
// DB access; this proxy just blocks obviously unauthenticated
// requests from even rendering the route.
//
// NOTE: Next.js 16 renamed the `middleware.ts` convention to
// `proxy.ts` (the `middleware` name is deprecated). The exported
// function may be called either `middleware` or `proxy`.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = pathname.startsWith("/admin");
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("memorial_session")?.value;
  if (!token) {
    const login = new URL("/login?redirect=" + encodeURIComponent(pathname), req.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
