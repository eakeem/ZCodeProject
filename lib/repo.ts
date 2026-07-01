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

function getSupabaseClient(mode: 'anon' | 'admin' = 'anon') {
  if (!supabaseUrl) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL.');
  }

  const key = mode === 'admin'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(mode === 'admin'
      ? 'Supabase service role key is not configured.'
      : 'Supabase anon key is not configured.');
  }

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
      user_id: null,
    };

    const insertResult = await supabase
      .from('shared_photos')
      .insert(photo)
      .select()
      .single();

    const { data: insertedPhoto, error: insertError } = insertResult;
    if (insertError) throw insertError;
    return insertedPhoto as SharedPhoto;
  } catch {
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
  if (!id.startsWith('mem-')) {
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
      return getLocalMemorialById(id);
    }
    return data || getLocalMemorialById(id);
  } catch {
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
    return data || getLocalMemorialBySlug(slug);
  } catch {
    return getLocalMemorialBySlug(slug);
  }
}

export async function getMemorialsByTenant(tenantId: string) {
  if (!tenantId.startsWith('tenant-')) {
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
    return data?.length ? data : getLocalMemorialsByTenant(tenantId);
  } catch {
    return getLocalMemorialsByTenant(tenantId);
  }
}

export async function createMemorial(data: any) {
  const client = getSupabaseClient();
  const insertData = {
    ...data,
    tenant_id: data.tenantId,
    deceased_name: data.deceasedName,
    birth_date: data.birthDate,
    passing_date: data.passingDate,
    hero_image: data.heroImage,
    portrait_image: data.portraitImage,
    livestream_url: data.livestreamUrl,
    custom_sections: data.customSections,
    service_info: data.serviceInfo,
  }
  try {
    const { data: memorial, error } = await client
      .from('memorials')
      .insert(insertData)
      .select()
      .single()
    if (error) throw error
    return memorial
  } catch {
    const localMemorial = await upsertLocalMemorial({
      id: insertData.id || `mem-${Date.now()}`,
      tenantId: insertData.tenant_id,
      slug: insertData.slug,
      deceasedName: insertData.deceased_name || insertData.deceasedName || 'Memorial',
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
  const client = getSupabaseClient();
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
    return memorial
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
  try {
    const supabase = getSupabaseClient();
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
    if (error) throw error;
    return data;
  } catch {
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
  try {
    const supabase = getSupabaseClient();
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