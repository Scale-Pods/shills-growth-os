-- =============================================================
-- 14_seed_templates.sql
-- Seed message_templates with all outreach copy.
-- Tone progression: warm → light nudge → value-driven → closing.
-- Placeholders: {{salon_name}}, {{city}}, {{rep_name}},
--               {{sample_link}}, {{calendar_link}}
-- Run last, after 13_rls_policies.sql.
-- =============================================================

insert into message_templates
  (channel, outreach_step, tone, subject, body_template, variables, is_active)
values

-- -------------------------------------------------------
-- DAY 0 — WhatsApp (Warm intro)
-- -------------------------------------------------------
(
  'whatsapp',
  'day_0',
  'warm',
  null,
  'Hi! 👋 This is {{rep_name}} from Shills. We noticed {{salon_name}} in {{city}} and think our professional salon products could be a fantastic fit for your space.

We work with hundreds of salons across India and would love to show you what we offer — absolutely no pressure.

Would you be open to a quick chat, or shall I send over a *free product sample* for you to try yourself? 😊

Looking forward to hearing from you!',
  ARRAY['rep_name', 'salon_name', 'city'],
  true
),

-- -------------------------------------------------------
-- DAY 0 — Email (Warm intro)
-- -------------------------------------------------------
(
  'email',
  'day_0',
  'warm',
  'Introducing Shills for {{salon_name}} — Free Sample Inside 🎁',
  'Hi there,

My name is {{rep_name}} and I'm reaching out from Shills, a professional salon product brand trusted by salons across India.

I came across {{salon_name}} in {{city}} and wanted to personally introduce ourselves. We specialise in high-quality, salon-grade products — from hair care to skin treatments — designed to help salons like yours delight clients and improve margins.

Here''s what I''d love to offer you, completely free and with zero obligation:
✅ A curated sample kit tailored to your salon type
✅ A 15-minute product walkthrough at your convenience
✅ Honest pricing with no lock-in contracts

If you''d like to try before you commit, just reply to this email or click the link below to request your free sample:
👉 {{sample_link}}

Or if you''d prefer a quick call, you can book a slot here:
📅 {{calendar_link}}

Looking forward to connecting, {{salon_name}}!

Warm regards,
{{rep_name}}
Shills Distribution Team',
  ARRAY['rep_name', 'salon_name', 'city', 'sample_link', 'calendar_link'],
  true
),

-- -------------------------------------------------------
-- DAY 3 — WhatsApp (Light follow-up nudge)
-- -------------------------------------------------------
(
  'whatsapp',
  'day_3',
  'light',
  null,
  'Hi {{salon_name}} 👋 Just following up on my message from a few days ago!

I know things get busy — totally understand. I just wanted to check if you''d be interested in a *free Shills product sample* to try at your salon, no strings attached.

Even just a quick "yes" and I''ll get it sorted for you! 😊',
  ARRAY['salon_name'],
  true
),

-- -------------------------------------------------------
-- DAY 3 — Email (Light follow-up)
-- -------------------------------------------------------
(
  'email',
  'day_3',
  'light',
  'Quick follow-up — Free sample still waiting for {{salon_name}} 📦',
  'Hi there,

Just a quick follow-up on my earlier email! I wanted to make sure it didn''t get buried in your inbox.

The offer is still on the table — a *free Shills sample kit* customised for {{salon_name}}, delivered to your door with no obligation whatsoever.

If you''d like one, just hit reply or click here: {{sample_link}}

No pressure at all — I just think once you see the product quality, it speaks for itself. 🙌

Best,
{{rep_name}}
Shills Distribution Team',
  ARRAY['salon_name', 'sample_link', 'rep_name'],
  true
),

-- -------------------------------------------------------
-- DAY 7 — WhatsApp (Value-proposition follow-up)
-- -------------------------------------------------------
(
  'whatsapp',
  'day_7',
  'value',
  null,
  'Hi {{salon_name}}! 👋 {{rep_name}} from Shills again — hope the week''s been great!

Just wanted to share something: salons we''ve partnered with in {{city}} have been seeing *repeat clients every 3–4 weeks* purely off our hair treatment range. A few told us it''s added 15–20% to their monthly retail revenue with almost zero extra effort. 📈

I''d love for {{salon_name}} to experience the same. The *free sample* offer is still open — want me to send one over this week?

You can also book a 15-min call here: {{calendar_link}} 😊',
  ARRAY['salon_name', 'rep_name', 'city', 'calendar_link'],
  true
),

-- -------------------------------------------------------
-- DAY 7 — Email (Value-proposition follow-up)
-- -------------------------------------------------------
(
  'email',
  'day_7',
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
{{rep_name}}
Shills Distribution Team',
  ARRAY['salon_name', 'city', 'sample_link', 'calendar_link', 'rep_name'],
  true
),

-- -------------------------------------------------------
-- DAY 14 FINAL — WhatsApp (Low-pressure close)
-- -------------------------------------------------------
(
  'whatsapp',
  'day_14_final',
  'closing',
  null,
  'Hi {{salon_name}} 👋 Just closing the loop from my end — completely understand if now isn''t the right time!

If you ever want to explore Shills products for your salon in the future, we''re always here. Just drop me a message anytime. 😊

Wishing {{salon_name}} continued success! 🙏

– {{rep_name}}, Shills',
  ARRAY['salon_name', 'rep_name'],
  true
),

-- -------------------------------------------------------
-- DAY 14 FINAL — Email (Low-pressure close)
-- -------------------------------------------------------
(
  'email',
  'day_14_final',
  'closing',
  'No pressure — just closing the loop for {{salon_name}} 🙏',
  'Hi there,

I''ve reached out a few times about Shills products for {{salon_name}} and I want to be respectful of your time — so this will be my last message unless you''d like to hear more.

If the timing isn''t right, absolutely no worries at all. Things get busy and priorities shift — we get it completely.

But if you ever decide you''d like to explore what Shills can do for {{salon_name}}, we''ll be right here. Just reply to this email or visit: {{sample_link}}

Wishing you and the {{salon_name}} team all the best! 🌟

Warm regards,
{{rep_name}}
Shills Distribution Team

P.S. Our door is always open — feel free to reach out in a week, a month, or whenever feels right.',
  ARRAY['salon_name', 'sample_link', 'rep_name'],
  true
);
