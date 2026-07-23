-- =============================================================
-- 06_samples_and_meetings.sql
-- Product sample dispatch tracking + meeting/demo scheduling.
-- Run after 05_message_logs.sql.
-- =============================================================

-- -------------------------------------------------------
-- Samples
-- -------------------------------------------------------
create table samples (
  id               uuid primary key default gen_random_uuid(),
  salon_id         uuid not null references salons(id) on delete cascade,
  product_name     text,
  quantity         int default 1,
  status           sample_status default 'requested',
  courier_name     text,
  tracking_number  text,
  dispatched_at    timestamptz,
  delivered_at     timestamptz,
  feedback_notes   text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index idx_samples_salon  on samples(salon_id);
create index idx_samples_status on samples(status);

-- -------------------------------------------------------
-- Meetings / Demos
-- -------------------------------------------------------
create table meetings (
  id              uuid primary key default gen_random_uuid(),
  salon_id        uuid not null references salons(id) on delete cascade,
  rep_id          uuid references reps(id),
  meeting_type    meeting_type default 'video',
  scheduled_at    timestamptz not null,
  status          meeting_status default 'scheduled',
  meeting_link    text,
  location        text,
  reminder_sent   boolean default false,
  outcome_notes   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_meetings_salon        on meetings(salon_id);
create index idx_meetings_rep          on meetings(rep_id);
create index idx_meetings_scheduled_at on meetings(scheduled_at);
create index idx_meetings_status       on meetings(status);
