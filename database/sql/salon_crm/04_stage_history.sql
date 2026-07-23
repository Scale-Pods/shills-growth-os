-- =============================================================
-- 04_stage_history.sql
-- Append-only stage-transition log. Run after 03_salons.sql.
-- NEVER update this table — only insert. The funnel dashboard
-- computes time-in-stage and drop-off from this log.
-- =============================================================

create table salon_stage_history (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references salons(id) on delete cascade,
  from_stage  funnel_stage,                   -- NULL means first stage ever logged
  to_stage    funnel_stage not null,
  changed_by  text,                           -- 'system' or rep UUID/name
  reason      text,
  created_at  timestamptz default now()
);

create index idx_stage_history_salon      on salon_stage_history(salon_id);
create index idx_stage_history_created_at on salon_stage_history(created_at);
create index idx_stage_history_to_stage   on salon_stage_history(to_stage);
