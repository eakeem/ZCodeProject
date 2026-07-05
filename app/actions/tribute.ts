"use server";

import { revalidatePath } from "next/cache";
import { getMemorialById, getMemorialBySlug, createTribute } from "@/lib/repo";
import { checkRateLimit } from "@/lib/rate-limit";
import type { TributeType } from "@/lib/types";

export async function addTribute(formData: FormData) {
  // Honeypot — bots that fill hidden fields are silently rejected
  if (formData.get("_hp")) return { error: "Invalid submission." };

  const memorialId = String(formData.get("memorialId") || "").trim();
  const type = formData.get("type") as TributeType;
  const authorName = String(formData.get("authorName") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!memorialId || !type || !authorName || !message) {
    return { error: "All fields are required." };
  }
  if (type !== "message" && type !== "candle") {
    return { error: "Invalid tribute type." };
  }
  if (authorName.length > 80 || message.length > 1000) {
    return { error: "Your tribute is too long." };
  }

  const memorial =
    (await getMemorialById(memorialId)) ?? (await getMemorialBySlug(memorialId));
  if (!memorial || !memorial.published) {
    return { error: "Memorial not found." };
  }

  // Rate limit: 1 tribute per 60 s per IP per memorial
  const rl = await checkRateLimit(memorial.id, "tribute");
  if (rl) return rl;

  await createTribute({
    memorialId: memorial.id,
    type,
    authorName,
    message,
  });

  revalidatePath(`/m/${memorial.slug}`);
  revalidatePath(`/memorial/${memorial.slug}`);

  return { success: true };
}
