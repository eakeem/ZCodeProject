import type { Tier, TierConfig } from "./types";

// Single source of truth for pricing tiers. Mirrors the pricing
// shown on /pricing and the feature gates enforced in lib/gate.ts.
export const TIERS: Record<Tier, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    description: "A simple, dignified memorial to honour a loved one.",
    features: [
      "1 memorial page",
      "Up to 6 gallery photos",
      "Hero photo & biography",
      "Tributes & virtual candles",
      "memorial.app subdomain",
    ],
    limits: {
      maxGalleryImages: 6,
      allowsTributes: true,
      allowsCustomDomain: false,
      removesBranding: false,
      allowsLivestream: false,
    },
  },
  essential: {
    id: "essential",
    name: "Essential",
    priceMonthly: 19,
    description: "Everything you need for a fuller, richer remembrance.",
    features: [
      "Everything in Free",
      "Up to 50 gallery photos",
      "Custom text sections",
      "Service & livestream info",
      "Memorial never expires",
      "Email notifications for new tributes",
    ],
    limits: {
      maxGalleryImages: 50,
      allowsTributes: true,
      allowsCustomDomain: false,
      removesBranding: false,
      allowsLivestream: true,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceMonthly: 49,
    description: "The complete experience, with no limits and your own domain.",
    features: [
      "Everything in Essential",
      "Unlimited gallery photos",
      "Custom domain support",
      "No Memorial branding",
      "Priority support",
      "Visitor analytics",
    ],
    limits: {
      maxGalleryImages: -1,
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
