-- =============================================================
-- 10_outreach_sequences.sql
-- Anti-duplicate guard for every outreach step. This is the
-- single source of truth — n8n workflows check this table
-- BEFORE sending any message. Run after 09_message_templates.sql.
-- =============================================================

create table outreach_sequences (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid not null references salons(id) on delete cascade,
  outreach_step     outreach_step not null,
  channel           channel_type not null,
  scheduled_date    date not null,
  status            message_status default 'pending',
  executed_at       timestamptz,
  n8n_execution_id  text,
  created_at        timestamptz default now(),

  -- THE anti-duplicate constraint:
  -- one pending/sent row per salon × step × channel, ever.
  unique(salon_id, outreach_step, channel)
);

-- Fast lookup for the daily scheduler: "give me everything due today"
create index idx_outreach_lookup        on outreach_sequences(scheduled_date, status);
create index idx_outreach_salon         on outreach_sequences(salon_id);
create index idx_outreach_status        on outreach_sequences(status);
create index idx_outreach_step_channel  on outreach_sequences(outreach_step, channel);

-- =============================================================
-- HOW n8n MUST USE THIS TABLE
-- =============================================================
-- STEP 1: Before sending, insert with ON CONFLICT DO NOTHING:
--
--   insert into outreach_sequences
--     (salon_id, outreach_step, channel, scheduled_date)
--   values ($1, $2, $3, $4)
--   on conflict (salon_id, outreach_step, channel) do nothing;
--
-- STEP 2: Check if the row is still 'pending' (owns the right to send):
--
--   select id from outreach_sequences
--   where salon_id = $1 and outreach_step = $2 and channel = $3
--     and status = 'pending';
--
-- STEP 3: If found, send the message.
-- STEP 4: Update status to 'sent' and set executed_at = now().
--
-- If STEP 2 returns nothing (conflict on insert → row already existed
-- and is 'sent'/'cancelled'/'skipped'), SKIP this outreach entirely.
-- =============================================================
