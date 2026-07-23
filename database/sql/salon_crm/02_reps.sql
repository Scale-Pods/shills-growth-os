-- =============================================================
-- 02_reps.sql
-- Sales reps table. Run after 01_enums.sql.
-- =============================================================

create table reps (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  email             text unique,
  phone             text,
  region            text,
  is_active         boolean default true,
  assignment_weight int default 1,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index idx_reps_region on reps(region);
create index idx_reps_active on reps(is_active) where is_active = true;
