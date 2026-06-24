// ============================================================
// Shared domain types — used by both the local store and the
// Supabase adapter. Keep these in sync with the SQL schema in
// `supabase/schema.sql`.
// ============================================================

export type Tier = "free" | "essential" | "premium";

export interface TierConfig {
  id: Tier;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  limits: {
    maxGalleryImages: number; // -1 = unlimited
    maxSharedPhotos: number; // cap on visitor-shared photos (hard cap, never -1)
    allowsTributes: boolean;
    allowsCustomDomain: boolean;
    removesBranding: boolean;
    allowsLivestream: boolean;
  };
}

export interface Tenant {
  id: string; // uuid
  email: string;
  name: string; // contact name
  createdAt: string;
  tier: Tier;
  // Local auth only (Supabase Auth handles this in prod; never stored here in prod)
  passwordHash?: string;
}

export interface Memorial {
  id: string;
  tenantId: string;
  slug: string; // url segment, e.g. "mary-johnson"
  deceasedName: string;
  birthDate?: string;
  passingDate?: string;
  tagline?: string;
  heroImage?: string; // url
  portraitImage?: string; // url
  bio?: string; // custom text — life story
  customSections: CustomSection[]; // admin-editable text blocks
  serviceInfo?: ServiceInfo;
  livestreamUrl?: string;
  theme: "ivory" | "midnight" | "forest";
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomSection {
  id: string;
  title: string;
  body: string;
}

export interface ServiceInfo {
  date?: string;
  time?: string;
  location?: string;
  notes?: string;
}

export interface MediaItem {
  id: string;
  memorialId: string;
  url: string;
  caption?: string;
  createdAt: string;
}

export type TributeType = "message" | "candle";
export type TributeStatus = "pending" | "approved" | "rejected";

export interface Tribute {
  id: string;
  memorialId: string;
  type: TributeType;
  authorName: string;
  message: string;
  imageUrl?: string;
  status: TributeStatus;
  createdAt: string;
}

// ------------------------------------------------------------
// Shared photos — visitor-submitted images held for family
// moderation before appearing on the public memorial. Mirrors
// the tribute approval flow.
// ------------------------------------------------------------
export type SharedPhotoStatus = "pending" | "approved" | "rejected";

export interface SharedPhoto {
  id: string;
  memorialId: string;
  url: string; // Supabase Storage public URL
  caption?: string;
  authorName: string; // visitor who submitted the photo
  status: SharedPhotoStatus;
  createdAt: string;
}

export interface Database {
  tenants: Tenant[];
  memorials: Memorial[];
  media: MediaItem[];
  sharedPhotos: SharedPhoto[];
  tributes: Tribute[];
  // session token -> tenantId (local dev only)
  sessions: Record<string, string>;
}
