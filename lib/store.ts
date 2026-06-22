// ============================================================
// Local JSON-backed data store (development default).
//
// The whole app talks to data through the `db` object below.
// When you set the Supabase env vars, swap `db` for the
// Supabase adapter (lib/supabase-store.ts) — same shape —
// and everything else keeps working unchanged.
//
// NOTE: This reads/writes a single JSON file. It is perfect for
// development and a single-server small deployment. For real
// multi-tenant scale, use Supabase.
// ============================================================

import { promises as fs } from "fs";
import path from "path";
import type { Database } from "./types";
import { seedData } from "./data/seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let cache: Database | null = null;
let writeChain: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    // first run — seed it
    await fs.writeFile(DB_FILE, JSON.stringify(seedData, null, 2), "utf8");
  }
}

export async function readDb(): Promise<Database> {
  if (cache) return cache;
  await ensureFile();
  const raw = await fs.readFile(DB_FILE, "utf8");
  let db: Database;
  try {
    db = JSON.parse(raw) as Database;
  } catch {
    // corrupt file — reseed and persist immediately
    db = JSON.parse(JSON.stringify(seedData));
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  }
  cache = db;
  return cache;
}

// All writes are serialized through a promise chain so concurrent
// requests don't clobber each other. Fine for dev / low scale.
export function writeDb(updater: (db: Database) => void): Promise<void> {
  writeChain = writeChain.then(async () => {
    const db = await readDb();
    updater(db);
    cache = db;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  });
  return writeChain;
}

export function invalidateCache(): void {
  cache = null;
}

// helper for IDs
export function uid(prefix = ""): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}
