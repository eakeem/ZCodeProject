import type { Tier, TierConfig } from "./types";

// Single source of truth for pricing tiers. Mirrors the pricing
// shown on /pricing and the feature gates enforced in lib/gate.ts.
export const TIERS: Record<Tier, TierConfig> = {
  free: {
    id: "free",
    name: "Basic ",
    priceMonthly: 100,
    description: "A simple, dignified memorial to honour a loved one.",
    features: [
      "1 memorial page",
      "Up to 6 gallery photos",
      "Hero photo & biography",
      "Tributes & virtual candles",
      "subdomain",
    ],
    limits: {
      maxGalleryImages: 6,
      maxSharedPhotos: 80,
      allowsTributes: true,
      allowsCustomDomain: false,
      removesBranding: false,
      allowsLivestream: false,
    },
  },
  essential: {
    id: "essential",
    name: "Essential",
    priceMonthly: 150,
    description: "Everything you need for a fuller, richer remembrance.",
    features: [
      "Website online 7 days after funeral",
      "Up to 50 gallery photos",
      "Custom text sections",
      "20% more tribute",
      "20% more shared photos",
      " Live in two days",
    ],
    limits: {
      maxGalleryImages: 50,
      maxSharedPhotos: 150,
      allowsTributes: true,
      allowsCustomDomain: false,
      removesBranding: false,
      allowsLivestream: true,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceMonthly: 250,
    description: "The complete experience, with no limits and your own domain.",
    features: [
      "Everything in Essential",
      "70 gallery photos",
      "40% more tribute",
      "40% more shared photos",
      "Priority support",
      "Live in one day",
    ],
    limits: {
      maxGalleryImages: -1,
      maxSharedPhotos: 200,
      allowsTributes: true,
      allowsCustomDomain: true,
      removesBranding: true,
      allowsLivestream: true,
    },
  },
};

export const TIER_ORDER: Tier[] = ["free", "essential", "premium"];

export function getTier(tier: Tier): TierConfig {
  return TIERS[tier] ?? TIERS.free;
}
