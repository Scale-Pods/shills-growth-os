-- =============================================================
-- 05_message_logs.sql
-- WhatsApp and Email message logs with intent classification.
-- Run after 04_stage_history.sql.
-- =============================================================

-- -------------------------------------------------------
-- WhatsApp messages (inbound + outbound)
-- -------------------------------------------------------
create table whatsapp_logs (
  id                   uuid primary key default gen_random_uuid(),
  salon_id             uuid references salons(id) on delete set null,
  direction            text check (direction in ('outbound','inbound')) not null,
  outreach_step        outreach_step,
  message_body         text,
  template_name        text,
  whatsapp_message_id  text,                        -- Meta Cloud API message ID
  status               message_status default 'pending',
  interest             interest_label,
  intent               intent_label,
  interest_score       numeric(5,2),                -- 0.00 – 1.00 confidence
  reply_summary        text,                        -- AI one-sentence summary
  raw_payload          jsonb,                       -- full webhook/API payload
  created_at           timestamptz default now()
);

create index idx_whatsapp_salon      on whatsapp_logs(salon_id);
create index idx_whatsapp_direction  on whatsapp_logs(direction);
create index idx_whatsapp_status     on whatsapp_logs(status);
create index idx_whatsapp_created_at on whatsapp_logs(created_at);

-- -------------------------------------------------------
-- Email messages (inbound + outbound via Instantly)
-- -------------------------------------------------------
create table email_logs (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid references salons(id) on delete set null,
  direction         text check (direction in ('outbound','inbound')) not null,
  outreach_step     outreach_step,
  subject           text,
  body              text,
  email_message_id  text,                           -- SMTP Message-ID / provider ID
  status            message_status default 'pending',
  interest          interest_label,
  intent            intent_label,
  interest_score    numeric(5,2),
  reply_summary     text,
  raw_payload       jsonb,
  created_at        timestamptz default now()
);

create index idx_email_salon      on email_logs(salon_id);
create index idx_email_direction  on email_logs(direction);
create index idx_email_status     on email_logs(status);
create index idx_email_created_at on email_logs(created_at);
