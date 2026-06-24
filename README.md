# 🕯️ Memorial

A responsive, multi-tenant **memorial / funeral web application**. Families create a beautiful memorial page, gather tributes and virtual candles (moderated before going public), manage a photo gallery, accept visitor-submitted "shared photos" (also moderated), and upgrade via tiered plans.

It **runs immediately with zero configuration** using a local data store and demo login, and ships **production-ready integration code for Supabase and Stripe** — add env vars to go fully live and scale to many customers.

---

## ✨ Features

- **Public memorial page** — hero, portrait, biography, custom text sections, service info, photo gallery with lightbox
- **Tribute section** — visitors leave warm messages and **light a virtual candle**; everything is held for moderation
- **Shared photos** — visitors can **upload a photo**; the family approves it from the dashboard before it appears in a "Shared photos" gallery (capped per tier)
- **Admin dashboard** (auth-protected) — edit all page content, upload images, moderate tributes **and** shared photos
- **Multi-tenant** — every record is scoped to a `tenantId`; many customers can host memorials on one deployment
- **Tiered payments** — Free / Essential / Premium with feature gating (photo limits, livestream, custom domain, branding)
- **Fully responsive** — mobile, tablet, desktop
- **Scalable** — stateless serverless architecture; swap the local store for Supabase to scale horizontally

---

## 🚀 Quick start (works with no config)

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

### Demo credentials
- **Admin login:** `admin@memorial.demo`
- **Password:** `demo1234`
- **Demo memorial:** http://localhost:3000/m/mary-johnson

On first run the app seeds a complete demo memorial (photos, approved + pending tributes, lit candles). The local database is stored in `data/db.json` (gitignored).

---

## 🧭 App map

| Route | Purpose |
|---|---|
| `/` | Marketing homepage |
| `/m/[slug]` | Public memorial page (visitors) |
| `/pricing` | Tiered pricing |
| `/login`, `/signup` | Authentication |
| `/admin` | Dashboard overview |
| `/admin/memorial` | Edit memorial content + custom text sections + service info |
| `/admin/gallery` | Upload / manage photos |
| `/admin/shared-photos` | Moderate visitor-submitted photos |
| `/admin/tributes` | Moderate messages & candles |
| `/admin/billing` | Manage plan tier |

API routes: `POST /api/tributes`, `POST /api/shared-photos`,
`POST /api/auth/{login,signup,logout}`,
`PATCH/POST /api/admin/memorial/:id`, `POST/DELETE /api/admin/media`,
`PATCH /api/admin/tributes/:id`, `PATCH /api/admin/shared-photos/:id`,
`POST /api/upload`, `POST /api/stripe/{checkout,webhook}`.

---

## 🔌 Going live (integrations)

Each integration is **optional and isolated**. The app degrades gracefully when one isn't configured. Copy `.env.example` → `.env.local` and fill in what you need.

### 1. Supabase (database + auth) — *for real multi-tenant scale*

The local JSON store is perfect for development. For production with many customers, switch to Supabase:

1. Create a Supabase project.
2. Run **`supabase/schema.sql`** in the SQL editor (creates all tables + Row Level Security policies).
3. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Install the client: `npm i @supabase/supabase-js`.
5. Implement the adapter in `lib/supabase-store.ts` (the contract is documented at the top of the file), then in **`lib/repo.ts`** re-export from it:
   ```ts
   export * from "./supabase-store";
   ```

Because every part of the app talks only to `lib/repo.ts`, the swap touches one file. RLS enforces tenant isolation at the database level (public visitors read only published memorials & approved tributes/shared photos; owners control their own rows).

### 2. Supabase Storage (image uploads) — *required for photo uploads*

Both family gallery uploads and visitor-submitted "shared photos" are stored in Supabase Storage (no Cloudinary). Without the Supabase env vars, image **file** uploads are disabled; you can still add photos **by URL** for testing.

1. In your Supabase project, create two **PUBLIC** Storage buckets:
   - `memorial` — family gallery uploads (admin dashboard)
   - `shared-photos` — visitor-submitted photos (held for moderation)
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (the storage helpers in **`lib/storage.ts`** read these).
3. Done — `/api/upload` (family) and `/api/shared-photos` (visitors) stream files to Storage and record the public URL.

Visitor uploads are MIME-validated (`jpg/png/webp/gif/avif`) and capped at **5 MB**. Per-tier **shared-photo** limits are defined in `lib/tiers.ts` (Free 80 / Essential 150 / Premium 200) and enforced in `lib/gate.ts`.

### 3. Stripe (tiered payments) — *optional, falls back to demo mode*

Without Stripe keys, the billing page runs in **demo mode**: upgrades apply instantly so you can test the whole flow.

1. Create a Stripe account and three recurring **Prices** (Free / Essential / Premium).
2. Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and the three `STRIPE_PRICE_*` IDs.
3. Add a webhook endpoint pointing to `/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`.
4. `/api/stripe/checkout` creates Checkout Sessions; the webhook upgrades the tenant's tier on success.

Tiers and their limits are defined once in **`lib/tiers.ts`** and enforced everywhere via **`lib/gate.ts`**.

---

## 🏗️ Architecture

```
lib/
  types.ts            # shared domain models (mirror supabase/schema.sql)
  tiers.ts            # pricing tiers — single source of truth
  gate.ts             # feature gating by tier
  store.ts            # local JSON store (development)
  repo.ts             # repository — THE data API the whole app uses
  supabase-store.ts   # Supabase adapter (same contract as repo.ts)
  storage.ts          # Supabase Storage uploads/deletes (server-only)
  auth.ts             # signup/login/sessions (Supabase Auth ready)
  stripe.ts           # checkout + webhook helpers
  data/seed.ts        # demo memorial seed data
components/
  SiteHeader/Footer   # marketing chrome
  Candle.tsx          # animated virtual candle
  memorial/           # Hero, Gallery, LifeStory, ServiceInfo, TributeSection
  admin/              # AdminShell, MemorialEditor, GalleryManager, TributeModeration, BillingPanel
app/
  page.tsx            # homepage
  m/[slug]/           # public memorial
  login|signup/       # auth
  admin/              # protected dashboard
  api/                # server routes
```

The key design choice: **`lib/repo.ts` is the only data access layer**. Components never touch the store directly, which keeps the Supabase swap trivial.

---

## 🛠️ Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

---

## 📦 Tech

- **Next.js 14** (App Router) + **React 18**
- **TypeScript**, **Tailwind CSS**
- **Supabase** (Postgres + Auth + Storage) — optional
- **Stripe** — payments — optional

---

## 📝 Notes & next steps

- The local store serializes writes through a promise chain — fine for dev/single-server. Move to Supabase for real concurrency.
- Password hashing uses sha-256 only in the local dev fallback; Supabase Auth (bcrypt) takes over in production.
- Suggested future work: email notifications to admins on new tribute, per-memorial custom subdomains, visitor analytics on Premium, multilingual support.

Made with care.
