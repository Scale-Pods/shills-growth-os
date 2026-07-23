-- =============================================================
-- 18_conversation_transcript_email.sql
-- Full running email conversation thread per salon, mirroring
-- salons.conversation_transcript (WhatsApp) for the email channel.
-- Run after 17_last_reply_at.sql.
-- =============================================================

alter table salons
  add column if not exists conversation_transcript_email jsonb not null default '[]'::jsonb;

-- Each element: { "direction": "inbound"|"outbound", "message": text, "at": timestamptz }
comment on column salons.conversation_transcript_email is
  'Full running email conversation thread for this salon, appended to on every inbound/outbound email. Array of {direction, message, at}.';

create index if not exists idx_salons_conversation_transcript_email
  on salons using gin (conversation_transcript_email);
