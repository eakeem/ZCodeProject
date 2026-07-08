export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentTenant } from "@/lib/auth";

const ALLOWED_BUCKETS = new Set(["memorial", "shared-photos"]);

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// POST /api/admin/delete-file
// body: { url: string, bucket: "memorial" | "shared-photos" }
//
// Extracts the object path from the Supabase public URL and deletes
// the file from storage using the service role key.
// Returns { ok: true } or { error: message }.
export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let url: string;
  let bucket: string;
  try {
    ({ url, bucket } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json(
      { error: `bucket must be one of: ${[...ALLOWED_BUCKETS].join(", ")}` },
      { status: 400 },
    );
  }

  // Extract the object path from the full Supabase public URL.
  // Input:  https://xxx.supabase.co/storage/v1/object/public/memorial/slug/file.jpg
  // Output: slug/file.jpg
  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIdx = url.indexOf(marker);
  if (markerIdx === -1) {
    return NextResponse.json(
      { error: "Could not parse storage path from URL" },
      { status: 400 },
    );
  }
  const path = decodeURIComponent(url.slice(markerIdx + marker.length));

  try {
    const supabase = adminClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error("[delete-file] Storage error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.log("DELETED FROM STORAGE:", path);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Storage delete failed";
    console.error("[delete-file] Unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
