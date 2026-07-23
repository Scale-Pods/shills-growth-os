-- =============================================================
-- 03_salons.sql
-- Core salons/leads table. Run after 02_reps.sql.
-- =============================================================

create table salons (
  id                    uuid primary key default gen_random_uuid(),
  google_place_id       text unique,                              -- dedup key; NULL for non-maps leads
  salon_name            text not null,
  category              salon_category default 'unisex_salon',
  region                text not null,
  city                  text,
  address               text,
  latitude              numeric(10,6),
  longitude             numeric(10,6),
  phone                 text,
  whatsapp_number       text,
  email                 text,
  google_rating         numeric(3,2),
  google_reviews_count  int,
  lead_source           lead_source default 'google_maps',
  current_stage         funnel_stage not null default 'lead_generated',
  assigned_rep_id       uuid references reps(id),
  is_active             boolean default true,
  notes                 text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_salons_region        on salons(region);
create index idx_salons_stage         on salons(current_stage);
create index idx_salons_rep           on salons(assigned_rep_id);
create index idx_salons_active        on salons(is_active) where is_active = true;
create index idx_salons_whatsapp      on salons(whatsapp_number) where whatsapp_number is not null;
create index idx_salons_email         on salons(email) where email is not null;
create index idx_salons_place_id      on salons(google_place_id) where google_place_id is not null;

-- Computed column helper: days since the salon was first discovered.
-- Used by the outreach scheduler to calculate which cadence step is due.
create or replace function days_since_discovery(s salons)
returns int as $$
  select (current_date - s.created_at::date)::int;
$$ language sql stable;
