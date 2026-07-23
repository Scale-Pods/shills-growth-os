-- =============================================================
-- 01_enums.sql
-- All custom enum types. Run after 00_extensions.sql.
-- =============================================================

create type funnel_stage as enum (
  'lead_generated','contacted','interested','sample_sent',
  'demo_booked','negotiation','won','lost'
);

create type channel_type as enum ('whatsapp','email','call','system');

create type outreach_step as enum ('day_0','day_3','day_7','day_14_final');

create type message_status as enum (
  'pending','sent','delivered','read','replied','failed','skipped','cancelled'
);

create type interest_label as enum (
  'positive','neutral','negative','not_interested','wrong_contact'
);

create type intent_label as enum (
  'wants_sample','wants_demo','wants_pricing','asking_details',
  'not_interested','wrong_number','already_using_competitor',
  'call_back_later','other'
);

create type lead_source as enum (
  'google_maps','referral','inbound','manual','import'
);

create type salon_category as enum (
  'unisex_salon','ladies_salon','mens_salon','spa','academy','other'
);

create type meeting_type as enum ('video','in_person');

create type meeting_status as enum (
  'scheduled','completed','no_show','rescheduled','cancelled'
);

create type sample_status as enum (
  'requested','dispatched','delivered','feedback_received'
);
