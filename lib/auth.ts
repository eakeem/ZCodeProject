import bcrypt from 'bcryptjs'
import { getTenantByEmail, createTenant } from './repo'
import { getTenantBySession } from './supabase-store'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import {
  createLocalTenant,
  getLocalTenantByEmail,
  getLocalTenantById,
  verifyLocalPassword,
} from './local-db'

function getAnonSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

const SESSION_COOKIE_NAME = 'memorial_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const JWT_SECRET = process.env.JWT_SECRET || 'dev-local-secret'

export async function signUp(input: {email: string, name: string, password: string}) {
  try {
    if (input.password.length < 8) {
      return { ok: false, error: "Password must be at least 8 chars" }
    }

    const localExisting = await getLocalTenantByEmail(input.email)
    if (localExisting) {
      return { ok: false, error: "An account with that email already exists." }
    }

    const existing = await getTenantByEmail(input.email)
    if (existing) {
      return { ok: false, error: "An account with that email already exists." }
    }

    try {
      const adminSupabase = getAdminSupabase();
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { name: input.name },
      })

      if (!authError && authData.user) {
        const password_hash = await bcrypt.hash(input.password, 10)
        const localTenant = await createLocalTenant({
          id: authData.user.id,
          email: input.email,
          name: input.name,
          passwordHash: password_hash,
        })
        try {
          await createTenant({
            id: authData.user.id,
            email: input.email,
            name: input.name,
            password_hash,
          })
        } catch (remoteTenantError) {
          console.warn('Remote tenant record sync skipped:', remoteTenantError)
        }
        return { ok: true, tenant: { id: localTenant.id, email: localTenant.email, name: localTenant.name } }
      }
    } catch (supabaseError: any) {
      console.warn('Supabase signup fallback triggered:', supabaseError?.message || supabaseError)
    }

    const password_hash = await bcrypt.hash(input.password, 10)
    const tenant = await createLocalTenant({
      id: `tenant-${Date.now()}`,
      email: input.email,
      name: input.name,
      passwordHash: password_hash,
    })

    return { ok: true, tenant: { id: tenant.id, email: tenant.email, name: tenant.name } }
  } catch (e: any) {
    console.error("signUp error:", e)
    return { ok: false, error: e.message || "Database error" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    if (!email || !password) {
      return { ok: false, error: 'Email and password are required.' }
    }

    try {
      const anonSupabase = getAnonSupabase();
      const { data, error } = await anonSupabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.session?.user) {
        const tenant = await getTenantByEmail(email)
        if (tenant) {
          const token = jwt.sign({ tenantId: tenant.id }, JWT_SECRET, {
            expiresIn: `${SESSION_MAX_AGE}s`,
          })
          return { ok: true, token }
        }
      }
    } catch (supabaseError: any) {
      console.warn('Supabase login fallback triggered:', supabaseError?.message || supabaseError)
    }

    const localTenant = await getLocalTenantByEmail(email)
    if (!localTenant) {
      return { ok: false, error: 'Tenant not found.' }
    }

    const passwordMatches = await verifyLocalPassword(password, localTenant.passwordHash || localTenant.password_hash)
    if (!passwordMatches) {
      return { ok: false, error: 'Invalid login.' }
    }

    const token = jwt.sign({ tenantId: localTenant.id }, JWT_SECRET, {
      expiresIn: `${SESSION_MAX_AGE}s`,
    })

    return { ok: true, token }
  } catch (e: any) {
    console.error('signIn error:', e)
    return { ok: false, error: e.message || 'Login failed.' }
  }
}

export async function signOut() {
  return { ok: true }
}

export async function getCurrentTenant() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { tenantId?: string };
      if (decoded.tenantId) {
        const localTenant = await getLocalTenantById(decoded.tenantId);
        if (localTenant) {
          return {
            id: localTenant.id,
            email: localTenant.email,
            name: localTenant.name,
            createdAt: localTenant.createdAt || new Date().toISOString(),
            tier: (localTenant.tier as any) || 'free',
          };
        }
      }
    } catch {
      // fall back to the Supabase-backed session lookup below
    }

    return await getTenantBySession(token);
  } catch (e: any) {
    console.error('getCurrentTenant error:', e);
    return null;
  }
}
