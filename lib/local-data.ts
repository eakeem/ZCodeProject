import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

const dbPath = process.env.LOCAL_DB_PATH || path.join(os.tmpdir(), 'memorial-db.json');

export type LocalDatabase = {
  tenants?: Array<any>;
  memorials?: Array<any>;
  media?: Array<any>;
  tributes?: Array<any>;
  sharedPhotos?: Array<any>;
};

export async function readLocalDb(): Promise<LocalDatabase> {
  try {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    const raw = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(raw) as LocalDatabase;
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify({ tenants: [], memorials: [], media: [], tributes: [], sharedPhotos: [] }, null, 2) + '\n', 'utf8');
      return {} as LocalDatabase;
    }
    throw error;
  }
}

export async function getLocalMemorialsByTenant(tenantId: string) {
  const db = await readLocalDb();
  return (db.memorials || []).filter((memorial) => memorial.tenantId === tenantId);
}

export async function getLocalMemorialById(id: string) {
  const db = await readLocalDb();
  return (db.memorials || []).find((memorial) => memorial.id === id);
}

export async function getLocalMemorialBySlug(slug: string) {
  const db = await readLocalDb();
  return (db.memorials || []).find((memorial) => memorial.slug === slug);
}

export async function getLocalMediaByMemorial(memorialId: string) {
  const db = await readLocalDb();
  return (db.media || []).filter((item) => item.memorialId === memorialId);
}

export async function getLocalTributesByStatus(memorialId: string, status?: string) {
  const db = await readLocalDb();
  const items = (db.tributes || []).filter((tribute) => tribute.memorialId === memorialId);
  if (!status) return items;
  return items.filter((tribute) => tribute.status === status);
}

export async function getLocalApprovedSharedPhotos(memorialId: string) {
  const db = await readLocalDb();
  return (db.sharedPhotos || []).filter(
    (photo) => photo.memorialId === memorialId && photo.status === 'approved',
  );
}

export async function getLocalSharedPhotosByMemorial(memorialId: string, status?: string) {
  const db = await readLocalDb();
  const items = (db.sharedPhotos || []).filter((photo) => photo.memorialId === memorialId);
  if (!status) return items;
  return items.filter((photo) => photo.status === status);
}

export async function addLocalSharedPhoto(photo: any) {
  const db = await readLocalDb();
  db.sharedPhotos = db.sharedPhotos || [];
  db.sharedPhotos.push(photo);
  await writeLocalDb(db);
  return photo;
}

export async function updateLocalSharedPhoto(id: string, patch: Record<string, unknown>) {
  const db = await readLocalDb();
  db.sharedPhotos = db.sharedPhotos || [];
  const index = db.sharedPhotos.findIndex((item) => item.id === id);
  if (index >= 0) {
    db.sharedPhotos[index] = { ...db.sharedPhotos[index], ...patch };
    await writeLocalDb(db);
    return db.sharedPhotos[index];
  }
  return null;
}

export async function deleteLocalSharedPhoto(id: string) {
  const db = await readLocalDb();
  db.sharedPhotos = (db.sharedPhotos || []).filter((item) => item.id !== id);
  await writeLocalDb(db);
}

export async function writeLocalDb(db: LocalDatabase) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2) + '\n', 'utf8');
}

export async function upsertLocalMemorial(memorial: any) {
  const db = await readLocalDb();
  db.memorials = db.memorials || [];
  const index = db.memorials.findIndex((item) => item.id === memorial.id);
  if (index >= 0) {
    db.memorials[index] = { ...db.memorials[index], ...memorial };
  } else {
    db.memorials.push(memorial);
  }
  await writeLocalDb(db);
  return memorial;
}

export async function getLocalTenantById(id: string) {
  const db = await readLocalDb();
  return (db.tenants || []).find((tenant) => tenant.id === id);
}

export async function getLocalTenantByEmail(email: string) {
  const db = await readLocalDb();
  return (db.tenants || []).find((tenant) => tenant.email === email);
}

export async function addLocalMedia(media: any) {
  const db = await readLocalDb();
  db.media = db.media || [];
  db.media.push(media);
  await writeLocalDb(db);
  return media;
}

export async function deleteLocalMedia(id: string) {
  const db = await readLocalDb();
  db.media = (db.media || []).filter((item) => item.id !== id);
  await writeLocalDb(db);
}

export async function getLocalTributeById(id: string) {
  const db = await readLocalDb();
  return (db.tributes || []).find((item) => item.id === id);
}

export async function addLocalTribute(tribute: any) {
  const db = await readLocalDb();
  db.tributes = db.tributes || [];
  db.tributes.push(tribute);
  await writeLocalDb(db);
  return tribute;
}

export async function updateLocalTribute(id: string, patch: Record<string, unknown>) {
  const db = await readLocalDb();
  db.tributes = db.tributes || [];
  const index = db.tributes.findIndex((item) => item.id === id);
  if (index >= 0) {
    db.tributes[index] = { ...db.tributes[index], ...patch };
    await writeLocalDb(db);
    return db.tributes[index];
  }
  return null;
}

export async function deleteLocalTribute(id: string) {
  const db = await readLocalDb();
  db.tributes = (db.tributes || []).filter((item) => item.id !== id);
  await writeLocalDb(db);
}
