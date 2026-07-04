import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SESSION_COOKIE_NAME = "memorial_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const JWT_SECRET = process.env.JWT_SECRET || "dev-local-secret";

function readCookie(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const pair = parts.find((p) => p.startsWith(`${name}=`));
  if (!pair) return null;
  return decodeURIComponent(pair.slice(name.length + 1));
}

export async function GET(
  req: Request,
  context: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await context.params;

  if (!tenantId) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const currentToken = readCookie(req, SESSION_COOKIE_NAME);
  let authUserId: string | undefined;
  if (currentToken) {
    try {
      const decoded = jwt.verify(currentToken, JWT_SECRET) as {
        tenantId?: string;
        authUserId?: string;
      };
      authUserId = decoded.authUserId || decoded.tenantId;
    } catch {
      // if token decode fails, we still continue with tenant-only payload
    }
  }

  const token = jwt.sign(
    {
      tenantId,
      authUserId,
      tenantName: "Selected account",
      tenantEmail: "",
      tier: "free",
      isAdmin: true,
    },
    JWT_SECRET,
    { expiresIn: `${SESSION_MAX_AGE}s` },
  );

  const url = new URL(req.url);
  const redirectPath = url.searchParams.get("redirect") || "/admin/memorial";
  const res = NextResponse.redirect(new URL(redirectPath, req.url));

  res.cookies.set(SESSION_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
