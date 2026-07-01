import { createClient } from '@supabase/supabase-js';
import type { Tenant, Memorial } from './types';

export const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function getTenantByEmail(email: string): Promise<Tenant | null> {
  try {
    const client = adminClient();
    const { data, error } = await client
      .from('tenants')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as Tenant;
  } catch (error) {
    console.error('getTenantByEmail error:', error);
    return null;
  }
}

export async function createTenant(tenant: Partial<Tenant>): Promise<Tenant> {
  const client = adminClient();
  const { data, error } = await client
    .from('tenants')
    .insert(tenant)
    .select()
    .single();

  if (error) throw error;
  return data as Tenant;
}

export async function getTenantBySession(sessionToken: string): Promise<Tenant | null> {
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as { tenantId: string };
    const client = adminClient();
    const { data, error } = await client
      .from('tenants')
      .select('*')
      .eq('id', decoded.tenantId)
      .single();

    if (error) return null;
    return data as Tenant;
  } catch {
    return null;
  }
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  try {
    const client = adminClient();
    const { data, error } = await client
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Tenant;
  } catch {
    return null;
  }
}

export async function getMemorialsByTenant(tenantId: string): Promise<Memorial[]> {
  try {
    const client = adminClient();
    const { data, error } = await client
      .from('memorials')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memorials:', error);
      return [];
    }
    return data as Memorial[];
  } catch (error) {
    console.error('Error fetching memorials:', error);
    return [];
  }
}

export async function createMemorial(data: {
  tenant_id: string;
  name: string;
  bio?: string;
  date_of_birth?: string;
  date_of_death?: string;
  image_url?: string;
  is_public?: boolean;
}): Promise<Memorial> {
  const client = adminClient();
  const { data: memorial, error } = await client
    .from('memorials')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return memorial as Memorial;
}

