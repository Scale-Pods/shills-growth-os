-- =============================================================
-- 19_sentiment_and_channel_reply_tracking.sql
-- Documents columns already added directly in Supabase (outside
-- migration history) that the app now depends on. Run after
-- 18_conversation_transcript_email.sql. Safe to re-run.
-- =============================================================

alter table salons
  add column if not exists whatsapp_sentiment text,
  add column if not exists email_sentiment text,
  add column if not exists whatsapp_last_reply_at timestamptz,
  add column if not exists email_last_reply_at timestamptz;

comment on column salons.whatsapp_sentiment is
  'Latest WhatsApp reply classification, formatted as "<interest> - <intent> - <summary>", e.g. "positive - wants_sample - Salon owner reversed initial rejection and is now requesting product samples."';

comment on column salons.email_sentiment is
  'Latest email reply classification, same "<interest> - <intent> - <summary>" format as whatsapp_sentiment.';

comment on column salons.whatsapp_last_reply_at is
  'Timestamp of the most recent inbound WhatsApp reply from this salon.';

comment on column salons.email_last_reply_at is
  'Timestamp of the most recent inbound email reply from this salon.';

create index if not exists idx_salons_whatsapp_last_reply_at
  on salons(whatsapp_last_reply_at) where whatsapp_last_reply_at is not null;

create index if not exists idx_salons_email_last_reply_at
  on salons(email_last_reply_at) where email_last_reply_at is not null;
