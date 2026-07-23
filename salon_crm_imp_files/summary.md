supabase pass:Shills@ScalePods

Summary
Database (/database/sql/)
All 12 files written, numbered 00–12, designed to run top-to-bottom in the Supabase SQL editor:
00_extensions.sql → 01_enums.sql → 02_retailers.sql → 03_invoices.sql → 04_payments.sql → 05_message_logs.sql → 06_activity_and_escalations.sql → 07_message_templates.sql → 08_reminder_sequences.sql → 09_triggers_and_functions.sql → 10_views.sql → 11_rls_policies.sql → 12_seed_templates.sql

Key details: reminder_sequences unique constraint is the anti-double-send guard; apply_payment() trigger auto-cancels pending reminders when outstanding_amount hits 0; RLS gives service_role full access and authenticated read-only (plus scoped write policies on voice_call_logs and escalations for dashboard actions).

n8n Workflows (all in folder FaBZk1PS0ipgZHxy, tagged receivables-recovery)
Workflow	ID
RRS - Master Scheduler	49XnLv4kOZlm7LlQ
RRS - Invoice Generated (Day 0)	Vvu8cb1jXByqur8c
RRS - Day 7 Reminder (WhatsApp)	K5m4cQHmgpCyopzi
RRS - Day 14 Reminder (Email)	tzDcEViu2wWlNyod
RRS - Day 21 Reminder (WhatsApp + Email)	TUB6lsU8D9PpLYXo
RRS - Day 30 Escalation (Vapi Voice Call)	J3LEN1Fy1W9M1rLl
RRS - Vapi Call Webhook (End of Call Report)	GkZiXlCDV7h3hQPz
RRS - WhatsApp Inbound Webhook	SoHzJ9qc5CDpJPqX
RRS - Email Inbound Webhook	vxRTnbDjfjp71bV8
RRS - Payment Webhook	pet1gAfUlC7RMNd0
RRS - Founder Notification Helper	MZcsbSkOnYR0eQ4H
Defaults used (per your answers): Meta WhatsApp Cloud API, SMTP email, Razorpay payments, ₹50,000 Day-30 threshold. n8n auto-matched existing Postgres, Anthropic, IMAP, and Amazon SES credentials already in your instance — HTTP Request nodes (WhatsApp, Vapi, Razorpay) still need credentials assigned manually since there's no dedicated node/credential type for those.

Still needs your input before going live
Credentials to attach: Supabase RRS (Postgres conn string), WhatsApp Cloud API RRS (bearer token), Vapi RRS (bearer token + assistant/phone IDs — marked as placeholders in WF-6), Razorpay RRS (basic auth key/secret), founder contact placeholders in WF-11.
WhatsApp phone_number_id is a placeholder literal in WF-2/3/5/11's URL — replace PHONE_NUMBER_ID with your real Meta phone number ID.
Razorpay webhook secret placeholder in WF-10 needs the real value from your Razorpay dashboard.
Run the SQL files in Supabase in the numbered order, then insert one test retailer + invoice and manually execute WF-1 to dry-run the full sequence.
I did not execute the SQL or run any workflow — that's for you to trigger once credentials are in place.