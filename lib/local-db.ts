import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

type LocalTenant = {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  password_hash?: string;
  tier?: string;
  createdAt?: string;
};

async function readDb() {
  const raw = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(raw) as { tenants?: LocalTenant[] };
}

async function writeDb(db: { tenants?: LocalTenant[] }) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2) + '\n', 'utf8');
}

export async function getLocalTenantByEmail(email: string) {
  const db = await readDb();
  return (db.tenants || []).find(
    (tenant) => tenant.email.toLowerCase() === email.toLowerCase(),
  ) as LocalTenant | undefined;
}

export async function getLocalTenantById(id: string) {
  const db = await readDb();
  return (db.tenants || []).find((tenant) => tenant.id === id) as LocalTenant | undefined;
}

export async function createLocalTenant(tenant: LocalTenant) {
  const db = await readDb();
  const nextTenant: LocalTenant = {
    ...tenant,
    tier: tenant.tier || 'free',
    createdAt: tenant.createdAt || new Date().toISOString(),
  };
  db.tenants = db.tenants || [];
  db.tenants.push(nextTenant);
  await writeDb(db);
  return nextTenant;
}

export async function verifyLocalPassword(password: string, storedHash?: string) {
  if (!storedHash) return false;
  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(password, storedHash);
  }

  const sha256 = (await import('crypto')).createHash('sha256');
  return sha256.update(password).digest('hex') === storedHash;
}
