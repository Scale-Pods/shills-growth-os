-- =============================================================
-- 20_outreach_cadence_v2.sql
-- Rebuilds the outreach cadence from 4 steps (day_0/3/7/14_final,
-- both channels same day) to 8 alternating steps across 21 days:
--
--   day_0   (+0,  whatsapp)   day_2   (+2,  email)
--   day_5   (+5,  whatsapp)   day_8   (+8,  email)
--   day_12  (+12, whatsapp)   day_15  (+15, email)
--   day_18  (+18, whatsapp)   day_21_final (+21, email)
--
-- Each step now has exactly ONE channel (not both). A salon with
-- no email only ever gets the 4 whatsapp-channel steps inserted
-- (day_0/5/12/18) — schedule_outreach_for_salon simply never
-- inserts a row for a channel the salon doesn't have, so their
-- cadence naturally ends at day_18 with 4 touches total.
--
-- Run after 19_sentiment_and_channel_reply_tracking.sql.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Extend the outreach_step enum with the new step labels.
--    Postgres enums only support adding values, not removing
--    them — day_3/day_7/day_14_final are left in the type
--    (harmless; any historical rows keep those labels) but are
--    no longer used by schedule_outreach_for_salon or by SSE-B
--    after this migration.
--    ADD VALUE cannot run inside a multi-statement transaction
--    block in older Postgres — each is its own statement so this
--    file is safe to paste as-is into the Supabase SQL editor.
-- ---------------------------------------------------------------
alter type outreach_step add value if not exists 'day_2';
alter type outreach_step add value if not exists 'day_5';
alter type outreach_step add value if not exists 'day_8';
alter type outreach_step add value if not exists 'day_12';
alter type outreach_step add value if not exists 'day_15';
alter type outreach_step add value if not exists 'day_18';
alter type outreach_step add value if not exists 'day_21_final';


-- ---------------------------------------------------------------
-- 2. Rewrite schedule_outreach_for_salon for the 8-step, single-
--    channel-per-step cadence. Same idempotency guarantee as
--    before via the (salon_id, outreach_step, channel) unique
--    constraint on outreach_sequences.
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
  v_steps    text[] := array['day_0','day_2','day_5','day_8','day_12','day_15','day_18','day_21_final'];
  v_delays   int[]  := array[0,2,5,8,12,15,18,21];
  v_channels text[] := array['whatsapp','email','whatsapp','email','whatsapp','email','whatsapp','email'];
  v_step     text;
  v_delay    int;
  v_channel  text;
  i          int;
begin
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

    -- Neither channel known yet: fall back to day_0 on whatsapp only,
    -- same "best effort" behavior as the original function.
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
  '8-step alternating cadence (day_0 wa, day_2 email, day_5 wa, day_8 email, day_12 wa, day_15 email, day_18 wa, day_21_final email), 0/2/5/8/12/15/18/21 days from today. Each step has exactly one fixed channel; a step is only inserted if the salon has that channel. Superseded the old 4-step both-channels-same-day version.';


-- ---------------------------------------------------------------
-- 3. Seed message_templates for the 7 net-new steps. day_0
--    whatsapp/email already exist from 14_seed_templates.sql and
--    are reused as-is. Tone arc: warm(0) -> light(2) ->
--    light-value(5) -> value(8) -> value(12) -> soft-close(15) ->
--    closing(18) -> final closing(21_final). Same placeholder set
--    and voice as the existing seed file; rep name written as the
--    literal "Alka" to match the live seeded rows in Supabase.
-- ---------------------------------------------------------------
insert into message_templates
  (channel, outreach_step, tone, subject, body_template, variables, is_active)
values

-- -------------------------------------------------------
-- DAY 2 — Email (Light follow-up, mirrors old day_3 email)
-- -------------------------------------------------------
(
  'email',
  'day_2',
  'light',
  'Quick follow-up — Free sample still waiting for {{salon_name}} 📦',
  'Hi there,

Just a quick follow-up on my earlier message! I wanted to make sure it didn''t get buried in your inbox.

The offer is still on the table — a *free Shills sample kit* customised for {{salon_name}}, delivered to your door with no obligation whatsoever.

If you''d like one, just hit reply or click here: {{sample_link}}

No pressure at all — I just think once you see the product quality, it speaks for itself. 🙌

Best,
Alka
Shills Distribution Team',
  ARRAY['salon_name', 'sample_link', 'rep_name'],
  true
),

-- -------------------------------------------------------
-- DAY 5 — WhatsApp (Light follow-up nudge, mirrors old day_3 whatsapp)
-- -------------------------------------------------------
(
  'whatsapp',
  'day_5',
  'light',
  null,
  'Hi {{salon_name}} 👋 Just following up on my message from a few days ago!

I know things get busy — totally understand. I just wanted to check if you''d be interested in a *free Shills product sample* to try at your salon, no strings attached.

Even just a quick "yes" and I''ll get it sorted for you! 😊

Alka, Shills Distribution Team',
  ARRAY['salon_name'],
  true
),

-- -------------------------------------------------------
-- DAY 8 — Email (Value-proposition follow-up, mirrors old day_7 email)
-- -------------------------------------------------------
(
  'email',
  'day_8',
  'value',
  'What other {{city}} salons are seeing with Shills 📈',
  'Hi {{salon_name}} team,

I''ve reached out a couple of times and I promise this is my last "pushy" email — I just genuinely think there''s something here worth seeing. 😊

Here''s what salons in your area have shared with us after trying Shills:

🔁 *Repeat visits every 3–4 weeks* — clients come back specifically for the treatment experience
💰 *15–20% boost in retail sales* — without any extra staff or major investment
⭐ *Higher Google ratings* — salons report clients mentioning product quality in reviews

None of this requires a long-term commitment. We start with a free sample, you try it on real clients, and then you decide.

Claim your free sample here: {{sample_link}}
Or schedule a quick call: {{calendar_link}}

If now isn''t the right time, I completely understand — just keep us in mind!

Best regards,
Alka
Shills Distribution Team',
  ARRAY['salon_name', 'city', 'sample_link', 'calendar_link', 'rep_name'],
  true
),

-- -------------------------------------------------------
-- DAY 12 — WhatsApp (Value-proposition follow-up, mirrors old day_7 whatsapp)
-- -------------------------------------------------------
(
  'whatsapp',
  'day_12',
  'value',
  null,
  'Hi {{salon_name}}! Alka from Shills again — hope things have been going well!

Just wanted to share something: salons we''ve partnered with in {{city}} have been seeing *repeat clients every 3–4 weeks* purely off our hair treatment range. A few told us it''s added 15–20% to their monthly retail revenue with almost zero extra effort. 📈

I''d love for {{salon_name}} to experience the same. The *free sample* offer is still open — want me to send one over this week?

You can also book a 15-min call here: {{calendar_link}} 😊',
  ARRAY['salon_name', 'rep_name', 'city', 'calendar_link'],
  true
),

-- -------------------------------------------------------
-- DAY 15 — Email (Soft-close, new tone step bridging value -> closing)
-- -------------------------------------------------------
(
  'email',
  'day_15',
  'soft_close',
  'Still here whenever {{salon_name}} is ready 🙂',
  'Hi there,

I don''t want to keep filling your inbox, so I''ll keep this short.

We''ve shared a bit about what Shills has done for other salons in {{city}}, and the free sample offer for {{salon_name}} is still open — no cost, no obligation, no expiry.

If you''d like to try it, just reply here or grab a sample directly: {{sample_link}}
Prefer to talk it through first? Here''s my calendar: {{calendar_link}}

Either way, I''ll check back in a little while longer — no rush at all.

Best,
Alka
Shills Distribution Team',
  ARRAY['salon_name', 'city', 'sample_link', 'calendar_link', 'rep_name'],
  true
),

-- -------------------------------------------------------
-- DAY 18 — WhatsApp (Closing, one step before the final email)
-- -------------------------------------------------------
(
  'whatsapp',
  'day_18',
  'closing',
  null,
  'Hi {{salon_name}} 👋 Alka here from Shills — this will be one of my last check-ins on this.

Totally understand if the timing hasn''t been right. The *free sample* offer still stands whenever you''re ready — just message me anytime and I''ll sort it out. 😊

Wishing {{salon_name}} all the best either way! 🙏',
  ARRAY['salon_name', 'rep_name'],
  true
),

-- -------------------------------------------------------
-- DAY 21 FINAL — Email (Low-pressure close, mirrors old day_14_final email)
-- -------------------------------------------------------
(
  'email',
  'day_21_final',
  'closing',
  'No pressure — just closing the loop for {{salon_name}} 🙏',
  'Hi there,

I''ve reached out a few times about Shills products for {{salon_name}} and I want to be respectful of your time — so this will be my last message unless you''d like to hear more.

If the timing isn''t right, absolutely no worries at all. Things get busy and priorities shift — we get it completely.

But if you ever decide you''d like to explore what Shills can do for {{salon_name}}, we''ll be right here. Just reply to this email or visit: {{sample_link}}

Wishing you and the {{salon_name}} team all the best! 🌟

Warm regards,
Alka
Shills Distribution Team

P.S. Our door is always open — feel free to reach out in a week, a month, or whenever feels right.',
  ARRAY['salon_name', 'sample_link', 'rep_name'],
  true
);
