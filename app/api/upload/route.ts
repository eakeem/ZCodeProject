import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialById, addMedia, getMediaByMemorial } from "@/lib/repo";
import { canUploadMore } from "@/lib/gate";
import { buildUploadSignature } from "@/lib/cloudinary";

// POST /api/upload — multipart file upload. Uses Cloudinary when
// configured; otherwise returns an error explaining the local
// store can't persist binaries (development without Cloudinary).
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

  // --- Cloudinary path (production) ---
  const sig = await buildUploadSignature("memorial");
  if (sig) {
    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("api_key", sig.apiKey);
    cloudForm.append("timestamp", String(sig.timestamp));
    cloudForm.append("signature", sig.signature);
    cloudForm.append("folder", sig.folder);

    const uploadRes = await fetch(sig.uploadUrl, { method: "POST", body: cloudForm });
    if (!uploadRes.ok) {
      return NextResponse.json(
        { error: "Image upload failed. Please try again." },
        { status: 502 },
      );
    }
    const data = await uploadRes.json();
    const item = await addMedia(memorial.id, data.secure_url as string, caption);
    return NextResponse.json(item, { status: 201 });
  }

  // --- No Cloudinary configured ---
  // The local JSON store can't host binaries. Guide the user to set
  // Cloudinary env vars, OR use the "paste a URL" field instead.
  return NextResponse.json(
    {
      error:
        "Image uploads require Cloudinary. Set the Cloudinary env vars in .env.local, or add an image by URL on the gallery page.",
    },
    { status: 501 },
  );
}
