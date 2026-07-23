-- =============================================================
-- 09_message_templates.sql
-- Reusable message templates for outreach sequences.
-- Content is seeded in 14_seed_templates.sql.
-- Run after 08_activity_log.sql.
-- =============================================================

create table message_templates (
  id             uuid primary key default gen_random_uuid(),
  channel        channel_type not null,
  outreach_step  outreach_step not null,
  tone           text,               -- e.g. 'warm', 'light', 'value', 'closing'
  subject        text,               -- email subject (NULL for WhatsApp)
  body_template  text not null,      -- use {{salon_name}}, {{city}}, {{rep_name}},
                                     -- {{sample_link}}, {{calendar_link}} as placeholders
  variables      text[],             -- list of variable names used, for reference
  is_active      boolean default true,
  created_at     timestamptz default now()
);

create index idx_templates_channel on message_templates(channel);
create index idx_templates_step    on message_templates(outreach_step);

-- Unique active template per channel + step (one active at a time).
create unique index idx_templates_active_step_channel
  on message_templates(channel, outreach_step)
  where is_active = true;
