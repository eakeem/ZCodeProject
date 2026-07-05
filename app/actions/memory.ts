"use server";

import { revalidatePath } from "next/cache";
import {
  getMemorialById,
  getMemorialBySlug,
  getTenantById,
  addSharedPhoto,
  getSharedPhotosByMemorial,
} from "@/lib/repo";
import { canUploadShared } from "@/lib/gate";
import { uploadImage, validateImageUpload } from "@/lib/storage";
import { checkPhotoRateLimit } from "@/lib/rate-limit";

export async function uploadPhoto(formData: FormData) {
  // Honeypot — bots that fill hidden fields are silently rejected
  if (formData.get("_hp")) return { error: "Invalid submission." };

  const memorialIdOrSlug = String(formData.get("memorialId") || "").trim();
  const authorName = String(formData.get("authorName") || "").trim();
  const caption = String(formData.get("caption") || "").trim() || undefined;
  const file = formData.get("file") as File | null;

  if (!memorialIdOrSlug) return { error: "A memorial is required." };
  if (!authorName || authorName.length > 80) {
    return { error: "Please add your name (up to 80 characters)." };
  }
  if (!file) return { error: "Please choose an image to share." };
  if (caption && caption.length > 200) {
    return { error: "Captions must be 200 characters or fewer." };
  }

  const memorial =
    (await getMemorialById(memorialIdOrSlug)) ??
    (await getMemorialBySlug(memorialIdOrSlug));
  if (!memorial || !memorial.published) return { error: "Memorial not found." };

  const tenant = await getTenantById(memorial.tenantId);
  if (!tenant) return { error: "Memorial not found." };

  const all = await getSharedPhotosByMemorial(memorial.id);
  const nonRejected = all.filter((p) => p.status !== "rejected").length;
  if (!canUploadShared(tenant.tier, nonRejected)) {
    return { error: "This memorial has reached its shared-photo limit." };
  }

  // Rate limit: 1 photo per 60 s per IP per memorial
  const rl = await checkPhotoRateLimit(memorial.id);
  if (!rl.success) return { error: rl.error };

  try {
    validateImageUpload(file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid image." };
  }

  try {
    const { url } = await uploadImage(file, memorial.id, "shared-photos");
    await addSharedPhoto({
      memorialId: memorial.id,
      url,
      caption,
      authorName,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Upload failed. Please try again.",
    };
  }

  revalidatePath(`/m/${memorial.slug}`);
  revalidatePath(`/memorial/${memorial.slug}`);

  return { success: true };
}
