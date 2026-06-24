// ============================================================
// Repository — the single data-access layer the whole app talks
// through. Backed by the local JSON store (lib/store.ts) by default.
//
// To switch to Supabase in production, re-implement these functions
// against lib/supabase-store.ts (same signatures) and repoint the
// imports here — nothing else in the app needs to change.
// ============================================================

import { readDb, writeDb, invalidateCache, uid } from "./store";
import type {
  Database,
  Memorial,
  MediaItem,
  Tribute,
  TributeStatus,
  TributeType,
  SharedPhoto,
  SharedPhotoStatus,
  Tenant,
  Tier,
} from "./types";

// expose the raw db reader for routes that need ad-hoc access
// (e.g. admin tribute moderation looking up a tribute + memorial)
export { readDb as getDb, invalidateCache, uid };

// ------------------------------------------------------------
// Tenants
// ------------------------------------------------------------
export async function getTenantByEmail(email: string): Promise<Tenant | null> {
  const db = await readDb();
  return db.tenants.find((t) => t.email === email.trim().toLowerCase()) ?? null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const db = await readDb();
  return db.tenants.find((t) => t.id === id) ?? null;
}

export async function createTenant(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<Tenant> {
  const tenant: Tenant = {
    id: uid("tenant-"),
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    passwordHash: input.passwordHash,
    tier: "free",
    createdAt: new Date().toISOString(),
  };
  await writeDb((db) => db.tenants.push(tenant));
  return tenant;
}

export async function setTenantTier(tenantId: string, tier: Tier): Promise<void> {
  await writeDb((db) => {
    const t = db.tenants.find((x) => x.id === tenantId);
    if (t) t.tier = tier;
  });
}

// ------------------------------------------------------------
// Memorials
// ------------------------------------------------------------
export async function getMemorialById(id: string): Promise<Memorial | null> {
  const db = await readDb();
  return db.memorials.find((m) => m.id === id) ?? null;
}

export async function getMemorialBySlug(slug: string): Promise<Memorial | null> {
  const db = await readDb();
  return db.memorials.find((m) => m.slug === slug) ?? null;
}

export async function getMemorialsByTenant(tenantId: string): Promise<Memorial[]> {
  const db = await readDb();
  return db.memorials
    .filter((m) => m.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createMemorial(
  input: Pick<Memorial, "tenantId" | "slug" | "deceasedName"> &
    Partial<Memorial>,
): Promise<Memorial> {
  const now = new Date().toISOString();
  const memorial: Memorial = {
    id: uid("mem-"),
    tenantId: input.tenantId,
    slug: input.slug,
    deceasedName: input.deceasedName,
    birthDate: input.birthDate,
    passingDate: input.passingDate,
    tagline: input.tagline,
    heroImage: input.heroImage,
    portraitImage: input.portraitImage,
    bio: input.bio,
    customSections: input.customSections ?? [],
    serviceInfo: input.serviceInfo,
    livestreamUrl: input.livestreamUrl,
    theme: input.theme ?? "ivory",
    published: input.published ?? false,
    createdAt: now,
    updatedAt: now,
  };
  await writeDb((db) => db.memorials.push(memorial));
  return memorial;
}

export async function updateMemorial(
  id: string,
  patch: Partial<Memorial>,
): Promise<Memorial | null> {
  let updated: Memorial | null = null;
  await writeDb((db) => {
    const m = db.memorials.find((x) => x.id === id);
    if (!m) return;
    Object.assign(m, patch, { updatedAt: new Date().toISOString() });
    updated = m;
  });
  return updated;
}

// ------------------------------------------------------------
// Media
// ------------------------------------------------------------
export async function getMediaByMemorial(memorialId: string): Promise<MediaItem[]> {
  const db = await readDb();
  return db.media
    .filter((m) => m.memorialId === memorialId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addMedia(
  memorialId: string,
  url: string,
  caption?: string,
): Promise<MediaItem> {
  const item: MediaItem = {
    id: uid("med-"),
    memorialId,
    url,
    caption,
    createdAt: new Date().toISOString(),
  };
  await writeDb((db) => db.media.push(item));
  return item;
}

export async function deleteMedia(id: string): Promise<void> {
  await writeDb((db) => {
    db.media = db.media.filter((m) => m.id !== id);
  });
}

// ------------------------------------------------------------
// Tributes
// ------------------------------------------------------------
export async function getTributesByMemorial(
  memorialId: string,
): Promise<Tribute[]> {
  const db = await readDb();
  return db.tributes
    .filter((t) => t.memorialId === memorialId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// If `status` is omitted, returns ALL tributes (every status) — used
// by the admin moderation screen. With a status, filters to it.
export async function getTributesByStatus(
  memorialId: string,
  status?: TributeStatus,
): Promise<Tribute[]> {
  const all = await getTributesByMemorial(memorialId);
  if (!status) return all;
  return all.filter((t) => t.status === status);
}

export async function getApprovedTributes(memorialId: string): Promise<Tribute[]> {
  return getTributesByStatus(memorialId, "approved");
}

export async function createTribute(input: {
  memorialId: string;
  type: TributeType;
  authorName: string;
  message: string;
}): Promise<Tribute> {
  const tribute: Tribute = {
    id: uid("trib-"),
    memorialId: input.memorialId,
    type: input.type,
    authorName: input.authorName,
    message: input.message,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await writeDb((db) => db.tributes.push(tribute));
  return tribute;
}

export async function setTributeStatus(
  id: string,
  status: TributeStatus,
): Promise<void> {
  await writeDb((db) => {
    const t = db.tributes.find((x) => x.id === id);
    if (t) t.status = status;
  });
}

export async function deleteTribute(id: string): Promise<void> {
  await writeDb((db) => {
    db.tributes = db.tributes.filter((t) => t.id !== id);
  });
}

// ------------------------------------------------------------
// Shared photos (visitor-submitted, family-moderated)
// ------------------------------------------------------------
export async function getSharedPhotosByMemorial(
  memorialId: string,
  status?: SharedPhotoStatus,
): Promise<SharedPhoto[]> {
  const db = await readDb();
  return db.sharedPhotos
    .filter((p) => p.memorialId === memorialId && (!status || p.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApprovedSharedPhotos(
  memorialId: string,
): Promise<SharedPhoto[]> {
  return getSharedPhotosByMemorial(memorialId, "approved");
}

export async function addSharedPhoto(input: {
  memorialId: string;
  url: string;
  caption?: string;
  authorName: string;
}): Promise<SharedPhoto> {
  const photo: SharedPhoto = {
    id: uid("photo-"),
    memorialId: input.memorialId,
    url: input.url,
    caption: input.caption,
    authorName: input.authorName,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await writeDb((db) => db.sharedPhotos.push(photo));
  return photo;
}

export async function setSharedPhotoStatus(
  id: string,
  status: SharedPhotoStatus,
): Promise<void> {
  await writeDb((db) => {
    const p = db.sharedPhotos.find((x) => x.id === id);
    if (p) p.status = status;
  });
}

export async function deleteSharedPhoto(id: string): Promise<void> {
  await writeDb((db) => {
    db.sharedPhotos = db.sharedPhotos.filter((p) => p.id !== id);
  });
}
