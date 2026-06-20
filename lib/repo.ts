// ============================================================
// Repository — the single API the whole app uses to read/write
// data. Today it is backed by the local JSON store; the same
// functions will be reimplemented against Supabase in
// `lib/supabase-store.ts`. Components never touch the store
// directly, so the swap is painless.
// ============================================================

import { readDb, writeDb, uid } from "./store";
import type {
  Database,
  Memorial,
  MediaItem,
  Tribute,
  TributeStatus,
  TributeType,
  Tenant,
  Tier,
  CustomSection,
} from "./types";

// ---- Memorials ----

export async function getMemorialBySlug(slug: string): Promise<Memorial | null> {
  const db = await readDb();
  return db.memorials.find((m) => m.slug === slug) ?? null;
}

export async function getMemorialById(id: string): Promise<Memorial | null> {
  const db = await readDb();
  return db.memorials.find((m) => m.id === id) ?? null;
}

export async function getMemorialsByTenant(tenantId: string): Promise<Memorial[]> {
  const db = await readDb();
  return db.memorials.filter((m) => m.tenantId === tenantId);
}

export async function updateMemorial(
  id: string,
  patch: Partial<Memorial>,
): Promise<Memorial | null> {
  let updated: Memorial | null = null;
  await writeDb((db) => {
    const idx = db.memorials.findIndex((m) => m.id === id);
    if (idx === -1) return;
    db.memorials[idx] = {
      ...db.memorials[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    updated = db.memorials[idx];
  });
  return updated;
}

export async function createMemorial(
  tenantId: string,
  data: Pick<Memorial, "slug" | "deceasedName"> &
    Partial<Omit<Memorial, "id" | "tenantId" | "createdAt" | "updatedAt">>,
): Promise<Memorial> {
  const now = new Date().toISOString();
  const memorial: Memorial = {
    id: uid("mem-"),
    tenantId,
    customSections: [],
    theme: "ivory",
    published: false,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  await writeDb((db) => {
    db.memorials.push(memorial);
  });
  return memorial;
}

// ---- Custom sections ----

export async function addCustomSection(
  memorialId: string,
  section: Omit<CustomSection, "id">,
): Promise<void> {
  await writeDb((db) => {
    const m = db.memorials.find((x) => x.id === memorialId);
    if (!m) return;
    m.customSections.push({ ...section, id: uid("sec-") });
  });
}

export async function updateCustomSection(
  memorialId: string,
  sectionId: string,
  patch: Partial<CustomSection>,
): Promise<void> {
  await writeDb((db) => {
    const m = db.memorials.find((x) => x.id === memorialId);
    const s = m?.customSections.find((c) => c.id === sectionId);
    if (s) Object.assign(s, patch);
  });
}

export async function deleteCustomSection(
  memorialId: string,
  sectionId: string,
): Promise<void> {
  await writeDb((db) => {
    const m = db.memorials.find((x) => x.id === memorialId);
    if (!m) return;
    m.customSections = m.customSections.filter((c) => c.id !== sectionId);
  });
}

// ---- Media ----

export async function getMediaByMemorial(memorialId: string): Promise<MediaItem[]> {
  const db = await readDb();
  return db.media
    .filter((m) => m.memorialId === memorialId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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
  await writeDb((db) => {
    db.media.push(item);
  });
  return item;
}

export async function deleteMedia(id: string): Promise<void> {
  await writeDb((db) => {
    db.media = db.media.filter((m) => m.id !== id);
  });
}

// ---- Tributes ----

export async function getApprovedTributes(memorialId: string): Promise<Tribute[]> {
  const db = await readDb();
  return db.tributes
    .filter((t) => t.memorialId === memorialId && t.status === "approved")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getTributesByStatus(
  memorialId: string,
  status?: TributeStatus,
): Promise<Tribute[]> {
  const db = await readDb();
  return db.tributes
    .filter(
      (t) =>
        t.memorialId === memorialId && (status ? t.status === status : true),
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createTribute(input: {
  memorialId: string;
  type: TributeType;
  authorName: string;
  message: string;
  imageUrl?: string;
}): Promise<Tribute> {
  const tribute: Tribute = {
    id: uid("trib-"),
    memorialId: input.memorialId,
    type: input.type,
    authorName: input.authorName.slice(0, 80),
    message: input.message.slice(0, 1000),
    imageUrl: input.imageUrl,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await writeDb((db) => {
    db.tributes.push(tribute);
  });
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

// ---- Tenants ----

export async function getTenantByEmail(email: string): Promise<Tenant | null> {
  const db = await readDb();
  return (
    db.tenants.find((t) => t.email.toLowerCase() === email.toLowerCase()) ??
    null
  );
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
    email: input.email,
    name: input.name,
    tier: "free",
    createdAt: new Date().toISOString(),
    passwordHash: input.passwordHash,
  };
  await writeDb((db) => {
    db.tenants.push(tenant);
  });
  return tenant;
}

export async function setTenantTier(id: string, tier: Tier): Promise<void> {
  await writeDb((db) => {
    const t = db.tenants.find((x) => x.id === id);
    if (t) t.tier = tier;
  });
}

// ---- Sessions (local dev only) ----

export async function createSession(tenantId: string): Promise<string> {
  const token = uid("sess-") + uid();
  await writeDb((db) => {
    db.sessions[token] = tenantId;
  });
  return token;
}

export async function getTenantBySession(
  token: string,
): Promise<Tenant | null> {
  if (!token) return null;
  const db = await readDb();
  const tenantId = db.sessions[token];
  if (!tenantId) return null;
  return db.tenants.find((t) => t.id === tenantId) ?? null;
}

export async function destroySession(token: string): Promise<void> {
  await writeDb((db) => {
    delete db.sessions[token];
  });
}

// expose raw db for the gate/migration helpers
export async function getDb(): Promise<Database> {
  return readDb();
}
