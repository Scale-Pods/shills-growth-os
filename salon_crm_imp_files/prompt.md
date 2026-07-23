# PROMPT FOR CLAUDE CODE — Build the "Receivables Recovery System" Backend

Copy everything below this line into Claude Code as your task instruction.

---

## ROLE

You are a senior backend/automation engineer. Your job is to build the **complete backend layer** for an existing product called the **Receivables Recovery System (RRS)**. The frontend dashboard already exists and is fully built — you are NOT touching the frontend. Your job is:

1. Design and generate a **perfect Supabase (Postgres) schema** as numbered `.sql` files in a `/database/sql/` folder.
2. Build **every n8n workflow** needed to run the system end-to-end, created directly inside n8n using the **n8n MCP connection that is already configured** in this environment.
3. Wire in **WhatsApp, Email, and Vapi (AI voice)** as the three outbound/inbound channels, each with **sentiment analysis** on every reply/transcript.
4. Make the whole thing idempotent, re-runnable, and safe to re-deploy without duplicating data or double-sending messages.

Do not ask me to re-explain the business logic below — it is complete. Where a specific third-party credential/provider isn't explicitly named, use sensible defaults (stated below), but **first inspect what n8n credentials/nodes already exist in the connected n8n instance via MCP** and prefer those over introducing a new provider.

---

## 0. NON-NEGOTIABLE CONSTRAINTS

- Database = **Supabase** (Postgres). All schema objects must be plain SQL, Supabase-compatible (uuid-ossp/pgcrypto extensions, RLS enabled, service-role bypass for n8n).
- Voice calling = **Vapi**, using n8n's Vapi node or Vapi's HTTP API if the native node is unavailable.
- All workflows must be created **inside this exact n8n folder** using the n8n MCP tools — do not create them elsewhere:
  `https://n8n.srv1010832.hstgr.cloud/projects/zrr65yvweMGZGo16/folders/FaBZk1PS0ipgZHxy/workflows`
- Every workflow name must be prefixed `RRS -` (e.g. `RRS - Day 7 Reminder`) and tagged `receivables-recovery` so they're identifiable as a set.
- No hardcoded secrets in workflow JSON — use n8n credentials/environment variables only.
- Every outbound message and every inbound reply/call must be logged to Supabase — nothing happens silently.
- The system must never double-send a reminder for the same invoice/stage/channel — use the `reminder_sequences` table (unique constraint) as the source of truth, not workflow memory.
- Once an invoice's `outstanding_amount` reaches 0, all pending reminders for that invoice must be cancelled automatically.

---

## 1. SYSTEM OVERVIEW (for your own context while building)

**21-Day Automated Recovery Workflow:**

| Day | Trigger | Channel(s) | Tone |
|---|---|---|---|
| Day 0 | Invoice generated | Email + WhatsApp, with payment link | Neutral/informative |
| Day 7 | Reminder 1 | WhatsApp | Friendly nudge |
| Day 14 | Reminder 2 | Email | Formal, outstanding amount + payment options |
| Day 21 | Reminder 3 | WhatsApp + Email | Urgent, overdue notice + penalty clause |
| Day 30 | Escalation | AI Voice call (Vapi) — **only for high-value overdue accounts** — flagged for founder review | Escalation |

Additional always-on capabilities:
- Centralized retailer ledger with real-time outstanding balance.
- Sentiment analysis on every WhatsApp reply, email reply, and voice call transcript.
- Collections dashboard data (recovery rate, overdue buckets, payment history) served entirely from Supabase views — the frontend already queries Supabase directly, so your job is to make sure the views/tables exist and stay accurate.

---

## 2. PHASE 1 — SUPABASE DATABASE LAYER

Create a `/database/sql/` folder in the project with these files, in this exact order (they must run cleanly top to bottom in the Supabase SQL editor):

```
00_extensions.sql
01_enums.sql
02_retailers.sql
03_invoices.sql
04_payments.sql
05_message_logs.sql
06_activity_and_escalations.sql
07_message_templates.sql
08_reminder_sequences.sql
09_triggers_and_functions.sql
10_views.sql
11_rls_policies.sql
12_seed_templates.sql
```

Use the schema below as the baseline — refine types/constraints if you spot a gap, but do not remove the sentiment/intent columns or the anti-double-send unique constraint.

### 00_extensions.sql
```sql
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
```

### 01_enums.sql
```sql
create type invoice_status as enum (
  'draft','sent','partially_paid','paid','overdue','escalated','written_off','disputed'
);
create type channel_type as enum ('whatsapp','email','voice','system');
create type reminder_stage as enum ('day_0','day_7','day_14','day_21','day_30');
create type message_status as enum ('pending','sent','delivered','read','replied','failed','skipped','cancelled');
create type sentiment_label as enum ('positive','neutral','negative','urgent_negative');
create type call_outcome as enum (
  'promise_to_pay','dispute','no_answer','wrong_number','refused',
  'callback_requested','paid_already','voicemail','not_reachable'
);
create type intent_label as enum (
  'promise_to_pay','dispute','request_extension','ignored',
  'paid_already','wrong_number','asking_details','threat_legal','other'
);
```

### 02_retailers.sql
```sql
create table retailers (
  id uuid primary key default gen_random_uuid(),
  retailer_code text unique,
  business_name text not null,
  contact_person text,
  phone text not null,
  whatsapp_number text,
  email text,
  billing_address text,
  gstin text,
  credit_limit numeric(14,2) default 0,
  payment_terms_days int default 30,
  relationship_manager text,
  risk_score numeric(5,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_retailers_active on retailers(is_active);
```

### 03_invoices.sql
```sql
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  retailer_id uuid not null references retailers(id) on delete restrict,
  invoice_date date not null default current_date,
  due_date date not null,
  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null,
  amount_paid numeric(14,2) not null default 0,
  outstanding_amount numeric(14,2) generated always as (total_amount - amount_paid) stored,
  currency text default 'INR',
  status invoice_status not null default 'draft',
  payment_link text,
  payment_link_id text,
  pdf_url text,
  penalty_percent numeric(5,2) default 2.0,
  penalty_applied numeric(14,2) default 0,
  last_reminder_stage reminder_stage,
  founder_review_flag boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_invoices_retailer on invoices(retailer_id);
create index idx_invoices_status on invoices(status);
create index idx_invoices_due_date on invoices(due_date);

create or replace function days_since_invoice(inv invoices) returns int as $$
  select (current_date - inv.invoice_date)::int;
$$ language sql stable;
```

### 04_payments.sql
```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  retailer_id uuid not null references retailers(id),
  amount numeric(14,2) not null,
  payment_method text,
  payment_gateway text,
  gateway_payment_id text,
  gateway_order_id text,
  gateway_response jsonb,
  payment_date timestamptz default now(),
  created_at timestamptz default now()
);
create index idx_payments_invoice on payments(invoice_id);
```

### 05_message_logs.sql
```sql
create table whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete set null,
  retailer_id uuid references retailers(id),
  direction text check (direction in ('outbound','inbound')) not null,
  reminder_stage reminder_stage,
  message_body text,
  template_name text,
  whatsapp_message_id text,
  status message_status default 'pending',
  sentiment sentiment_label,
  sentiment_score numeric(5,2),
  intent intent_label,
  sentiment_summary text,
  raw_payload jsonb,
  created_at timestamptz default now()
);
create index idx_whatsapp_invoice on whatsapp_logs(invoice_id);

create table email_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete set null,
  retailer_id uuid references retailers(id),
  direction text check (direction in ('outbound','inbound')) not null,
  reminder_stage reminder_stage,
  subject text,
  body text,
  email_message_id text,
  status message_status default 'pending',
  sentiment sentiment_label,
  sentiment_score numeric(5,2),
  intent intent_label,
  sentiment_summary text,
  raw_payload jsonb,
  created_at timestamptz default now()
);
create index idx_email_invoice on email_logs(invoice_id);

create table voice_call_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete set null,
  retailer_id uuid references retailers(id),
  vapi_call_id text,
  call_status text,
  call_duration_seconds int,
  recording_url text,
  transcript text,
  call_outcome call_outcome,
  sentiment sentiment_label,
  sentiment_score numeric(5,2),
  sentiment_summary text,
  structured_data jsonb,
  founder_review_flag boolean default true,
  founder_reviewed boolean default false,
  founder_notes text,
  raw_payload jsonb,
  created_at timestamptz default now()
);
create index idx_voice_invoice on voice_call_logs(invoice_id);
```

### 06_activity_and_escalations.sql
```sql
create table collection_activities (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  retailer_id uuid references retailers(id),
  channel channel_type not null,
  reminder_stage reminder_stage,
  activity_type text not null,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);
create index idx_activity_invoice on collection_activities(invoice_id);

create table escalations (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  retailer_id uuid references retailers(id),
  escalation_date timestamptz default now(),
  reason text,
  escalated_to text default 'founder',
  status text default 'open',
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);
```

### 07_message_templates.sql
```sql
create table message_templates (
  id uuid primary key default gen_random_uuid(),
  channel channel_type not null,
  reminder_stage reminder_stage not null,
  tone text,
  subject text,
  body_template text not null,
  variables text[],
  is_active boolean default true,
  created_at timestamptz default now()
);
```

### 08_reminder_sequences.sql
```sql
create table reminder_sequences (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  retailer_id uuid not null references retailers(id),
  reminder_stage reminder_stage not null,
  channel channel_type not null,
  scheduled_date date not null,
  status message_status default 'pending',
  executed_at timestamptz,
  n8n_execution_id text,
  created_at timestamptz default now(),
  unique(invoice_id, reminder_stage, channel)
);
create index idx_reminder_lookup on reminder_sequences(scheduled_date, status);
```
This table is the **anti-duplicate guard**. Every n8n workflow that sends a reminder must first try to `insert ... on conflict (invoice_id, reminder_stage, channel) do nothing` a `pending` row, check it actually inserted, and only then send. If the insert conflicts, skip sending — it already happened.

### 09_triggers_and_functions.sql
```sql
create or replace function update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_retailers_updated before update on retailers
for each row execute function update_updated_at();

create trigger trg_invoices_updated before update on invoices
for each row execute function update_updated_at();

-- Apply a payment: update invoice, flip status, log activity, cancel remaining reminders if fully paid
create or replace function apply_payment() returns trigger as $$
begin
  update invoices
  set amount_paid = amount_paid + new.amount
  where id = new.invoice_id;

  update invoices
  set status = case
    when outstanding_amount <= 0 then 'paid'
    when outstanding_amount > 0 and amount_paid > 0 then 'partially_paid'
    else status
  end
  where id = new.invoice_id;

  update reminder_sequences
  set status = 'cancelled'
  where invoice_id = new.invoice_id
    and status = 'pending'
    and exists (
      select 1 from invoices where id = new.invoice_id and outstanding_amount <= 0
    );

  insert into collection_activities (invoice_id, retailer_id, channel, activity_type, description, metadata)
  values (new.invoice_id, new.retailer_id, 'system', 'payment_received',
    'Payment of ' || new.amount || ' received', jsonb_build_object('payment_id', new.id));

  return new;
end;
$$ language plpgsql;

create trigger trg_apply_payment after insert on payments
for each row execute function apply_payment();

-- Called daily by n8n (or pg_cron if enabled) to flip overdue status
create or replace function refresh_overdue_status() returns void as $$
begin
  update invoices
  set status = 'overdue'
  where status in ('sent','partially_paid')
    and due_date < current_date
    and outstanding_amount > 0;
end;
$$ language plpgsql;

-- Auto-log activity on every message insert
create or replace function log_whatsapp_activity() returns trigger as $$
begin
  insert into collection_activities(invoice_id, retailer_id, channel, reminder_stage, activity_type, description, metadata)
  values (new.invoice_id, new.retailer_id, 'whatsapp', new.reminder_stage,
    case when new.direction = 'outbound' then 'whatsapp_sent' else 'whatsapp_received' end,
    left(coalesce(new.message_body,''), 200),
    jsonb_build_object('status', new.status, 'sentiment', new.sentiment));
  return new;
end;
$$ language plpgsql;
create trigger trg_log_whatsapp after insert on whatsapp_logs
for each row execute function log_whatsapp_activity();

create or replace function log_email_activity() returns trigger as $$
begin
  insert into collection_activities(invoice_id, retailer_id, channel, reminder_stage, activity_type, description, metadata)
  values (new.invoice_id, new.retailer_id, 'email', new.reminder_stage,
    case when new.direction = 'outbound' then 'email_sent' else 'email_received' end,
    left(coalesce(new.subject,''), 200),
    jsonb_build_object('status', new.status, 'sentiment', new.sentiment));
  return new;
end;
$$ language plpgsql;
create trigger trg_log_email after insert on email_logs
for each row execute function log_email_activity();

create or replace function log_voice_activity() returns trigger as $$
begin
  insert into collection_activities(invoice_id, retailer_id, channel, reminder_stage, activity_type, description, metadata)
  values (new.invoice_id, new.retailer_id, 'voice', 'day_30', 'voice_call',
    coalesce(new.call_outcome::text,'initiated'),
    jsonb_build_object('call_status', new.call_status, 'sentiment', new.sentiment));
  return new;
end;
$$ language plpgsql;
create trigger trg_log_voice after insert on voice_call_logs
for each row execute function log_voice_activity();
```

### 10_views.sql
```sql
create or replace view v_outstanding_summary as
select
  r.id as retailer_id,
  r.business_name,
  count(i.id) filter (where i.outstanding_amount > 0) as open_invoices,
  coalesce(sum(i.outstanding_amount) filter (where i.outstanding_amount > 0), 0) as total_outstanding,
  coalesce(sum(i.total_amount), 0) as total_billed,
  coalesce(sum(i.amount_paid), 0) as total_collected
from retailers r
left join invoices i on i.retailer_id = r.id
group by r.id, r.business_name;

create or replace view v_overdue_buckets as
select
  i.id as invoice_id,
  i.retailer_id,
  i.invoice_number,
  i.outstanding_amount,
  (current_date - i.due_date) as days_overdue,
  case
    when current_date - i.due_date <= 0 then 'not_due'
    when current_date - i.due_date between 1 and 7 then '1-7'
    when current_date - i.due_date between 8 and 14 then '8-14'
    when current_date - i.due_date between 15 and 21 then '15-21'
    when current_date - i.due_date between 22 and 30 then '22-30'
    else '30+'
  end as bucket
from invoices i
where i.outstanding_amount > 0;

create or replace view v_recovery_rate as
select
  date_trunc('month', i.invoice_date) as month,
  sum(i.total_amount) as billed,
  sum(i.amount_paid) as collected,
  round(sum(i.amount_paid) / nullif(sum(i.total_amount),0) * 100, 2) as recovery_rate_pct
from invoices i
group by 1
order by 1 desc;

create or replace view v_sentiment_overview as
select 'whatsapp' as channel, sentiment, count(*) as total from whatsapp_logs where direction = 'inbound' group by sentiment
union all
select 'email', sentiment, count(*) from email_logs where direction = 'inbound' group by sentiment
union all
select 'voice', sentiment, count(*) from voice_call_logs group by sentiment;

create or replace view v_pending_reminders_today as
select rs.*, i.invoice_number, i.outstanding_amount, r.business_name, r.phone, r.email, r.whatsapp_number
from reminder_sequences rs
join invoices i on i.id = rs.invoice_id
join retailers r on r.id = rs.retailer_id
where rs.status = 'pending' and rs.scheduled_date <= current_date and i.outstanding_amount > 0;
```

### 11_rls_policies.sql
```sql
alter table retailers enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table whatsapp_logs enable row level security;
alter table email_logs enable row level security;
alter table voice_call_logs enable row level security;
alter table collection_activities enable row level security;
alter table escalations enable row level security;
alter table reminder_sequences enable row level security;
alter table message_templates enable row level security;

-- Repeat this pattern for EVERY table above (service role = n8n, authenticated = dashboard read):
create policy "service_role_full_access_retailers" on retailers for all using (auth.role() = 'service_role');
create policy "authenticated_read_retailers" on retailers for select using (auth.role() = 'authenticated');

create policy "service_role_full_access_invoices" on invoices for all using (auth.role() = 'service_role');
create policy "authenticated_read_invoices" on invoices for select using (auth.role() = 'authenticated');

-- ...replicate for payments, whatsapp_logs, email_logs, voice_call_logs,
--    collection_activities, escalations, reminder_sequences, message_templates.
-- If the dashboard writes anything directly (e.g. manual "mark as paid"), add
-- a scoped authenticated INSERT/UPDATE policy for that specific table only.
```

### 12_seed_templates.sql
Seed `message_templates` with the Day 0/7/14/21 copy from Section 4 below (one row per channel/stage combination). Use `{{retailer_name}}`, `{{invoice_number}}`, `{{outstanding_amount}}`, `{{due_date}}`, `{{payment_link}}` as the variable placeholders — n8n will do the substitution at send time.

---

## 3. PHASE 2 — N8N WORKFLOWS

Build these as **separate, linked workflows** inside the specified folder, using `Execute Workflow` nodes to chain them where noted. Use the **Supabase node** (or HTTP Request against the Supabase REST/RPC endpoint if the native node is limited) for all DB reads/writes. Use an **LLM node** (Anthropic/OpenAI — whichever credential already exists in the instance) for sentiment/intent classification everywhere it's needed.

### WF-1: `RRS - Master Scheduler`
- **Trigger:** Cron, once daily (e.g. 09:00 IST).
- **Logic:**
  1. Call `refresh_overdue_status()` via Supabase RPC.
  2. Compute `days_since_invoice` for every open invoice (`outstanding_amount > 0`), and for each one that lands exactly on 7 / 14 / 21 / 30 days since `invoice_date`, upsert a row into `reminder_sequences` (`status = 'pending'`, `scheduled_date = today`) for the correct channel(s), using `on conflict do nothing` so re-runs are safe.
  3. Query `v_pending_reminders_today`.
  4. For each row, branch by `reminder_stage` (Switch node) and call the matching sub-workflow via `Execute Workflow`: WF-3 (day_7), WF-4 (day_14), WF-5 (day_21), WF-6 (day_30).
- **Idempotency:** the `reminder_sequences` unique constraint is the safety net — even if this workflow runs twice in a day, step 4 only ever processes rows still `pending`.

### WF-2: `RRS - Invoice Generated (Day 0)`
- **Trigger:** Webhook, called by the frontend/dashboard when a new invoice is created (or a Postgres trigger via Supabase Database Webhook on `insert` into `invoices`).
- **Logic:**
  1. Receive invoice payload (or fetch by `invoice_id`).
  2. Generate a payment link (Razorpay Payment Links API by default — swap for whatever gateway is actually connected) and `update` the invoice row with `payment_link` / `payment_link_id`.
  3. Render the Day-0 email template (Section 4) and send via Email node (SMTP/SendGrid). Insert into `email_logs` (`direction='outbound'`, `reminder_stage='day_0'`).
  4. Render the Day-0 WhatsApp template and send via WhatsApp Business Cloud API node/HTTP request. Insert into `whatsapp_logs` (`direction='outbound'`, `reminder_stage='day_0'`).
  5. Update `invoices.status = 'sent'`, `last_reminder_stage = 'day_0'`.

### WF-3: `RRS - Day 7 Reminder (WhatsApp)`
- **Trigger:** Called by WF-1.
- **Logic:** Friendly nudge WhatsApp message with invoice summary + due date → send → log to `whatsapp_logs` → mark `reminder_sequences` row `sent`, `executed_at = now()`.

### WF-4: `RRS - Day 14 Reminder (Email)`
- **Trigger:** Called by WF-1.
- **Logic:** Formal email with outstanding amount + payment options → send → log to `email_logs` → mark sequence row `sent`.

### WF-5: `RRS - Day 21 Reminder (WhatsApp + Email)`
- **Trigger:** Called by WF-1.
- **Logic:** Urgent WhatsApp AND urgent email, both including the overdue notice + penalty clause. Before sending, compute `penalty_applied = outstanding_amount * penalty_percent / 100` and update the invoice with that figure so it displays in the message and on the dashboard. Log both channels, mark both sequence rows `sent`. Set `invoices.founder_review_flag = true`.

### WF-6: `RRS - Day 30 Escalation (Vapi Voice Call)`
- **Trigger:** Called by WF-1.
- **Logic:**
  1. Filter: only proceed if `outstanding_amount >= <high_value_threshold>` (make this a workflow variable, default ₹50,000 — confirm/adjust with the user if a real threshold exists elsewhere in the product).
  2. If below threshold, log a `collection_activities` row `"below escalation threshold — skipped voice call"` and mark the sequence row `skipped` instead of calling Vapi.
  3. If above threshold: call Vapi's `POST /call` (or the n8n Vapi node) with the assistant ID, the retailer's phone number, and `assistantOverrides.variableValues` containing `retailer_name`, `invoice_number`, `outstanding_amount`, `due_date`, `days_overdue` — see Section 5 for the assistant's system prompt.
  4. Insert a row into `voice_call_logs` with `call_status='initiated'`, `founder_review_flag=true`.
  5. Insert an `escalations` row (`reason='Day 30 non-payment, AI voice call placed'`).
  6. Update `invoices.status = 'escalated'`, mark sequence row `sent`.

### WF-7: `RRS - Vapi Call Webhook (End of Call Report)`
- **Trigger:** Webhook, configured as Vapi's `serverUrl` for end-of-call-report events.
- **Logic:**
  1. Match the incoming `call.id` to the `voice_call_logs.vapi_call_id` row.
  2. Extract transcript, recording URL, duration, ended reason.
  3. Run the transcript through the LLM sentiment/intent node (schema in Section 4) to get `sentiment`, `sentiment_score`, `call_outcome`, `sentiment_summary`, `structured_data` (e.g. promised payment date if mentioned).
  4. Update the `voice_call_logs` row with all of the above.
  5. If `call_outcome IN ('dispute','refused')` or `sentiment = 'urgent_negative'`, send an immediate notification to the founder (WhatsApp/Email/Slack — use whatever's connected) with a summary and a link to the recording.
  6. If `call_outcome = 'promise_to_pay'` and a date was extracted, insert a `collection_activities` note so the dashboard timeline shows the promised date.

### WF-8: `RRS - WhatsApp Inbound Webhook`
- **Trigger:** Webhook (Meta WhatsApp Cloud API inbound message webhook).
- **Logic:**
  1. Parse sender phone number → match to `retailers.whatsapp_number` → find their most recent open `invoice_id`.
  2. Run message text through the sentiment/intent LLM node.
  3. Insert into `whatsapp_logs` (`direction='inbound'`) with sentiment/intent populated.
  4. If `intent = 'paid_already'`, flag the invoice `founder_review_flag=true` for manual payment verification (do not auto-mark paid without proof).
  5. If `sentiment IN ('negative','urgent_negative')` or `intent = 'dispute'`, notify the founder immediately.

### WF-9: `RRS - Email Inbound Webhook`
- **Trigger:** Webhook (SendGrid Inbound Parse) or IMAP trigger node, depending on what's connected.
- **Logic:** Mirror of WF-8 for email — match by sender address, sentiment-classify, log to `email_logs`, flag/notify as appropriate.

### WF-10: `RRS - Payment Webhook`
- **Trigger:** Webhook from the payment gateway (e.g. Razorpay `payment.captured` event).
- **Logic:**
  1. Verify webhook signature.
  2. Match `gateway_order_id`/`payment_link_id` to the invoice.
  3. Insert into `payments` (this alone triggers `apply_payment()` in Postgres, which updates the invoice, cancels remaining reminders, and logs the activity — do not duplicate that logic in n8n).
  4. Send a short thank-you WhatsApp/email confirmation to the retailer.

### WF-11: `RRS - Founder Notification Helper` (optional shared sub-workflow)
- A small reusable workflow (called by WF-6/7/8/9) that takes `{title, body, invoice_id, severity}` and routes it to whichever channel the founder prefers (WhatsApp/Email/Slack) — avoids repeating notification logic in every workflow.

Build order for WF-1 → WF-11: **schema first, then WF-2, WF-3–6 (in sequence, they share the template-rendering pattern), then WF-1 (scheduler, since it depends on the sub-workflows existing), then WF-7/8/9 (inbound + sentiment), then WF-10 (payments), then WF-11.**

---

## 4. SENTIMENT & INTENT ANALYSIS ENGINE

Use one consistent LLM prompt/schema across WhatsApp replies, email replies, and voice transcripts so `v_sentiment_overview` stays comparable across channels.

**System prompt for the sentiment node:**
```
You are a collections sentiment classifier for a B2B retailer payments system.
Given a message (WhatsApp/email reply) or a call transcript, classify it and
return ONLY valid JSON, no prose, no markdown fences, matching exactly:

{
  "sentiment": "positive" | "neutral" | "negative" | "urgent_negative",
  "sentiment_score": <float 0.0-1.0, confidence in the sentiment label>,
  "intent": "promise_to_pay" | "dispute" | "request_extension" | "ignored" |
            "paid_already" | "wrong_number" | "asking_details" |
            "threat_legal" | "other",
  "summary": "<one sentence, plain language, max 25 words>",
  "promised_payment_date": "<ISO date if explicitly mentioned, else null>",
  "risk_flag": <true if this needs immediate human attention, else false>
}

Rules:
- "urgent_negative" = hostile, threatening legal action, or explicit refusal to pay.
- "negative" = frustrated/annoyed but not hostile.
- Never invent a promised_payment_date — only extract it if stated.
- risk_flag = true whenever intent is "dispute", "threat_legal", or sentiment is "urgent_negative".
```
Feed the retailer's message/transcript as the user turn. Parse the JSON response and map it directly onto the `sentiment`, `sentiment_score`, `intent`, `sentiment_summary` (from `summary`), and `structured_data` (store the full JSON) columns.

---

## 5. VAPI VOICE AGENT CONFIGURATION

Configure (or update) the Vapi assistant used for Day-30 escalation calls with a system prompt along these lines:

```
You are calling on behalf of [Business Name] regarding an overdue payment.
You are speaking with {{retailer_name}} about invoice {{invoice_number}},
outstanding amount {{outstanding_amount}}, originally due {{due_date}}
({{days_overdue}} days overdue).

Goals, in priority order:
1. Confirm you're speaking with the right person/business.
2. Politely but clearly state the outstanding amount and how overdue it is.
3. Ask when payment can be made. If they commit to a date, repeat it back
   to confirm.
4. If they dispute the amount, do not argue — acknowledge, tell them a
   team member will follow up with details, and end the call politely.
5. If they refuse to pay or become hostile, remain calm, do not threaten
   anything beyond what you're told, and end the call.
6. Keep the call under 3 minutes. Be respectful — this is an ongoing
   business relationship, not a one-off collection.

Never invent payment terms, discounts, or legal threats that weren't
explicitly provided to you.
```
- Set `serverUrl` (end-of-call webhook) to WF-7's webhook URL.
- Request Vapi's structured data extraction (or rely on WF-7's own LLM pass) for: `call_outcome`, `promised_date`, `dispute_reason`.
- Pass `retailer_name`, `invoice_number`, `outstanding_amount`, `due_date`, `days_overdue` as `assistantOverrides.variableValues` from WF-6.

---

## 6. MESSAGE TEMPLATES (seed these into `message_templates`)

**Day 0 — Email (Neutral):** Subject: `Invoice {{invoice_number}} from [Business Name]`. Body: invoice attached/linked, due date, total amount, payment link.

**Day 0 — WhatsApp (Neutral):** `Hi {{retailer_name}}, your invoice {{invoice_number}} for {{outstanding_amount}} is ready. Due date: {{due_date}}. Pay here: {{payment_link}}`

**Day 7 — WhatsApp (Friendly nudge):** `Hi {{retailer_name}}, just a friendly reminder — invoice {{invoice_number}} ({{outstanding_amount}}) is due on {{due_date}}. Let us know if you need anything. Pay here: {{payment_link}}`

**Day 14 — Email (Formal):** Subject: `Payment Reminder: Invoice {{invoice_number}} Outstanding`. Body: states outstanding amount, original due date, lists payment options (link, bank transfer, UPI), asks for expected payment date.

**Day 21 — WhatsApp (Urgent):** `{{retailer_name}}, invoice {{invoice_number}} ({{outstanding_amount}}) is now significantly overdue (due {{due_date}}). A {{penalty_percent}}% late fee applies to overdue balances. Please settle immediately: {{payment_link}}`

**Day 21 — Email (Urgent + penalty clause):** Subject: `URGENT: Invoice {{invoice_number}} Overdue — Action Required`. Body: overdue notice, states the penalty clause and the computed `penalty_applied` amount, payment link, notes escalation will follow on Day 30 if unresolved.

Claude Code: write the full copy for each of these into `12_seed_templates.sql` as INSERT statements, keeping the tone progression (neutral → friendly → formal → urgent) exactly as described.

---

## 7. CREDENTIALS / ENVIRONMENT VARIABLES CHECKLIST

Before building, check what's already configured as n8n credentials via MCP. You'll need:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `VAPI_API_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` (or the Twilio/Gupshup/Interakt equivalent if that's what's actually connected)
- Email provider credential (SMTP or SendGrid API key)
- Payment gateway keys (Razorpay `key_id`/`key_secret`, or Stripe equivalent)
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` for the sentiment node
- Founder notification target (WhatsApp number / email / Slack webhook)
- `ESCALATION_VALUE_THRESHOLD` (default 50000, confirm real number with the user)

If any of these providers differ from the defaults assumed above (e.g. Twilio instead of Meta Cloud API for WhatsApp, or Stripe instead of Razorpay), adapt the relevant nodes accordingly — the workflow *logic* stays identical, only the specific node/API changes.

---

## 8. BUILD ORDER

1. Generate all files in `/database/sql/` per Section 2. Do not execute them yourself — the user will paste them into the Supabase SQL editor. Tell them the exact paste order if it isn't obvious from the filenames.
2. Confirm/inspect existing n8n credentials via MCP.
3. Build WF-2 (Day 0) and test it against one manually inserted invoice row.
4. Build WF-3, WF-4, WF-5, WF-6 (the four reminder/escalation sub-workflows).
5. Build WF-1 (Master Scheduler) last among the outbound flows, since it depends on 3–6 existing.
6. Build WF-7, WF-8, WF-9 (inbound + sentiment).
7. Build WF-10 (payment webhook) and confirm it correctly cancels pending reminders on full payment.
8. Build WF-11 (founder notifications) and wire it into WF-6/7/8/9.
9. Do a full dry run: insert a test retailer + invoice with `invoice_date` backdated to simulate Day 7/14/21/30, run WF-1 manually, confirm each stage fires once and only once, confirm sentiment fields populate on a test inbound message, confirm a test payment cancels remaining reminders.

---

## 9. TESTING & VALIDATION CHECKLIST

- [ ] Re-running WF-1 twice in the same day sends zero duplicate messages.
- [ ] A fully paid invoice has all its `pending` `reminder_sequences` rows flipped to `cancelled`.
- [ ] `v_overdue_buckets`, `v_recovery_rate`, `v_outstanding_summary`, `v_sentiment_overview` all return sane data against test rows.
- [ ] A Day-30 call below the value threshold is skipped, not called.
- [ ] A Vapi call webhook correctly updates the matching `voice_call_logs` row (not a mismatched one).
- [ ] RLS: an `authenticated` role can `select` from the dashboard-facing tables/views but cannot write; `service_role` (n8n) can do everything.
- [ ] Every outbound send has a corresponding `collection_activities` row (via the triggers).

---

## 10. ASSUMPTIONS TO CONFIRM WITH THE USER WHILE BUILDING

- WhatsApp provider (Meta Cloud API assumed — confirm).
- Email provider (SMTP/SendGrid assumed — confirm).
- Payment gateway (Razorpay assumed — confirm, since retailers appear India-based).
- The exact high-value threshold for triggering a Day-30 voice call.
- Who "founder" notifications should actually go to (number/email/Slack channel).
- Whether the frontend writes to Supabase directly for anything (e.g. manual invoice creation, manual "mark as paid") — if so, RLS policies in `11_rls_policies.sql` need a scoped write policy for that specific action, not just read-only.

---

**End of prompt. Build exactly as specified above, ask only about the items in Section 10 if they aren't already obvious from the existing frontend/dashboard code, and report back with a summary of every file created and every workflow ID created in n8n.**