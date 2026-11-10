-- National AI Hackathon: team registration, payments, CMS and admin schema.
-- Idempotent. Run with: node scripts/migrate-hackathon.mjs
-- Access model: all tables have RLS enabled. Only the dedicated `aih_app` role
-- (used by the server through DATABASE_URL) can read/write them. `anon` and
-- `authenticated` have no policies, so the public API/PostgREST cannot touch them.

create extension if not exists pgcrypto;

-- ── CMS content (settings, tracks, prizes, schedule, faqs, policies) ─────────
create table if not exists public.hk_content (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

create table if not exists public.hk_announcements (
  id          bigserial primary key,
  title       text not null check (char_length(title) between 1 and 200),
  body        text not null check (char_length(body) <= 5000),
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  text
);

create table if not exists public.hk_admin_users (
  email       text primary key check (email = lower(email)),
  role        text not null default 'ADMIN' check (role in ('ADMIN', 'VIEWER')),
  created_at  timestamptz not null default now()
);

-- ── Teams & participants ─────────────────────────────────────────────────────
create sequence if not exists public.hk_team_seq;
create sequence if not exists public.hk_reg_seq;

create table if not exists public.hk_teams (
  id            uuid primary key default gen_random_uuid(),
  team_code     text unique,
  name          text not null check (char_length(name) between 2 and 80),
  mode          text not null default 'ONLINE' check (mode in ('ONLINE', 'PHYSICAL')),
  city          text not null default '',
  state         text not null default '',
  organisation  text,
  referral_code text,
  member_count  integer not null check (member_count between 1 and 15),
  status        text not null default 'PENDING_PAYMENT'
                check (status in ('PENDING_PAYMENT', 'CONFIRMED', 'EXPIRED', 'CANCELLED')),
  consent_at    timestamptz not null,
  terms_version text,
  emails_sent_at timestamptz,
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz,
  updated_at    timestamptz not null default now()
);

alter table public.hk_teams alter column mode set default 'ONLINE';
alter table public.hk_teams alter column city set default '';
alter table public.hk_teams alter column state set default '';

-- Only live teams reserve a team name.
create unique index if not exists hk_teams_name_live
  on public.hk_teams (lower(name)) where status in ('PENDING_PAYMENT', 'CONFIRMED');
create index if not exists hk_teams_status_idx on public.hk_teams (status, created_at);

create table if not exists public.hk_participants (
  id                uuid primary key default gen_random_uuid(),
  team_id           uuid not null references public.hk_teams(id) on delete cascade,
  registration_code text unique,
  is_leader         boolean not null default false,
  full_name         text not null check (char_length(full_name) between 2 and 90),
  email             text not null,
  email_norm        text not null,
  mobile            text not null,
  organisation      text,
  course            text,
  city              text,
  state             text,
  github            text,
  linkedin          text,
  skills            text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists hk_participants_one_leader
  on public.hk_participants (team_id) where is_leader;
-- A verified identity can only belong to one live registration.
create unique index if not exists hk_participants_email_live
  on public.hk_participants (email_norm) where active;
create unique index if not exists hk_participants_mobile_live
  on public.hk_participants (mobile) where active;
create index if not exists hk_participants_team_idx on public.hk_participants (team_id);

-- ── Payments (registration status and payment status are separate) ──────────
create table if not exists public.hk_payments (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references public.hk_teams(id) on delete restrict,
  txnid          text not null unique,
  member_count   integer not null check (member_count >= 1),
  fee_per_person integer not null check (fee_per_person > 0),
  subtotal_inr   integer not null check (subtotal_inr > 0),
  tax_inr        integer not null default 0 check (tax_inr >= 0),
  amount_inr     integer not null check (amount_inr > 0),
  status         text not null default 'INITIATED'
                 check (status in ('CREATED','INITIATED','PENDING','SUCCESS','FAILED',
                                   'CANCELLED','EXPIRED','REFUND_PENDING','REFUNDED')),
  environment    text not null check (environment in ('production', 'test', 'sandbox')),
  payu_mihpayid  text,
  failure_reason text,
  needs_review   boolean not null default false,
  verified_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists hk_payments_mihpayid_uniq
  on public.hk_payments (payu_mihpayid) where payu_mihpayid is not null;
-- At most one unresolved payment per team: prevents double charging.
create unique index if not exists hk_payments_one_open_per_team
  on public.hk_payments (team_id) where status in ('CREATED', 'INITIATED', 'PENDING');
-- At most one successful payment per team (a duplicate capture is parked as REFUND_PENDING).
drop index if exists public.hk_payments_one_success_per_team;
create unique index if not exists hk_payments_one_success_per_team
  on public.hk_payments (team_id) where status = 'SUCCESS';
create index if not exists hk_payments_status_idx on public.hk_payments (status, created_at);

create table if not exists public.hk_payment_events (
  id          bigserial primary key,
  txnid       text not null,
  event       text not null,
  status      text,
  source      text not null,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists hk_payment_events_txn_idx on public.hk_payment_events (txnid);

create table if not exists public.hk_refunds (
  id           bigserial primary key,
  payment_id   uuid not null references public.hk_payments(id),
  amount_inr   integer not null check (amount_inr > 0),
  reason       text not null,
  status       text not null default 'REQUESTED' check (status in ('REQUESTED', 'PROCESSED', 'REJECTED')),
  gateway_ref  text,
  recorded_by  text not null,
  created_at   timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.hk_change_requests (
  id            bigserial primary key,
  team_id       uuid not null references public.hk_teams(id) on delete cascade,
  requested_by  text not null,
  kind          text not null check (kind in ('REPLACE_MEMBER', 'UPDATE_TEAM', 'OTHER')),
  payload       jsonb not null default '{}'::jsonb,
  status        text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  admin_note    text,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  resolved_by   text
);

create table if not exists public.hk_audit_logs (
  id          bigserial primary key,
  actor       text not null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ── Row level security: deny by default, allow only the app role ────────────
do $$
declare t text;
begin
  foreach t in array array[
    'hk_content','hk_announcements','hk_admin_users','hk_teams','hk_participants',
    'hk_payments','hk_payment_events','hk_refunds','hk_change_requests','hk_audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;
