-- ============================================================
-- Memorial App — Supabase / PostgreSQL schema (FULL FIX)
-- ============================================================

-- ------------------------------------------------------------
-- Enumerations (safe to re-run)
-- ------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tier') THEN
    CREATE TYPE tier AS enum ('free', 'essential', 'premium');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tribute_status') THEN
    CREATE TYPE tribute_status AS enum ('pending', 'approved', 'rejected');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tribute_type') THEN
    CREATE TYPE tribute_type AS enum ('message', 'candle','condolence');
  END IF;
END $$;

-- ------------------------------------------------------------
-- Tenants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text not null,
  tier        tier not null default 'free',
  password_hash text,
  created_at  timestamptz not null default now()
);

-- Add auth_id column if missing (migration for existing tables)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN auth_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add password_hash column if missing (migration for existing tables)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN password_hash text;
  END IF;
END $$;

-- Now create indexes (after columns are guaranteed to exist)
CREATE INDEX IF NOT EXISTS tenants_auth_id_idx ON public.tenants(auth_id);

-- ------------------------------------------------------------
-- Memorials
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memorials (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  slug            text not null unique,
  deceased_name   text not null,
  birth_date      date,
  passing_date    date,
  tagline         text,
  hero_image      text,
  portrait_image  text,
  bio             text,
  custom_sections jsonb not null default '[]'::jsonb,
  service_info    jsonb,
  livestream_url  text,
  theme           text not null default 'ivory',
  published       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS memorials_tenant_idx ON public.memorials(tenant_id);
CREATE INDEX IF NOT EXISTS memorials_published_idx ON public.memorials(published);
CREATE INDEX IF NOT EXISTS memorials_tenant_published_idx ON public.memorials(tenant_id, published);

-- ------------------------------------------------------------
-- Media
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media (
  id          uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials(id) on delete cascade,
  url         text not null,
  caption     text,
  created_at  timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS media_memorial_idx ON public.media(memorial_id);

-- ------------------------------------------------------------
-- Tributes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tributes (
  id           uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials(id) on delete cascade,
  type         tribute_type not null,
  author_name  text not null,
  message      text not null,
  image_url    text,
  status       tribute_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  user_id      uuid references auth.users(id) on delete set null
);

CREATE INDEX IF NOT EXISTS tributes_memorial_idx ON public.tributes(memorial_id);
CREATE INDEX IF NOT EXISTS tributes_status_idx ON public.tributes(status);
CREATE INDEX IF NOT EXISTS tributes_status_memorial_idx ON public.tributes(status, memorial_id);

-- ---- Patch existing tributes table (fixes your error) ----
-- Add missing user_id if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tributes'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.tributes
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add missing updated_at if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tributes'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.tributes
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- ------------------------------------------------------------
-- Shared Photos (Visitor-submitted images)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_photos (
  id          uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials(id) on delete cascade,
  url         text not null,
  caption     text,
  author_name text not null,
  status      text not null default 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS shared_photos_memorial_idx ON public.shared_photos(memorial_id);
CREATE INDEX IF NOT EXISTS shared_photos_status_idx ON public.shared_photos(status);

-- Add missing updated_at if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shared_photos'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.shared_photos
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Add updated_at trigger for shared_photos
DROP TRIGGER IF EXISTS shared_photos_touch ON public.shared_photos;
CREATE TRIGGER shared_photos_touch
  BEFORE UPDATE ON public.shared_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE public.tenants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tributes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_photos ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Helper: current tenant id from the logged-in user
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id
  FROM public.tenants
  WHERE auth_id = auth.uid()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_tenant_id() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;

-- ------------------------------------------------------------
-- tenants policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS tenants_self_select ON public.tenants;
CREATE POLICY tenants_self_select
  ON public.tenants
  FOR SELECT
  USING (auth_id = auth.uid());

DROP POLICY IF EXISTS tenants_self_update ON public.tenants;
CREATE POLICY tenants_self_update
  ON public.tenants
  FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- ------------------------------------------------------------
-- memorials policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS memorials_public_read ON public.memorials;
CREATE POLICY memorials_public_read
  ON public.memorials
  FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS memorials_owner_all ON public.memorials;
CREATE POLICY memorials_owner_all
  ON public.memorials
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- ------------------------------------------------------------
-- media policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS media_public_read ON public.media;
CREATE POLICY media_public_read
  ON public.media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.media.memorial_id
        AND m.published = true
    )
  );

DROP POLICY IF EXISTS media_owner_all ON public.media;
CREATE POLICY media_owner_all
  ON public.media
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.media.memorial_id
        AND m.tenant_id = public.current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.media.memorial_id
        AND m.tenant_id = public.current_tenant_id()
    )
  );

-- ------------------------------------------------------------
-- tributes policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS tributes_public_insert ON public.tributes;
CREATE POLICY tributes_public_insert
  ON public.tributes
  FOR INSERT
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS tributes_public_read ON public.tributes;
CREATE POLICY tributes_public_read
  ON public.tributes
  FOR SELECT
  USING (
    status = 'approved'
    OR EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.tributes.memorial_id
        AND m.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS tributes_owner_update ON public.tributes;
CREATE POLICY tributes_owner_update
  ON public.tributes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.tributes.memorial_id
        AND m.tenant_id = public.current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.tributes.memorial_id
        AND m.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS tributes_owner_delete ON public.tributes;
CREATE POLICY tributes_owner_delete
  ON public.tributes
  FOR DELETE
  USING (
    public.tributes.user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.tributes.memorial_id
        AND m.tenant_id = public.current_tenant_id()
    )
  );

-- ------------------------------------------------------------
-- shared_photos policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS shared_photos_public_insert ON public.shared_photos;
CREATE POLICY shared_photos_public_insert
  ON public.shared_photos
  FOR INSERT
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS shared_photos_public_read ON public.shared_photos;
CREATE POLICY shared_photos_public_read
  ON public.shared_photos
  FOR SELECT
  USING (
    status = 'approved'
    OR EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.shared_photos.memorial_id
        AND m.published = true
    )
  );

DROP POLICY IF EXISTS shared_photos_owner_all ON public.shared_photos;
CREATE POLICY shared_photos_owner_all
  ON public.shared_photos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.shared_photos.memorial_id
        AND m.tenant_id = public.current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.memorials m
      WHERE m.id = public.shared_photos.memorial_id
        AND m.tenant_id = public.current_tenant_id()
    )
  );

-- ------------------------------------------------------------
-- updated_at trigger helper + triggers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tributes_touch ON public.tributes;
CREATE TRIGGER tributes_touch
  BEFORE UPDATE ON public.tributes
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS memorials_touch ON public.memorials;
CREATE TRIGGER memorials_touch
  BEFORE UPDATE ON public.memorials
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();