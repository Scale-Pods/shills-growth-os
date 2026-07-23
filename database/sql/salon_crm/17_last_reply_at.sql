-- =============================================================
-- 17_last_reply_at.sql
-- Tracks the timestamp of the salon's most recent inbound WhatsApp
-- reply, used by SSE-B to gate day 3/7/14 sends. Run after
-- 16_conversation_transcript.sql.
-- =============================================================

alter table salons
  add column if not exists last_reply_at timestamptz;

comment on column salons.last_reply_at is
  'Timestamp of the most recent inbound WhatsApp message from this salon. Set by SSE-C on every inbound message. SSE-B skips day_3/day_7/day_14 sends when this is not null, since the salon is already in an active conversation.';

create index if not exists idx_salons_last_reply_at
  on salons(last_reply_at) where last_reply_at is not null;
