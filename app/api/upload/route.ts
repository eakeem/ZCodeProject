// Sharp (via lib/storage.ts uploadImage) requires the Node.js runtime.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialById, addMedia, getMediaByMemorial } from "@/lib/repo";
import { canUploadMore } from "@/lib/gate";
import { uploadImage, validateImageUpload } from "@/lib/storage";

// Allow up to 12 MB request bodies (Next.js default is 4 MB; our image
// cap is 10 MB so we need a bit of head-room for multipart overhead).
export const config = {
  api: { bodyParser: false, sizeLimit: "12mb" },
};

const ALLOWED_BUCKETS = new Set(["memorial", "shared-photos"]);

// POST /api/upload — multipart file upload with automatic image compression.
//
// Form fields:
//   file    — the image to upload
//   bucket  — "memorial" (gallery) or "shared-photos" (visitor photos)
//   slug    — memorial slug used to namespace the storage path
//
// Returns: { url, path } (plus the full MediaItem when memorialId is present)
export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const bucket = String(form.get("bucket") || "memorial") as "memorial" | "shared-photos";
  const slug = String(form.get("slug") || "");
  // Legacy support: memorialId + caption still accepted for existing callers
  const memorialId = String(form.get("memorialId") || "");
  const caption = String(form.get("caption") || "") || undefined;

  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  // Resolve slug and memorialId for storage namespacing and DB insert.
  // memorialId is always looked up to (a) verify tenant ownership and
  // (b) derive slug when the caller doesn't supply one explicitly.
  let resolvedSlug = slug;
  let resolvedMemorialId = memorialId;

  if (!resolvedSlug && !resolvedMemorialId) {
    return NextResponse.json({ error: "Missing slug or memorialId" }, { status: 400 });
  }

  if (resolvedMemorialId) {
    const memorial = await getMemorialById(resolvedMemorialId);
    if (!memorial || memorial.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Derive slug from memorial when not explicitly provided
    if (!resolvedSlug) resolvedSlug = memorial.slug;

    // Enforce per-plan photo limits
    const current = await getMediaByMemorial(resolvedMemorialId);
    if (!canUploadMore(tenant.tier, current.length)) {
      return NextResponse.json(
        { error: "You've reached your plan's photo limit." },
        { status: 403 },
      );
    }
  }

  try {
    validateImageUpload(file);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid image." },
      { status: 400 },
    );
  }

  try {
    // uploadImage compresses with sharp, uploads to Supabase, and logs sizes.
    const { url, path } = await uploadImage(
      file,
      resolvedMemorialId || resolvedSlug,
      bucket,
    );

    // DB insert (gallery flow) — when memorialId is present we record the
    // MediaItem so GalleryManager's state update still works without a
    // separate call.
    if (resolvedMemorialId) {
      const item = await addMedia(resolvedMemorialId, url, caption);
      return NextResponse.json({ ...item, url, path }, { status: 201 });
    }

    return NextResponse.json({ url, path }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Image upload failed. Please try again." },
      { status: 502 },
    );
  }
}
