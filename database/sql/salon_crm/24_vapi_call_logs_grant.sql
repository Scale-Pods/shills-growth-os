-- =============================================================
-- 24_vapi_call_logs_grant.sql
-- vapi_call_logs was created directly in Supabase (outside this
-- repo) by the n8n voice pipeline. No privileges were granted on
-- it, so:
--   * the Salon CRM Voice panel gets "permission denied for
--     table vapi_call_logs" on SELECT (it reads server-side with
--     the service_role key, same as fetchSalons); and
--   * the n8n voice pipeline gets the same on INSERT/UPDATE when
--     it writes call rows back.
--
-- This file only fixes privileges + lookup indexes. It does NOT
-- create the table or touch its columns.
--
-- Run after 23_day10_voice_call.sql.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Let the API roles use vapi_call_logs.
--    - service_role: full read + write. The Voice panel reads
--      with it; the n8n pipeline INSERT/UPDATEs call rows with it.
--    - anon / authenticated: read only, so a future public share
--      page or client component can read under RLS without
--      another migration.
-- ---------------------------------------------------------------
grant select, insert, update, delete on table public.vapi_call_logs to service_role;
grant select on table public.vapi_call_logs to anon;
grant select on table public.vapi_call_logs to authenticated;

-- ---------------------------------------------------------------
-- 2. Enable RLS and add a read-only policy so anon/authenticated
--    reads are governed rather than wide open. service_role
--    bypasses RLS, so the server fetch is unaffected either way.
-- ---------------------------------------------------------------
alter table public.vapi_call_logs enable row level security;

drop policy if exists "vapi_call_logs read" on public.vapi_call_logs;
create policy "vapi_call_logs read"
  on public.vapi_call_logs
  for select
  using (true);

-- ---------------------------------------------------------------
-- 3. Index master_leads_id for the per-salon join done by the
--    Voice panel and the Salon CRM dashboard (master_leads_id
--    stores salons.id as text). No-op if the pipeline already
--    created it. (An earlier draft of 23_day10_voice_call.sql
--    referenced a `lead_id` column; the live table names it
--    `master_leads_id`.)
-- ---------------------------------------------------------------
create index if not exists idx_vapi_call_logs_master_leads_id
  on public.vapi_call_logs using btree (master_leads_id);

create index if not exists idx_vapi_call_logs_created_at
  on public.vapi_call_logs using btree (created_at desc);

comment on table public.vapi_call_logs is
  'One row per VAPI voice call from the n8n day_10 pipeline. master_leads_id = salons.id (text). Read by the Salon CRM Voice panel (src/app/salon-crm/voice) via service_role.';
