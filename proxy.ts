import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionClaimsFromRequestCookie } from "@/lib/admin/session";

const ADMIN_REWRITE_PREFIX = "/admin-dashboard";

function rewriteToInternalAdmin(req: NextRequest) {
  const url = req.nextUrl.clone();
  const suffix = url.pathname.replace(/^\/admin/, "") || "";
  url.pathname = `${ADMIN_REWRITE_PREFIX}${suffix}`;
  return NextResponse.rewrite(url);
}

export function proxy(req: NextRequest) {
  return handleProxy(req);
}

async function handleProxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminRoot = pathname === "/admin";
  const isAdminNested = pathname.startsWith("/admin/");
  const isAdmin = isAdminRoot || isAdminNested;

  // Only protect /admin/* routes.
  if (!isAdmin) {
    return NextResponse.next();
  }

  const token = req.cookies.get("memorial_session")?.value;
  const claims = getSessionClaimsFromRequestCookie(token);
  const userId = claims?.authUserId || claims?.tenantId;

  // 1. No session -> send to login, preserving the intended destination.
  if (!userId) {
    const login = new URL("/login", req.url);
    login.searchParams.set("redirect", "/admin");
    return NextResponse.redirect(login);
  }

  // 2. Admin-only: non-admins are not allowed in the dashboard.
  if (claims?.isAdmin !== true) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // 3. Admins are allowed anywhere under /admin; rewrite the root to the
  //    internal dashboard prefix so the URL stays on /admin.
  if (isAdminRoot) {
    return rewriteToInternalAdmin(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
