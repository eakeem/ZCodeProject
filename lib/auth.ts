import bcrypt from 'bcryptjs'
import https from 'https'
import { getTenantByEmail, getTenantById, createTenant } from './repo'
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

function httpsRequest(
  hostname: string,
  path: string,
  method: string,
  headers: Record<string, string>,
  body?: object,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, port: 443, path, method, headers, timeout: 30000 },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => resolve({ status: res.statusCode || 0, body: data }))
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('timeout'))
    })
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

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

async function getProfileById(admin: ReturnType<typeof getAdminSupabase>, userId: string) {
  try {
    const { data, error } = await admin
      .from('profiles')
      .select('id,email,is_admin')
      .eq('id', userId)
      .single()
    if (error || !data) return null
    return data as { id: string; email: string; is_admin: boolean }
  } catch {
    return null
  }
}

export function createSessionToken(payload: {
  tenantId: string
  authUserId?: string
  tenantEmail: string
  tenantName: string
  tier?: string
  isAdmin?: boolean
}) {
  return jwt.sign(
    {
      tenantId: payload.tenantId,
      authUserId: payload.authUserId,
      tenantEmail: payload.tenantEmail,
      tenantName: payload.tenantName,
      tier: payload.tier || 'free',
      isAdmin: payload.isAdmin ?? false,
    },
    JWT_SECRET,
    { expiresIn: `${SESSION_MAX_AGE}s` },
  )
}

export async function signIn(email: string, password: string) {
  try {
    if (!email || !password) {
      return { ok: false, error: 'Email and password are required.' }
    }

    try {
      // The Supabase Auth SDK's fetch implementation intermittently times out
      // in this environment, while Node's native https module is reliable.
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const hostname = new URL(supabaseUrl).hostname
      const { status, body } = await httpsRequest(
        hostname,
        '/auth/v1/token?grant_type=password',
        'POST',
        {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        { email, password },
      )

      const authData = JSON.parse(body) as {
        user?: { id: string; user_metadata?: { name?: string } }
        access_token?: string
      }

      if (status >= 200 && status < 300 && authData.user?.id) {
        const adminSupabase = getAdminSupabase()
        const sessionUserId = authData.user.id
        const profile = await getProfileById(adminSupabase, sessionUserId)
        const tenant = await getTenantByEmail(email)
        // Support admin-only accounts that exist in Supabase Auth + profiles
        // but don't have a legacy tenants row yet.
        const tenantId = tenant?.id || sessionUserId
        const token = createSessionToken({
          tenantId,
          authUserId: sessionUserId,
          tenantEmail: tenant?.email || profile?.email || email,
          tenantName: tenant?.name || authData.user.user_metadata?.name || profile?.email || "Tenant",
          tier: (tenant?.tier as string | undefined) || "free",
          isAdmin: profile?.is_admin ?? false,
        })
        return { ok: true, token }
      }

      console.warn('Supabase password login returned non-2xx:', status, body.slice(0, 200))
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

    // When Supabase Auth is temporarily unreachable, local fallback login can
    // still succeed. In that case, prefer the profiles/auth user id for the
    // session token so admin checks (which query profiles by id) continue
    // to work.
    let sessionTenantId = localTenant.id
    let sessionAuthUserId: string | undefined
    let isAdmin = false
    try {
      const adminSupabase = getAdminSupabase()
      const { data: profileRow } = await adminSupabase
        .from('profiles')
        .select('id,is_admin')
        .eq('email', email)
        .single()

      if (profileRow?.id) {
        sessionAuthUserId = profileRow.id
        isAdmin = !!profileRow.is_admin
      }
    } catch {
      // keep local tenant id as a fallback
    }

    const token = createSessionToken({
      tenantId: sessionTenantId,
      authUserId: sessionAuthUserId,
      tenantEmail: localTenant.email,
      tenantName: localTenant.name,
      tier: (localTenant.tier as string | undefined) || "free",
      isAdmin,
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
      const decoded = jwt.verify(token, JWT_SECRET) as {
        tenantId?: string;
        authUserId?: string;
        tenantEmail?: string;
        tenantName?: string;
        tier?: string;
      };
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

        const remoteTenant = await getTenantById(decoded.tenantId);
        if (remoteTenant) {
          return {
            id: remoteTenant.id,
            email: remoteTenant.email,
            name: remoteTenant.name,
            createdAt: (remoteTenant as any).created_at || new Date().toISOString(),
            tier: ((remoteTenant as any).tier as any) || 'free',
          };
        }

        // Final fallback: keep session usable for admin pages even if
        // upstream tenant lookup is temporarily unavailable.
        return {
          id: decoded.tenantId,
          email: decoded.tenantEmail || '',
          name: decoded.tenantName || 'Tenant',
          createdAt: new Date().toISOString(),
          tier: (decoded.tier as any) || 'free',
        };
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
