import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialById, addMedia, getMediaByMemorial } from "@/lib/repo";
import { canUploadMore } from "@/lib/gate";
import { uploadImage, validateImageUpload } from "@/lib/storage";

// POST /api/upload — multipart file upload from the family admin
// gallery. Uploaded to Supabase Storage (bucket "memorial"), then the
// public URL is recorded as a MediaItem via the repo layer.
export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const memorialId = String(form.get("memorialId") || "");
  const caption = String(form.get("caption") || "") || undefined;
  if (!file || !memorialId) {
    return NextResponse.json({ error: "Missing file or memorialId" }, { status: 400 });
  }

  const memorial = await getMemorialById(memorialId);
  if (!memorial || memorial.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const current = await getMediaByMemorial(memorial.id);
  if (!canUploadMore(tenant.tier, current.length)) {
    return NextResponse.json(
      { error: "You've reached your plan's photo limit." },
      { status: 403 },
    );
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
    const { url } = await uploadImage(file, memorial.id, "memorial");
    const item = await addMedia(memorial.id, url, caption);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Image upload failed. Please try again." },
      { status: 502 },
    );
  }
}
