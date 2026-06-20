import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protects /admin/* routes. Session validation itself happens in
// server components (lib/auth getCurrentTenant) since that needs
// DB access; middleware just blocks obviously unauthenticated
// requests from even rendering the route.
export function middleware(req: NextRequest) {
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
