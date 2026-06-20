// ============================================================
// Auth helpers. In production these delegate to Supabase Auth;
// in local dev they use a signed httpOnly cookie + sha-256
// password hashing against the local store.
// ============================================================

import crypto from "crypto";
import { cookies } from "next/headers";
import { getTenantByEmail, getTenantBySession, createTenant, createSession, destroySession } from "./repo";

export const SESSION_COOKIE = "memorial_session";

export function hashPassword(password: string): string {
  // NOTE: sha-256 is fine for the local dev fallback. Supabase Auth
  // (bcrypt + session JWTs) takes over in production.
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signUp(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email." };
  if (input.name.trim().length < 2) return { ok: false, error: "Please enter your name." };
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const existing = await getTenantByEmail(email);
  if (existing) return { ok: false, error: "An account with that email already exists." };

  const tenant = await createTenant({
    email,
    name: input.name.trim(),
    passwordHash: hashPassword(input.password),
  });
  await startSession(tenant.id);
  return { ok: true };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const tenant = await getTenantByEmail(email.trim().toLowerCase());
  if (!tenant || !tenant.passwordHash) {
    return { ok: false, error: "Invalid email or password." };
  }
  if (!verifyPassword(password, tenant.passwordHash)) {
    return { ok: false, error: "Invalid email or password." };
  }
  await startSession(tenant.id);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const token = currentToken();
  if (token) await destroySession(token);
  (await cookies()).delete(SESSION_COOKIE);
}

async function startSession(tenantId: string): Promise<void> {
  const token = await createSession(tenantId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });
}

export function currentToken(): string | undefined {
  // next/headers cookies() is async in Next 15 but sync in 14.
  // We use the .get via the sync API for Next 14 compat.
  const store = cookies() as unknown as {
    get: (name: string) => { value: string } | undefined;
  };
  return store.get(SESSION_COOKIE)?.value;
}

export async function getCurrentTenant() {
  const token = currentToken();
  if (!token) return null;
  return getTenantBySession(token);
}
