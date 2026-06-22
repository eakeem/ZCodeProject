import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export type Memorial = {
  id: string;
  tenant_id: string;
  name: string;
  bio: string | null;
  slug:string;
  date_of_birth: string | null;
  date_of_death: string | null;
  image_url: string | null;
  is_public: boolean;
  created_at: string;
};
export type Tier = 'free' | 'pro' | 'basic';
export type Tenant = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  tier: Tier;
  created_at: string;
};

function adminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}



export async function getTenantByEmail(email: string): Promise<Tenant | null> {
  const { data, error } = await adminClient()
    .from('tenants')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as Tenant;
}

export async function createTenant(tenant: Partial<Tenant>): Promise<Tenant> {
  const { data, error } = await adminClient()
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
    const { data, error } = await adminClient()
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
  const { data, error } = await adminClient()
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data as Tenant;
}
export async function getMemorialsByTenant(tenantId: string): Promise<Memorial[]> {
  const { data, error } = await adminClient()
    .from('memorials')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching memorials:', error);
    return [];
  }
  return data as Memorial[];
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
  const { data: memorial, error } = await adminClient()
    .from('memorials')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return memorial as Memorial;
}