import { createClient } from '@supabase/supabase-js'
import {
  addLocalMedia,
  addLocalTribute,
  deleteLocalMedia,
  deleteLocalTribute,
  addLocalSharedPhoto,
  deleteLocalSharedPhoto,
  getLocalApprovedSharedPhotos,
  getLocalMediaByMemorial,
  getLocalMemorialById,
  getLocalMemorialBySlug,
  getLocalMemorialsByTenant,
  getLocalSharedPhotosByMemorial,
  getLocalTenantByEmail,
  getLocalTenantById,
  getLocalTributeById,
  getLocalTributesByStatus,
  updateLocalSharedPhoto,
  updateLocalTribute,
  upsertLocalMemorial,
} from './local-data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function looksLikeUuid(value?: string | null) {
  return Boolean(
    value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

// Transform Supabase snake_case response to camelCase for our types
function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (typeof obj !== 'object') return obj;

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    const value = obj[key];
    acc[camelKey] = typeof value === 'object' ? snakeToCamel(value) : value;
    return acc;
  }, {} as any);
}

function shouldUseLocalFallback(id?: string | null) {
  return !looksLikeUuid(id);
}

function getSupabaseClient(mode: 'anon' | 'admin' = 'anon') {
  if (!supabaseUrl) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL.');
  }

  const key = mode === 'admin'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    const missing = mode === 'admin' ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
    const msg = `Supabase ${missing} is not configured. Have you set this env var?`;
    console.error(msg, { hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY, hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY });
    throw new Error(msg);
  }

  console.log(`Using Supabase ${mode} client with URL: ${supabaseUrl}`);
  return createClient(supabaseUrl, key, { auth: { persistSession: false } });
}

export type SharedPhotoStatus = 'pending' | 'approved' | 'rejected'

export type SharedPhoto = {
  id: string
  memorial_id: string
  url: string
  caption: string | null
  author_name: string
  status: SharedPhotoStatus
  created_at: string
  user_id: string | null  // <- add this if your table has user_id
}

export async function getSharedPhotosByMemorial(
  memorialId: string,
  status?: SharedPhotoStatus,
): Promise<SharedPhoto[]> {
  if (shouldUseLocalFallback(memorialId)) {
    return getLocalSharedPhotosByMemorial(memorialId, status) as Promise<SharedPhoto[]>;
  }

  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('shared_photos')
      .select('*')
      .eq('memorial_id', memorialId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as SharedPhoto[]) || [];
  } catch {
    return getLocalSharedPhotosByMemorial(memorialId, status) as Promise<SharedPhoto[]>;
  }
}

export async function addSharedPhoto(input: {
  memorialId: string;
  url: string;
  caption?: string;
  authorName: string;
}): Promise<SharedPhoto> {
  try {
    const supabase = getSupabaseClient('admin');
    const photo = {
      memorial_id: input.memorialId,
      url: input.url,
      caption: input.caption || null,
      author_name: input.authorName,
      status: "pending" as SharedPhotoStatus,
      created_at: new Date().toISOString(),
    };

    const insertResult = await supabase
      .from('shared_photos')
      .insert(photo)
      .select()
      .single();

    const { data: insertedPhoto, error: insertError } = insertResult;
    if (insertError) {
      console.error('addSharedPhoto Supabase error:', insertError);
      throw insertError;
    }
    console.log('addSharedPhoto Supabase success:', insertedPhoto);
    return insertedPhoto as SharedPhoto;
  } catch (err) {
    console.error('addSharedPhoto failed, falling back to local:', err);
    const localPhoto = {
      id: `shared-${Date.now()}`,
      memorialId: input.memorialId,
      url: input.url,
      caption: input.caption || undefined,
      authorName: input.authorName,
      status: 'pending' as SharedPhotoStatus,
      createdAt: new Date().toISOString(),
    };
    return addLocalSharedPhoto(localPhoto) as Promise<SharedPhoto>;
  }
}

export async function setSharedPhotoStatus(
  id: string,
  status: SharedPhotoStatus,
): Promise<void> {
  const supabase = getSupabaseClient('admin');
  const { error } = await supabase
    .from('shared_photos')
    .update({ status })
    .eq('id', id);
  if (error) throw error
}

export async function deleteSharedPhoto(id: string): Promise<void> {
  const supabase = getSupabaseClient('admin');
  const { error } = await supabase
    .from('shared_photos')
    .delete()
    .eq('id', id);
  if (error) throw error
}

export async function getTenantByEmail(email: string) {
  try {
    const supabase = getSupabaseClient('admin');
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch {
    return getLocalTenantByEmail(email);
  }
}

export async function createTenant(data: { 
  id: string, 
  email: string, 
  name: string,
  password_hash: string
}) {
  const supabase = getSupabaseClient('admin');
  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      id: data.id,
      email: data.email,
      name: data.name,
      auth_id: data.id,
      password_hash: data.password_hash,
    })
    .select()
    .single()
  
  if (error) throw error
  return tenant
}

export async function getTenantById(id: string) {
  try {
    const supabase = getSupabaseClient('admin');
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || getLocalTenantById(id);
  } catch {
    return getLocalTenantById(id);
  }
}

export async function getMemorialById(id: string) {
  if (shouldUseLocalFallback(id)) {
    return getLocalMemorialById(id);
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('memorials')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code !== 'PGRST116') throw error;
      console.log('getMemorialById: not found in Supabase, trying local:', id);
      return getLocalMemorialById(id);
    }
    const transformed = data ? snakeToCamel(data) : null;
    console.log('getMemorialById Supabase result:', { id, found: !!transformed, tenantId: transformed?.tenantId });
    return transformed || getLocalMemorialById(id);
  } catch (err) {
    console.error('getMemorialById error:', err);
    return getLocalMemorialById(id);
  }
}

export async function getMemorialBySlug(slug: string) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('memorials')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) {
      if (error.code !== 'PGRST116') throw error;
      return getLocalMemorialBySlug(slug);
    }
    return data ? snakeToCamel(data) : getLocalMemorialBySlug(slug);
  } catch {
    return getLocalMemorialBySlug(slug);
  }
}

export async function getMemorialsByTenant(tenantId: string) {
  if (shouldUseLocalFallback(tenantId)) {
    return getLocalMemorialsByTenant(tenantId);
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('memorials')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) {
      if (error.code !== 'PGRST116') throw error;
      return getLocalMemorialsByTenant(tenantId);
    }
    return data?.length ? data.map(snakeToCamel) : getLocalMemorialsByTenant(tenantId);
  } catch {
    return getLocalMemorialsByTenant(tenantId);
  }
}

export async function createMemorial(data: any) {
  // For real Supabase users, always use Supabase first — no local fallback for writes
  const client = getSupabaseClient('admin');
  const insertData = {
    tenant_id: data.tenantId,
    slug: data.slug,
    deceased_name: data.deceasedName,
    birth_date: data.birthDate,
    passing_date: data.passingDate,
    tagline: data.tagline,
    hero_image: data.heroImage,
    portrait_image: data.portraitImage,
    bio: data.bio,
    livestream_url: data.livestreamUrl,
    custom_sections: data.customSections,
    service_info: data.serviceInfo,
    theme: data.theme || 'ivory',
    published: data.published ?? false,
  }
  try {
    const { data: memorial, error } = await client
      .from('memorials')
      .insert(insertData)
      .select()
      .single()
    if (error) {
      console.error('createMemorial Supabase error:', error);
      throw error;
    }
    console.log('createMemorial Supabase success:', memorial);
    return snakeToCamel(memorial)
  } catch (err) {
    console.error('createMemorial failed, falling back to local:', err);
    const localMemorial = await upsertLocalMemorial({
      id: `mem-${Date.now()}`,
      tenantId: insertData.tenant_id,
      slug: insertData.slug,
      deceasedName: insertData.deceased_name || 'Memorial',
      birthDate: insertData.birth_date,
      passingDate: insertData.passing_date,
      tagline: insertData.tagline,
      heroImage: insertData.hero_image,
      portraitImage: insertData.portrait_image,
      bio: insertData.bio,
      customSections: insertData.custom_sections || [],
      serviceInfo: insertData.service_info || {},
      livestreamUrl: insertData.livestream_url,
      theme: insertData.theme || 'ivory',
      published: Boolean(insertData.published),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return localMemorial
  }
}

export async function updateMemorial(id: string, patch: Record<string, unknown>) {
  // For real Supabase users, always write to Supabase
  const client = getSupabaseClient('admin');
  const updateData: Record<string, unknown> = {}
  const localPatch: Record<string, unknown> = {}
  if ('deceasedName' in patch) {
    updateData.deceased_name = patch.deceasedName
    localPatch.deceasedName = patch.deceasedName
  }
  if ('birthDate' in patch) {
    updateData.birth_date = patch.birthDate
    localPatch.birthDate = patch.birthDate
  }
  if ('passingDate' in patch) {
    updateData.passing_date = patch.passingDate
    localPatch.passingDate = patch.passingDate
  }
  if ('tagline' in patch) {
    updateData.tagline = patch.tagline
    localPatch.tagline = patch.tagline
  }
  if ('heroImage' in patch) {
    updateData.hero_image = patch.heroImage
    localPatch.heroImage = patch.heroImage
  }
  if ('portraitImage' in patch) {
    updateData.portrait_image = patch.portraitImage
    localPatch.portraitImage = patch.portraitImage
  }
  if ('bio' in patch) {
    updateData.bio = patch.bio
    localPatch.bio = patch.bio
  }
  if ('customSections' in patch) {
    updateData.custom_sections = patch.customSections
    localPatch.customSections = patch.customSections
  }
  if ('serviceInfo' in patch) {
    updateData.service_info = patch.serviceInfo
    localPatch.serviceInfo = patch.serviceInfo
  }
  if ('livestreamUrl' in patch) {
    updateData.livestream_url = patch.livestreamUrl
    localPatch.livestreamUrl = patch.livestreamUrl
  }
  if ('theme' in patch) {
    updateData.theme = patch.theme
    localPatch.theme = patch.theme
  }
  if ('published' in patch) {
    updateData.published = patch.published
    localPatch.published = patch.published
  }

  try {
    const { data: memorial, error } = await client
      .from('memorials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return snakeToCamel(memorial)
  } catch {
    const existing = await getLocalMemorialById(id);
    const localMemorial = await upsertLocalMemorial({
      ...existing,
      id,
      ...localPatch,
      tenantId: existing?.tenantId,
      slug: existing?.slug,
      published: Boolean(localPatch.published ?? existing?.published),
      updatedAt: new Date().toISOString(),
    })
    return localMemorial
  }
}

export async function getMediaByMemorial(memorialId: string) {
  if (shouldUseLocalFallback(memorialId)) {
    return getLocalMediaByMemorial(memorialId);
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('memorial_id', memorialId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch {
    return getLocalMediaByMemorial(memorialId);
  }
}

export async function addMedia(memorialId: string, url: string, caption?: string) {
  try {
    const supabase = getSupabaseClient('admin');
    const { data, error } = await supabase
      .from('media')
      .insert({ memorial_id: memorialId, url, caption })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch {
    const item = {
      id: `med-${Date.now()}`,
      memorialId,
      url,
      caption: caption || null,
      createdAt: new Date().toISOString(),
    };
    return addLocalMedia(item);
  }
}

export async function deleteMedia(id: string) {
  try {
    const supabase = getSupabaseClient('admin');
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch {
    await deleteLocalMedia(id);
  }
}

export async function getTributesByStatus(memorialId: string, status?: string) {
  if (shouldUseLocalFallback(memorialId)) {
    return getLocalTributesByStatus(memorialId, status);
  }

  try {
    const supabase = getSupabaseClient('admin');
    let query = supabase
      .from('tributes')
      .select('*')
      .eq('memorial_id', memorialId)
    if (status) query = query.eq('status', status)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch {
    return getLocalTributesByStatus(memorialId, status);
  }
}

export async function getApprovedTributes(memorialId: string) {
  return await getTributesByStatus(memorialId, 'approved')
}

export async function createTribute(input: {
  memorialId: string
  type: string
  authorName: string
  message: string
}) {
  try {
    const supabase = getSupabaseClient('admin');
    const { data, error } = await supabase
      .from('tributes')
      .insert({
        memorial_id: input.memorialId,
        type: input.type,
        author_name: input.authorName,
        message: input.message,
        status: 'pending',
      })
      .select()
      .single();
    if (error) {
      console.error('createTribute Supabase error:', error);
      throw error;
    }
    console.log('createTribute Supabase success:', data);
    return data;
  } catch (err) {
    console.error('createTribute failed, falling back to local:', err);
    const item = {
      id: `trib-${Date.now()}`,
      memorialId: input.memorialId,
      type: input.type,
      authorName: input.authorName,
      message: input.message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    return addLocalTribute(item);
  }
}

export async function setTributeStatus(id: string, status: string) {
  try {
    const supabase = getSupabaseClient('admin');
    const { error } = await supabase
      .from('tributes')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  } catch {
    await updateLocalTribute(id, { status });
  }
}

export async function deleteTribute(id: string) {
  try {
    const supabase = getSupabaseClient('admin');
    const { error } = await supabase
      .from('tributes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch {
    await deleteLocalTribute(id);
  }
}

export async function getTributeById(id: string) {
  try {
    const supabase = getSupabaseClient('admin');
    const { data, error } = await supabase
      .from('tributes')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || getLocalTributeById(id);
  } catch {
    return getLocalTributeById(id);
  }
}

export async function getApprovedSharedPhotos(memorialId: string) {
  if (shouldUseLocalFallback(memorialId)) {
    return getLocalApprovedSharedPhotos(memorialId);
  }

  try {
    const supabase = getSupabaseClient('admin');
    const { data, error } = await supabase
      .from('shared_photos')
      .select('*')
      .eq('memorial_id', memorialId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch {
    return getLocalApprovedSharedPhotos(memorialId);
  }
}

export async function setTenantTier(id: string, tier: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('tenants')
    .update({ tier })
    .eq('id', id)
  if (error) throw error
}