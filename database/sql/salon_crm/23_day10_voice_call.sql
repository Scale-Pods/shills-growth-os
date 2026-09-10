-- =============================================================
-- 23_day10_voice_call.sql
-- Adds a day_10 AI voice-call step to the outreach cadence,
-- between day_8 (email) and day_12 (whatsapp).
--
-- SUPERSEDES an earlier draft of this file that assumed a new
-- call_logs table and voice_call_status/voice_call_at as the
-- only new salons columns. The user has already applied their
-- own real schema directly in Supabase:
--   - vapi_call_logs (pre-existing, created outside this repo) —
--     one row per VAPI call, keyed by VAPI's own call id, with
--     lead_id (text) storing the salon's id as text, plus status/
--     transcript/summary/recording_url/duration/cost.
--   - salons gained: voice_call_status, voice_call_at,
--     conversation_transcript_voice, voice_sentiment,
--     voice_last_picked_at (all text/timestamptz as the user
--     defined them).
-- This file only adds what's still missing: the day_10 enum
-- value and the cadence-scheduling logic. It does NOT create
-- call_logs or re-add salons columns that already exist.
--
-- Run after 22_users_auth.sql (and after the user's own
-- vapi_call_logs / salons column additions, which predate this
-- file).
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Add day_10 to the outreach_step enum.
--    Must run as its own statement (ADD VALUE cannot run inside
--    a multi-statement transaction block in older Postgres).
-- ---------------------------------------------------------------
alter type outreach_step add value if not exists 'day_10';


-- ---------------------------------------------------------------
-- 2. Index vapi_call_logs.lead_id for fast per-salon lookups from
--    n8n (lead_id stores salons.id as text — confirmed by user).
--    idx_vapi_logs_lead_id already exists per the user's DDL, so
--    this is a no-op safety net if that index is ever missing.
-- ---------------------------------------------------------------
create index if not exists idx_vapi_call_logs_lead_id
  on public.vapi_call_logs using btree (lead_id);


-- ---------------------------------------------------------------
-- 3. Insert day_10 into schedule_outreach_for_salon's cadence,
--    between day_8 and day_12, on the 'call' channel. Only fires
--    for salons that have a phone number.
-- ---------------------------------------------------------------
create or replace function public.schedule_outreach_for_salon(
  p_salon_id      uuid,
  p_has_whatsapp  boolean default false,
  p_has_email     boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_steps    text[] := array['day_0','day_2','day_5','day_8','day_10','day_12','day_15','day_18','day_21_final'];
  v_delays   int[]  := array[0,2,5,8,10,12,15,18,21];
  v_channels text[] := array['whatsapp','email','whatsapp','email','call','whatsapp','email','whatsapp','email'];
  v_step     text;
  v_delay    int;
  v_channel  text;
  v_has_phone boolean;
  i          int;
begin
  select (phone is not null and phone <> '') into v_has_phone
  from salons where id = p_salon_id;

  for i in 1 .. array_length(v_steps, 1) loop
    v_step    := v_steps[i];
    v_delay   := v_delays[i];
    v_channel := v_channels[i];

    if v_channel = 'whatsapp' and p_has_whatsapp then
      insert into outreach_sequences (salon_id, outreach_step, channel, scheduled_date, status)
      values (p_salon_id, v_step::outreach_step, 'whatsapp', (current_date + (v_delay || ' days')::interval)::date, 'pending')
      on conflict (salon_id, outreach_step, channel) do nothing;
    end if;

    if v_channel = 'email' and p_has_email then
      insert into outreach_sequences (salon_id, outreach_step, channel, scheduled_date, status)
      values (p_salon_id, v_step::outreach_step, 'email', (current_date + (v_delay || ' days')::interval)::date, 'pending')
      on conflict (salon_id, outreach_step, channel) do nothing;
    end if;

    if v_channel = 'call' and v_has_phone then
      insert into outreach_sequences (salon_id, outreach_step, channel, scheduled_date, status)
      values (p_salon_id, v_step::outreach_step, 'call', (current_date + (v_delay || ' days')::interval)::date, 'pending')
      on conflict (salon_id, outreach_step, channel) do nothing;
    end if;

    -- Neither whatsapp nor email known yet: fall back to day_0 on
    -- whatsapp only, same "best effort" behavior as before.
    if not p_has_whatsapp and not p_has_email and v_step = 'day_0' then
      insert into outreach_sequences (salon_id, outreach_step, channel, scheduled_date, status)
      values (p_salon_id, 'day_0'::outreach_step, 'whatsapp', current_date, 'pending')
      on conflict (salon_id, outreach_step, channel) do nothing;
    end if;
  end loop;
end;
$$;

grant execute on function public.schedule_outreach_for_salon(uuid, boolean, boolean) to service_role;

comment on function public.schedule_outreach_for_salon(uuid, boolean, boolean) is
  '9-step cadence: day_0 wa, day_2 email, day_5 wa, day_8 email, day_10 call, day_12 wa, day_15 email, day_18 wa, day_21_final email — 0/2/5/8/10/12/15/18/21 days from today. WhatsApp/email steps only insert if the salon has that channel; the day_10 call step only inserts if the salon has a phone number.';
