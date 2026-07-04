import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "memorial_session";
const JWT_SECRET = process.env.JWT_SECRET || "dev-local-secret";

export type SessionClaims = {
  tenantId?: string;
  authUserId?: string;
  tenantEmail?: string;
  tenantName?: string;
  tier?: string;
  isAdmin?: boolean;
};

function decodeToken(token?: string | null): SessionClaims | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as SessionClaims;
  } catch {
    return null;
  }
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const decoded = decodeToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  return decoded?.authUserId || decoded?.tenantId || null;
}

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  return decodeToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function getSessionUserIdFromRequestCookie(token?: string) {
  const decoded = decodeToken(token);
  return decoded?.authUserId || decoded?.tenantId || null;
}

export function getSessionClaimsFromRequestCookie(token?: string): SessionClaims | null {
  return decodeToken(token);
}
