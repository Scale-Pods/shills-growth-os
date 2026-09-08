-- =============================================================
-- 21_pending_messages_debounce.sql
-- Buffers rapid-fire inbound WhatsApp messages so the AI agent
-- replies once to a burst of messages (e.g. "hi" then "how much
-- for haircut?" sent 2 seconds apart) instead of once per message.
--
-- Used by SSE-C | WhatsApp Inbound & CRM Journey:
--   1. On every inbound text message, insert a row here.
--   2. Wait ~10s.
--   3. Query rows for this salon created AFTER this row's created_at.
--      If any exist, a newer message arrived during the wait -> this
--      run exits without replying (the newer run will handle it).
--   4. If none exist, this run is the last one in the burst -> pull
--      ALL still-pending rows for this salon, combine their text,
--      reply once, then mark them all handled.
--
-- Run after 20_outreach_cadence_v2.sql.
-- =============================================================

create table pending_messages (
  id            uuid primary key default gen_random_uuid(),
  salon_id      uuid not null references salons(id) on delete cascade,
  message_text  text not null,
  whatsapp_message_id text,
  handled       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_pending_messages_salon_pending
  on pending_messages(salon_id, created_at)
  where handled = false;

comment on table pending_messages is
  'Short-lived buffer for debouncing rapid-fire inbound WhatsApp messages before the AI agent replies. Rows are marked handled=true (or deleted) once folded into a reply by SSE-C.';

grant select, insert, update, delete on pending_messages to anon, authenticated, service_role;

alter table pending_messages enable row level security;

create policy "service role full access" on pending_messages
  for all
  to anon, authenticated, service_role
  using (true)
  with check (true);
