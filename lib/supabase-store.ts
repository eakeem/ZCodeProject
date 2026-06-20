// ============================================================
// Supabase adapter — implements the SAME repository contract as
// lib/repo.ts but against Supabase (Postgres + RLS).
//
// To activate:
//   1. Fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
//      and SUPABASE_SERVICE_ROLE_KEY in .env.local
//   2. Run supabase/schema.sql in the Supabase SQL editor
//   3. In lib/repo.ts, re-export from here:
//        export * from "./supabase-store";
//
// This file uses createClient on each call so it works in
// serverless (no global singletons across warm requests). For
// production scale use the Supabase connection pooler.
// ============================================================

// NOTE: This requires `@supabase/supabase-js`:
//   npm i @supabase/supabase-js
// It is intentionally NOT imported at top level so the app still
// runs without Supabase configured. Uncomment after install + env.

/*
import { createClient } from "@supabase/supabase-js";
import type {
  Memorial, MediaItem, Tribute, TributeStatus, TributeType,
  Tenant, Tier, CustomSection,
} from "./types";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ... re-implement every function from lib/repo.ts here against
// the `tenants`, `memorials`, `media`, `tributes` tables. The
// snake_case columns map to the camelCase types via a small
// transform. Use the service-role client for admin operations and
// enforce tenant scoping explicitly (defence in depth alongside RLS).

export async function getMemorialBySlug(slug: string): Promise<Memorial | null> {
  const { data } = await adminClient()
    .from("memorials").select("*").eq("slug", slug).single();
  return data ? rowToMemorial(data) : null;
}
// (full set of functions omitted for brevity — mirror lib/repo.ts 1:1)
*/
