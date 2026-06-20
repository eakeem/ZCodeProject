import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import {
  getMemorialById,
  addMedia,
  deleteMedia,
  getMediaByMemorial,
} from "@/lib/repo";
import { canUploadMore } from "@/lib/gate";

// POST /api/admin/media — add an image by URL
export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { memorialId?: string; url?: string; caption?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const url = (body.url || "").trim();
  if (!body.memorialId || !url) {
    return NextResponse.json({ error: "memorialId and url required" }, { status: 400 });
  }
  if (!/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "Please provide a valid image URL." }, { status: 400 });
  }

  const memorial = await getMemorialById(body.memorialId);
  if (!memorial || memorial.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const current = await getMediaByMemorial(memorial.id);
  if (!canUploadMore(tenant.tier, current.length)) {
    return NextResponse.json({ error: "Photo limit reached for your plan." }, { status: 403 });
  }

  const item = await addMedia(memorial.id, url, body.caption);
  return NextResponse.json(item, { status: 201 });
}

// DELETE /api/admin/media?id=...
export async function DELETE(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteMedia(id);
  return NextResponse.json({ ok: true });
}
