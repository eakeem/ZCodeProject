-- ============================================================
-- Memorial App — Supabase / PostgreSQL schema
-- ============================================================
-- Run in the Supabase SQL editor. Multi-tenant: every row is
-- scoped to a tenant_id and protected by Row Level Security.
-- When ready, point the app at Supabase by setting env vars and
-- switching lib/repo.ts to delegate to lib/supabase-store.ts.
-- ============================================================

-- Enumerations
create type tier as enum ('free', 'essential', 'premium');
create type tribute_status as enum ('pending', 'approved', 'rejected');
create type tribute_type as enum ('message', 'candle');

-- Tenants (one per customer/family). `auth_id` links to auth.users
-- when using Supabase Auth.
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text not null,
  tier        tier not null default 'free',
  auth_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index tenants_auth_id_idx on tenants(auth_id);

-- Memorial pages (a tenant may have several on premium).
create table memorials (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
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

create index memorials_tenant_idx on memorials(tenant_id);

-- Gallery images
create table media (
  id          uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  url         text not null,
  caption     text,
  created_at  timestamptz not null default now()
);

create index media_memorial_idx on media(memorial_id);

-- Tributes (messages + virtual candles) — held for moderation
create table tributes (
  id          uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  type        tribute_type not null,
  author_name text not null,
  message     text not null,
  image_url   text,
  status      tribute_status not null default 'pending',
  created_at  timestamptz not null default now()
);

create index tributes_memorial_idx on tributes(memorial_id);
create index tributes_status_idx on tributes(status);

-- ============================================================
-- Row Level Security
-- ============================================================
-- Public visitors may READ approved tributes & published memorials.
-- Tenants have full control over their own rows (matched via the
-- tenant whose auth_id = auth.uid()).

alter table tenants     enable row level security;
alter table memorials   enable row level security;
alter table media       enable row level security;
alter table tributes    enable row level security;

-- helper: current tenant id from the logged-in user
create or replace function current_tenant_id()
returns uuid language sql stable security definer as $$
  select id from tenants where auth_id = auth.uid() limit 1
$$;

-- Tenants: a user can read/update only their own tenant row
create policy tenants_self_select on tenants
  for select using (auth_id = auth.uid());
create policy tenants_self_update on tenants
  for update using (auth_id = auth.uid());

-- Memorials: public read if published; owner full control
create policy memorials_public_read on memorials
  for select using (published = true);
create policy memorials_owner_all on memorials
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- Media: public read for published memorials; owner full control
create policy media_public_read on media
  for select using (
    exists (select 1 from memorials m
            where m.id = media.memorial_id and m.published = true)
  );
create policy media_owner_all on media
  for all using (
    exists (select 1 from memorials m
            where m.id = media.memorial_id and m.tenant_id = current_tenant_id())
  );

-- Tributes: anyone may create; public reads only approved; owner moderates
create policy tributes_public_insert on tributes
  for insert with check (status = 'pending');
create policy tributes_public_read on tributes
  for select using (
    status = 'approved' or exists (
      select 1 from memorials m
      where m.id = tributes.memorial_id and m.tenant_id = current_tenant_id()
    )
  );
create policy tributes_owner_update on tributes
  for update using (
    exists (select 1 from memorials m
      where m.id = tributes.memorial_id and m.tenant_id = current_tenant_id())
  );
create policy tributes_owner_delete on tributes
  for delete using (
    exists (select 1 from memorials m
      where m.id = tributes.memorial_id and m.tenant_id = current_tenant_id())
  );

-- updated_at trigger
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger memorials_touch before update on memorials
  for each row execute function touch_updated_at();
