-- =============================================================
-- 07_deals_and_revenue.sql
-- Deal tracking and active account conversion on first order.
-- Run after 06_samples_and_meetings.sql.
-- =============================================================

-- -------------------------------------------------------
-- Deals — one per salon, tracks negotiation → won/lost
-- -------------------------------------------------------
create table deals (
  id                  uuid primary key default gen_random_uuid(),
  salon_id            uuid not null references salons(id) on delete cascade,
  rep_id              uuid references reps(id),
  stage               funnel_stage not null default 'negotiation',
  proposed_value      numeric(14,2),
  final_order_value   numeric(14,2),
  currency            text default 'INR',
  won_at              timestamptz,
  lost_at             timestamptz,
  lost_reason         text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_deals_salon on deals(salon_id);
create index idx_deals_rep   on deals(rep_id);
create index idx_deals_stage on deals(stage);

-- -------------------------------------------------------
-- Active accounts — created automatically when deal = won
-- Trigger apply_deal_won() in 11_triggers_and_functions.sql
-- handles this; do NOT insert here manually.
-- -------------------------------------------------------
create table active_accounts (
  id                  uuid primary key default gen_random_uuid(),
  salon_id            uuid not null unique references salons(id) on delete cascade,
  deal_id             uuid references deals(id),
  first_order_value   numeric(14,2),
  first_order_date    date,
  account_manager_id  uuid references reps(id),
  created_at          timestamptz default now()
);

create index idx_active_accounts_salon on active_accounts(salon_id);
create index idx_active_accounts_rep   on active_accounts(account_manager_id);
