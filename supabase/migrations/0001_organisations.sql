-- 0001_organisations.sql
-- Organisation / site membership and role foundation.

create type public.user_role as enum ('staff', 'supervisor', 'manager', 'administrator');

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisation_members (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null,
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisation_members_unique unique (organisation_id, user_id)
);

create table public.site_members (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null,
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_members_unique unique (site_id, user_id)
);

alter table public.organisations enable row level security;
alter table public.sites enable row level security;
alter table public.organisation_members enable row level security;
alter table public.site_members enable row level security;