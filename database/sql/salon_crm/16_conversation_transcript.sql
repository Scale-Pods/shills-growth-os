-- =============================================================
-- 16_conversation_transcript.sql
-- Full running WhatsApp conversation thread per salon, separate
-- from the per-message rows in whatsapp_logs. Run after 15_n8n_helper_functions.sql.
-- =============================================================

alter table salons
  add column if not exists conversation_transcript jsonb not null default '[]'::jsonb;

-- Each element: { "direction": "inbound"|"outbound", "message": text, "at": timestamptz }
comment on column salons.conversation_transcript is
  'Full running WhatsApp conversation thread for this salon, appended to on every inbound/outbound message. Array of {direction, message, at}.';

create index if not exists idx_salons_conversation_transcript
  on salons using gin (conversation_transcript);
