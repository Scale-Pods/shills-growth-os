# SHILLS Salon CRM — End-to-End Context

This is a separate project from the RRS (Receivables Recovery System) work also present in this workspace's history. It is a B2B lead-generation and sales-outreach CRM for Shills (professional salon products company), targeting salons as leads.

## System components

1. **Supabase database** — schema files in `database/sql/00_*.sql` through `17_*.sql`, run in numeric order.
2. **n8n workflows** — folder "Salon CRM" in n8n, containing SSE-A through SSE-D plus SSE-B's cadence engine.
3. **Credentials** — Supabase credential named **`SHILLS Salon CRM`** (id `C5sYtSadejA5kWb5`) is the canonical one for this project's Supabase nodes. Many other Supabase credentials exist in the same n8n instance for unrelated client projects — do not confuse them.

---

## Database schema (Supabase, run in order)

| File | Contents |
|---|---|
| `00_extensions.sql` | Postgres extensions |
| `01_enums.sql` | All custom enum types (see below) |
| `02_reps.sql` | `reps` table — sales reps, region, active flag, round-robin assignment weight |
| `03_salons.sql` | `salons` table — core leads table (see below) |
| `04_stage_history.sql` | `salon_stage_history` — append-only funnel stage change log |
| `05_message_logs.sql` | `whatsapp_logs` and `email_logs` — per-message inbound/outbound records with AI classification fields |
| `06_samples_and_meetings.sql` | `samples` (product sample dispatch tracking) and `meetings` (demo/video call scheduling) |
| `07_deals_and_revenue.sql` | Deals and revenue tracking, `active_accounts` |
| `08_activity_log.sql` | `sales_activities` — unified activity timeline |
| `09_message_templates.sql` | `message_templates` — WhatsApp/email templates per outreach step |
| `10_outreach_sequences.sql` | `outreach_sequences` — tracks pending/sent/skipped/cancelled per salon/step/channel |
| `11_triggers_and_functions.sql` | Triggers + stored functions (see below) |
| `12_views.sql` | Views, including `v_pending_outreach_today` (used by SSE-B) |
| `13_rls_policies.sql` | Row Level Security policies |
| `14_seed_templates.sql` | Seed data for message templates |
| `15_n8n_helper_functions.sql` | Helper RPC functions for n8n HTTP calls |
| `16_conversation_transcript.sql` | Adds `salons.conversation_transcript` (jsonb) — full running WhatsApp/email conversation thread |
| `17_last_reply_at.sql` | Adds `salons.last_reply_at` (timestamptz) — gates SSE-B day 3/7/14 sends |

### Key enums (`01_enums.sql`)

```sql
funnel_stage:    lead_generated, contacted, interested, sample_sent,
                 demo_booked, negotiation, won, lost
channel_type:    whatsapp, email, call, system
outreach_step:   day_0, day_3, day_7, day_14_final
message_status:  pending, sent, delivered, read, replied, failed, skipped, cancelled
interest_label:  positive, neutral, negative, not_interested, wrong_contact
intent_label:    wants_sample, wants_demo, wants_pricing, asking_details,
                 not_interested, wrong_number, already_using_competitor,
                 call_back_later, other
lead_source:     google_maps, referral, inbound, manual, import
salon_category:  unisex_salon, ladies_salon, mens_salon, spa, academy, other
meeting_type:    video, in_person
meeting_status:  scheduled, completed, no_show, rescheduled, cancelled
sample_status:   requested, dispatched, delivered, feedback_received
```

### `salons` table (core leads table, `03_salons.sql` + later additions)

```
id, google_place_id (unique, dedup key), salon_name, category, region, city,
address, latitude, longitude, phone, whatsapp_number, email,
google_rating, google_reviews_count, lead_source, current_stage (funnel_stage),
assigned_rep_id, is_active, notes, created_at, updated_at,
conversation_transcript (jsonb, added 16_*) — array of {direction, message, at},
last_reply_at (timestamptz, added 17_*) — most recent inbound reply timestamp, any channel
```

### `whatsapp_logs` / `email_logs` (`05_message_logs.sql`)

Both tables share the same shape: `salon_id`, `direction` (outbound/inbound), `outreach_step`, message content (`message_body` or `subject`+`body`), a channel-specific message ID, `status`, `interest`, `intent`, `interest_score`, `reply_summary`, `raw_payload`, `created_at`.

### Central function: `change_salon_stage()` (`11_triggers_and_functions.sql`)

All stage transitions are *supposed* to go through this RPC (never update `salons.current_stage` directly) — it writes to `salons`, appends to `salon_stage_history`, logs to `sales_activities`, and auto-cancels pending `outreach_sequences` when stage becomes `won`/`lost`.

**Note:** In practice, the n8n workflows (SSE-B, SSE-C, SSE-D) currently update `salons.current_stage` directly via native Supabase update nodes, NOT via this RPC — this was a deliberate simplification made during workflow debugging (moving away from hardcoded-secret HTTP RPC calls to native Supabase nodes). This means `salon_stage_history` and the auto-cancel-on-won/lost logic are **not currently being triggered** by the live workflows. This is a known gap, not yet resolved.

### Other functions

- `assign_rep_round_robin(region)` — returns least-loaded active rep in a region
- `schedule_outreach_for_salon(salon_id, has_whatsapp, has_email)` — enqueues day_0/3/7/14 rows into `outreach_sequences` for both channels where contact info exists

---

## n8n workflows ("Salon CRM" folder)

### SSE-A | Lead Discovery
- On-demand, region-based lead generation triggered by form input (not fixed default regions) — user explicitly chose this over the old fixed weekly-cron 8-city workflow.
- New workflow ID: `ifsGWWisme9czHTz`. Old fixed-cron workflow `41SI42t0f0a7zHix` was left untouched/active per user's explicit choice (not archived).
- Debugged through RLS/service-role-key issues, missing `Authorization: Bearer` header (only `apikey` was being sent), and HTTP-Request-node array-unwrapping bugs (`.first().json[0]` returning undefined after n8n auto-unwraps JSON array responses).

### SSE-B | Master Outreach Cadence — `HWVn19kB0MAcnZrY`
Single workflow, daily schedule trigger (10:00 IST / 04:30 UTC), handles all 4 outreach steps (day_0, day_3, day_7, day_14_final) via a Switch node routing by `outreach_step`.

**Per-step shape (WhatsApp side):**
```
Guard: Check Stage (Day-X) → Stage OK for Day-X? (IF: current_stage matches expected)
  → [day 3/7/14 only] Has Replied? (Day-X): last_reply_at not empty?
       YES → Mark Day-X Skipped
       NO  → Fetch WA Template (day_X) → Render WA Day-X (Code node, {{placeholder}} substitution)
             → Has WhatsApp? (IF) → Send via Twilio node → Log WA Day-X (whatsapp_logs) → Mark WA Sent (day_X)
```

**Per-step shape (Email side, added later to mirror day-0):**
```
Render WA Day-X → Fetch Email Template (day_X) → Render Email Day-X Body
  → Has Email? (Day-X Gmail): salon.email not empty?
       true  → Send Email Day-X (Gmail) → Log Email Outbound (day_X) [email_logs] → Mark Email Sequence Sent (day_X)
       false → No Email - Skip (Day-X Gmail)
```
Day 0 also has `Update Salon Stage (contacted, day_0)` after send. Legacy/disabled Instantly-campaign nodes were kept alongside the new Gmail nodes per user's explicit choice ("keep both, add Gmail alongside") — not removed, just left disabled so both mechanisms are available to toggle.

**Reply-gating mechanism (the "don't send day 3 if they replied on day 0" logic):**
- SSE-C stamps `salons.last_reply_at = now()` on every inbound WhatsApp message (via `Save Transcript (Inbound)`).
- SSE-B's `Has Replied? (Day-X)` IF nodes (day 3/7/14 only — day 0 has no prior reply to check) read `last_reply_at` from the same `Guard: Check Stage (Day-X)` Supabase fetch already in the flow. If set, the send is skipped and marked `skipped` in `outreach_sequences`.
- This is a **one-way gate**: once `last_reply_at` is set, it is never cleared, so a salon that replies once stays out of the day 3/7/14 cadence permanently (no automatic re-entry mechanism exists).

**Known pre-existing quirks in SSE-B (flagged during work, not all fixed):**
- Several `n8n-nodes-base.if` nodes originally had correct conditions but zero downstream connections (`"main": [[],[]]`) — a distinct bug class from condition-logic bugs. Fixed across `Any Sequences To Send?`, `Has WhatsApp?`/`Has Email?` (Day-0), `Stage OK for Day-3/7/14?`, `Has WA?` (Day-7/14).
- All hardcoded-secret RPC HTTP calls (calling `change_salon_stage`/`assign_rep_round_robin` via raw HTTP with env-var secrets in headers) were replaced with native Supabase nodes doing direct table updates — this is *why* the RPC function's history-logging and auto-cancel side effects are currently bypassed (see note above).

### SSE-C | WhatsApp Inbound & CRM Journey — `uTFXg2BcgxDTis5m`
The reference/"perfectly working" implementation that SSE-D was later built to mirror. Conversational AI sales agent for inbound WhatsApp replies, with parallel sentiment classification, transcript storage, stage advancement, and demo-booking hooks.

**Full architecture:**
```
[Dual trigger]
  WhatsApp Trigger (Inbound) [disabled — no real WhatsApp Business connected yet]
  Test Reply Webhook (Postman) — path sse-whatsapp-inbound-test, for manual testing via Postman
    ↓ (both normalize to a common shape: sender_phone, message_text, whatsapp_message_id)
Normalize (Real WhatsApp) / Normalize (Test Webhook)
  ↓
Lookup Salon (Supabase getAll on salons)
  ↓
Log Inbound Message (whatsapp_logs, direction=inbound)
  ↓
Build Transcript (Inbound) [Code node: append {direction, message, at} to existing conversation_transcript]
  ↓
Save Transcript (Inbound) [Supabase update: writes conversation_transcript + last_reply_at = now()]
  ↓ (fans out to BOTH in parallel — this is the fixed architecture, see "Classifier bug" below)
  ├─→ Conversational Sales Agent (Claude, hasOutputParser=false, plain text reply)
  │     + Sales Agent Model (Claude Sonnet 4.6) + Conversation Memory (memoryBufferWindow, session key = salon id)
  └─→ Classify Reply (Claude, hasOutputParser=true, structured JSON output)
        + Classifier Model + Classifier Output Parser (structured schema: interest/intent/interest_score/summary)
        ↓
      Parse Classifier Output (Code node: strips markdown fences, JSON.parse with error handling)
  ↓ (both branches converge)
Merge Agent Outputs (n8n Merge node, mode=combine, combineBy=combineByPosition — each branch emits exactly 1 item/run)
  ↓
Send AI Reply (Real WhatsApp) [disabled] / Send an SMS/MMS/WhatsApp message (Twilio, enabled — actual send path)
  ↓
Log Outbound AI Reply (whatsapp_logs, direction=outbound, includes classifier's interest/intent/score/summary)
  ↓
Build Transcript (Outbound) → Save Transcript (Outbound)
  ↓
Interest Positive? (IF: classifier interest == positive)
  ├─ true → Stage -> interested (Supabase update, current_stage=interested)
  │           ↓ (fans out to BOTH demo-booking paths in parallel)
  │           ├─→ Book Demo Slot (Google Calendar) [disabled, needs OAuth credential]
  │           │     → Save Meeting (Auto-booked) [meetings, status=scheduled]
  │           │     → Notify - Demo Auto-Booked (WhatsApp) [disabled] + (Email) [disabled]
  │           └─→ Save Meeting (Human Followup) [meetings, status=requested, no scheduled_at]
  │                 → Notify - Demo Followup Needed (WhatsApp) [enabled] + (Email) [enabled]
  │           Also: Notify Founder - Positive Lead [disabled] + Send an SMS/MMS/WhatsApp message1 [Twilio, enabled]
  └─ false → Explicitly Not Interested? (IF: interest == not_interested)
              └─ true → Stage -> lost
```

**Known bug fixed during development — "Classify Reply keeps refusing to classify":**
- Root cause 1 (architectural): `Classify Reply` was originally wired *after* `Conversational Sales Agent` in sequence, so by the time it ran it was effectively seeing the sales agent's own reply context, not the customer's original message. Fixed by rewiring both agents to run in **parallel** off the same upstream node (`Save Transcript (Inbound)`), converging at a `Merge Agent Outputs` node before the send step.
- Root cause 2 (prompt): Even after the rewire, the model kept returning conversational refusal text instead of calling the structured-output tool, because n8n's `hasOutputParser=true` mode auto-injects a "you must use the format_final_json_response tool" instruction, and the model was treating a customer's genuine question (e.g. "What are the products?") as something to *answer* rather than *classify*. Fixed by rewriting the classifier's systemMessage to explicitly forbid answering the message content under any circumstance and to always call the structured tool, plus clarifying that engagement-signaling messages (like product questions) count as "positive" classifications, not something to respond to.
- A recurring tool-usage bug during this work: using `setNodeParameter` on a nested path (e.g. `/parameters/options/systemMessage`) on an AI Agent node sometimes wrote a stray duplicate `parameters` sibling key instead of merging into the existing one, silently leaving the OLD value live. Always verify via `get_workflow_details` after such an edit, or prefer `updateNodeParameters` with `replace: true` and the full parameter object.

**User's manual UI edits present in the live workflow (must not be touched/undone):**
- Disabled: `WhatsApp Trigger (Inbound)`, `Send AI Reply (Real WhatsApp)`, `Notify Founder - Positive Lead` (Twilio nodes used instead for actual sending).
- Two Twilio "Send an SMS/MMS/WhatsApp message" nodes added in parallel to the disabled native WhatsApp-send nodes — these are the real active send path.
- `Lookup Salon`'s filter was manually changed to `returnAll: true` with empty `conditions: []` — this means it currently returns ALL salons, not filtered by phone number. Flagged as a likely bug but explicitly left unfixed per user instruction ("just want to fix the classifier node" — scope was kept narrow).
- `Normalize (Test Webhook)` hardcodes `sender_phone: "919373329763"` and reads `message_text` from `{{ $json.body.message.type }}` — matches the actual Postman test payload shape used (`{"message": {"type": "actual text"}}`), confirmed correct for testing purposes.
- A full **disconnected duplicate branch** exists in the workflow (`Lookup Salon1`, `Log Inbound Message1`, `Build Transcript (Inbound)1`, `Conversational Sales Agent1` + `Sales Agent Model1` + `Conversation Memory1`, `Classify Reply1` + `Classifier Model1` + `Classifier Output Parser1`) — explicitly confirmed by the user as an intentional backup copy. **Must never be touched, wired up, or deleted.**

### SSE-D | Email Inbound & CRM Handler — `iJw61KTTqOJBdeFU`
Rebuilt from scratch to achieve full architectural parity with SSE-C (conversational reply agent + parallel classifier + transcript + stage advancement + demo booking), replacing an old primitive version that only classified (no reply) and used hardcoded-secret RPC HTTP calls plus OpenAI instead of Claude.

**Structure is identical to SSE-C's shape, substituting WhatsApp-specific pieces for email:**
- Dual trigger: `Email Inbound Webhook` (real, path `sse-email-inbound`) + `Test Reply Webhook (Postman)` (path `sse-email-inbound-test`)
- `Normalize (Real Email)` / `Normalize (Test Webhook)` → `sender_email`, `email_subject`, `message_text`, `email_message_id`
- `Lookup Salon` matches on `salons.email` (not phone)
- `Log Inbound Message` writes to `email_logs` (not `whatsapp_logs`)
- `Conversational Email Agent` (Claude) drafts an actual email reply; system prompt tailored for email tone (3-6 sentences, professional, no markdown, signs off "The Shills Team"), also actively steers toward booking a demo call once the lead is engaged
- `Classify Reply` uses the same hardened "never answer, always classify" systemMessage pattern proven in SSE-C
- `Send AI Reply (Gmail)` sends the actual reply email; `Log Outbound AI Reply` writes to `email_logs`
- Same `Interest Positive?`/`Explicitly Not Interested?` stage advancement, same dual demo-booking paths (Google Calendar auto-book [disabled] + human followup [enabled]), same WhatsApp+Email notification pattern with placeholder recipients

**All 9 Supabase-backed nodes in SSE-D use the `SHILLS Salon CRM` credential (id `C5sYtSadejA5kWb5`) explicitly**, per user request — this was a deliberate correction since n8n auto-assigns a default "Supabase account" credential otherwise, which is the wrong one for this project.

**Not yet done for SSE-D (mirrors SSE-C's open items):**
- Real inbound-email trigger not connected (analogous to SSE-C's disabled WhatsApp Trigger) — currently only testable via the Postman webhook.
- Google Calendar OAuth credential not connected — auto-booking path stays disabled until then.
- Placeholder WhatsApp numbers/emails in all 4 demo-notification nodes need real values filled in.

---

## Outstanding known gaps (as of this writing)

1. **`change_salon_stage()` RPC bypass** — SSE-B/C/D update `salons.current_stage` directly via native Supabase nodes rather than calling the RPC, so `salon_stage_history` logging and the won/lost auto-cancel-pending-sequences logic are not currently firing from the live workflows. Not yet reconciled.
2. **SSE-C's `Lookup Salon` returns all salons** (empty filter conditions) instead of filtering by phone number — known, explicitly left unfixed per user's narrow-scope instruction at the time.
3. **`last_reply_at` gate is one-way** — no mechanism yet to re-enter a salon into the day 3/7/14 cadence if they go cold again after an initial reply.
4. **Demo-booking Google Calendar auto-book path is disabled in both SSE-C and SSE-D** pending a real Google Calendar OAuth credential; the booked slot logic itself is also just a fixed "tomorrow 11:00–11:30" placeholder, not real free/busy-based scheduling.
5. **Notification recipient placeholders** — WhatsApp numbers and email addresses in the demo-booking notify nodes (both SSE-C and SSE-D) are still placeholder values (`<__PLACEHOLDER_VALUE__...__>`), not real responsible-person contact info.
6. **SSE-A's old fixed-cron workflow (`41SI42t0f0a7zHix`) was left active alongside the new on-demand one (`ifsGWWisme9czHTz`)** per user's explicit choice — not archived, so both exist side by side.
7. **SSE-C has an intentional disconnected duplicate node branch** (the `...1`-suffixed nodes) kept as a manual backup by the user — not a bug, must not be touched.

---

## Credential reference

- **Supabase**: `SHILLS Salon CRM` (id `C5sYtSadejA5kWb5`) — canonical credential for this project's Supabase nodes. (A separate generic "Supabase account" credential exists in the same n8n instance and is what auto-assignment defaults to — always double-check/override this for Salon CRM workflows.)
- **Anthropic**: default "Anthropic account" credential, used by all Claude Sonnet 4.6 model nodes (conversational agents + classifiers) across SSE-C and SSE-D.
- **Gmail**: `info@scalepods.co` (OAuth2) — used for all outbound email sends (day-0/3/7/14 templates in SSE-B, AI replies in SSE-D, demo notifications).
- **Twilio**: "Twilio account - Guileo" — used for WhatsApp sends via Twilio's WhatsApp channel (the actual active send mechanism in SSE-B/C/D, since native WhatsApp Business Cloud nodes are disabled pending real WhatsApp Business API access).
- **Google Calendar**: not yet connected — required to enable the auto-book demo path in SSE-C and SSE-D.
