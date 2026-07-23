-- =============================================================
-- 08_activity_log.sql
-- Unified activity log — every action across all channels
-- is written here. Run after 07_deals_and_revenue.sql.
-- =============================================================

create table sales_activities (
  id             uuid primary key default gen_random_uuid(),
  salon_id       uuid references salons(id) on delete cascade,
  rep_id         uuid references reps(id),
  channel        channel_type not null,
  activity_type  text not null,   -- e.g. 'lead_discovered', 'stage_change',
                                  --      'whatsapp_sent', 'email_received',
                                  --      'sample_dispatched', 'meeting_booked',
                                  --      'founder_ai_query'
  description    text,
  metadata       jsonb,
  created_at     timestamptz default now()
);

create index idx_activity_salon        on sales_activities(salon_id);
create index idx_activity_rep          on sales_activities(rep_id);
create index idx_activity_type         on sales_activities(activity_type);
create index idx_activity_channel      on sales_activities(channel);
create index idx_activity_created_at   on sales_activities(created_at);
