// ============================================================
// Feature gate — enforces tier limits. Centralised so the UI,
// API routes, and server components all consult the same rules.
// ============================================================

import type { Tier, TierConfig } from "./types";
import { getTier } from "./tiers";

export function tierAllows(
  tier: Tier,
  feature: keyof TierConfig["limits"],
): boolean {
  const limits = getTier(tier).limits;
  return Boolean(limits[feature]);
}

// returns remaining gallery uploads allowed for a tier, given the
// current count. -1 means unlimited.
export function remainingGallerySlots(tier: Tier, currentCount: number): number {
  const max = getTier(tier).limits.maxGalleryImages;
  if (max === -1) return -1;
  return Math.max(0, max - currentCount);
}

export function canUploadMore(tier: Tier, currentCount: number): boolean {
  const remaining = remainingGallerySlots(tier, currentCount);
  return remaining === -1 || remaining > 0;
}

// Shared photos always have a hard cap (never -1). Pass the count of
// non-rejected photos (approved + pending) — rejected ones free their slot.
export function remainingSharedSlots(tier: Tier, currentCount: number): number {
  const max = getTier(tier).limits.maxSharedPhotos;
  return Math.max(0, max - currentCount);
}

export function canUploadShared(tier: Tier, currentCount: number): boolean {
  return remainingSharedSlots(tier, currentCount) > 0;
}
