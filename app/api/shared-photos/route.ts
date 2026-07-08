// sharp (used inside lib/storage.ts) requires the Node.js runtime.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  getMemorialById,
  getMemorialBySlug,
  getTenantById,
  addSharedPhoto,
  getSharedPhotosByMemorial,
} from "@/lib/repo";
import { canUploadShared } from "@/lib/gate";
import { uploadImage, validateImageUpload } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/shared-photos — a visitor uploads a photo to a published
// memorial. The image goes to Supabase Storage (bucket "shared-photos")
// and a SharedPhoto row is created with status "pending" so the family
// can approve it before it appears publicly.
//
// Body (multipart): { memorialId | slug, authorName, caption?, file }
export async function POST(req: Request) {
  // Top-level catch: guarantees JSON is ALWAYS returned, even if formData()
  // throws (e.g. body too large at the infrastructure level).
  try {
    const form = await req.formData();
    const memorialIdOrSlug = String(form.get("memorialId") || form.get("slug") || "");
    const authorName = String(form.get("authorName") || "").trim();
    const caption = String(form.get("caption") || "").trim() || undefined;
    const file = form.get("file") as File | null;

    if (!memorialIdOrSlug) {
      return NextResponse.json({ error: "A memorial is required." }, { status: 400 });
    }
    if (!authorName || authorName.length > 80) {
      return NextResponse.json(
        { error: "Please add your name (up to 80 characters)." },
        { status: 400 },
      );
    }
    if (!file) {
      return NextResponse.json({ error: "Please choose an image to share." }, { status: 400 });
    }
    if (caption && caption.length > 200) {
      return NextResponse.json(
        { error: "Captions must be 200 characters or fewer." },
        { status: 400 },
      );
    }

    // resolve memorial by id or slug
    const memorial =
      (await getMemorialById(memorialIdOrSlug)) ??
      (await getMemorialBySlug(memorialIdOrSlug));
    if (!memorial || !memorial.published) {
      return NextResponse.json({ error: "Memorial not found." }, { status: 404 });
    }

    // tier cap — counts approved + pending (rejected ones free their slot)
    const tenant = await getTenantById(memorial.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Memorial not found." }, { status: 404 });
    }
    const all = await getSharedPhotosByMemorial(memorial.id);
    const nonRejected = all.filter((p) => p.status !== "rejected").length;
    if (!canUploadShared(tenant.tier, nonRejected)) {
      return NextResponse.json(
        { error: "This memorial has reached its shared-photo limit." },
        { status: 403 },
      );
    }

    // Rate limit: 1 photo per 60 s per IP per memorial
    const rl = await checkRateLimit(memorial.id, "photo");
    if (rl) return NextResponse.json(rl, { status: 429 });

    try {
      validateImageUpload(file);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid image." },
        { status: 400 },
      );
    }

    const { url } = await uploadImage(file, memorial.id, "shared-photos");
    const photo = await addSharedPhoto({
      memorialId: memorial.id,
      url,
      caption,
      authorName,
    });
    return NextResponse.json({ ...photo, status: "pending" }, { status: 201 });
  } catch (e) {
    console.error("[/api/shared-photos] Unhandled error:", e);
    return NextResponse.json(
      { error: "We couldn't upload your photo. Please try again in a moment." },
      { status: 500 },
    );
  }
}
