// ============================================================
// Auth helpers — signed httpOnly cookie sessions.
//
// Passwords are hashed with sha-256 (matches the seed account in
// lib/data/seed.ts). The session token is a JWT signed with
// JWT_SECRET (falling back to APP_SECRET for backwards compat).
//
// Swap to Supabase Auth in production: replace getTenantByEmail /
// createTenant / getTenantById with the Supabase-backed versions
// and use Supabase's session cookie instead of the JWT here.
// ============================================================

import crypto from "crypto";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  getTenantByEmail,
  createTenant,
  getTenantById,
} from "./repo";
import type { Tenant } from "./types";

export const SESSION_COOKIE = "memorial_session";

function sessionSecret(): string {
  return process.env.JWT_SECRET || process.env.APP_SECRET || "dev-secret-change-me";
}

// sha-256 hex — same scheme the seed account uses (see lib/data/seed.ts)
export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const candidate = await hashPassword(password);
  // constant-time-ish compare
  return candidate.length === hash.length && candidate === hash;
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
    passwordHash: await hashPassword(input.password),
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
  if (!(await verifyPassword(password, tenant.passwordHash))) {
    return { ok: false, error: "Invalid email or password." };
  }
  await startSession(tenant.id);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

async function currentToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
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

export async function createSession(tenantId: string): Promise<string> {
  return jwt.sign({ tenantId }, sessionSecret(), { expiresIn: "14d" });
}

export async function getTenantBySession(sessionToken: string): Promise<Tenant | null> {
  try {
    const decoded = jwt.verify(sessionToken, sessionSecret()) as { tenantId: string };
    return await getTenantById(decoded.tenantId);
  } catch {
    return null;
  }
}

export async function getCurrentTenant(): Promise<Tenant | null> {
  const token = await currentToken();
  if (!token) return null;
  return getTenantBySession(token);
}
