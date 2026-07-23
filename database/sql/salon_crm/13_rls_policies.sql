-- =============================================================
-- 13_rls_policies.sql
-- Row Level Security — service_role (n8n) = full access,
-- authenticated (dashboard) = read only, plus scoped writes
-- for specific dashboard actions that go through RPC.
-- Run after 12_views.sql.
-- =============================================================

-- Enable RLS on every table
alter table reps                enable row level security;
alter table salons              enable row level security;
alter table salon_stage_history enable row level security;
alter table whatsapp_logs       enable row level security;
alter table email_logs          enable row level security;
alter table samples             enable row level security;
alter table meetings            enable row level security;
alter table deals               enable row level security;
alter table active_accounts     enable row level security;
alter table sales_activities    enable row level security;
alter table outreach_sequences  enable row level security;
alter table message_templates   enable row level security;

-- -------------------------------------------------------
-- REPS
-- -------------------------------------------------------
create policy "service_role_full_access_reps"
  on reps for all using (auth.role() = 'service_role');

create policy "authenticated_read_reps"
  on reps for select using (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- SALONS
-- -------------------------------------------------------
create policy "service_role_full_access_salons"
  on salons for all using (auth.role() = 'service_role');

create policy "authenticated_read_salons"
  on salons for select using (auth.role() = 'authenticated');

-- Dashboard may update notes field only (not current_stage directly)
create policy "authenticated_update_salon_notes"
  on salons for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- SALON_STAGE_HISTORY (append-only — no update/delete for anyone)
-- -------------------------------------------------------
create policy "service_role_full_access_stage_history"
  on salon_stage_history for all using (auth.role() = 'service_role');

create policy "authenticated_read_stage_history"
  on salon_stage_history for select using (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- WHATSAPP_LOGS
-- -------------------------------------------------------
create policy "service_role_full_access_whatsapp_logs"
  on whatsapp_logs for all using (auth.role() = 'service_role');

create policy "authenticated_read_whatsapp_logs"
  on whatsapp_logs for select using (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- EMAIL_LOGS
-- -------------------------------------------------------
create policy "service_role_full_access_email_logs"
  on email_logs for all using (auth.role() = 'service_role');

create policy "authenticated_read_email_logs"
  on email_logs for select using (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- SAMPLES
-- -------------------------------------------------------
create policy "service_role_full_access_samples"
  on samples for all using (auth.role() = 'service_role');

create policy "authenticated_read_samples"
  on samples for select using (auth.role() = 'authenticated');

-- Reps can update feedback notes and status in dashboard
create policy "authenticated_update_samples"
  on samples for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- MEETINGS
-- -------------------------------------------------------
create policy "service_role_full_access_meetings"
  on meetings for all using (auth.role() = 'service_role');

create policy "authenticated_read_meetings"
  on meetings for select using (auth.role() = 'authenticated');

-- Reps can insert meetings from dashboard
create policy "authenticated_insert_meetings"
  on meetings for insert
  with check (auth.role() = 'authenticated');

-- Reps can update meeting outcome
create policy "authenticated_update_meetings"
  on meetings for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- DEALS
-- -------------------------------------------------------
create policy "service_role_full_access_deals"
  on deals for all using (auth.role() = 'service_role');

create policy "authenticated_read_deals"
  on deals for select using (auth.role() = 'authenticated');

-- Reps can insert and update deals (pricing, lost reason, etc.)
create policy "authenticated_insert_deals"
  on deals for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated_update_deals"
  on deals for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- ACTIVE_ACCOUNTS (created by trigger — no dashboard writes needed)
-- -------------------------------------------------------
create policy "service_role_full_access_active_accounts"
  on active_accounts for all using (auth.role() = 'service_role');

create policy "authenticated_read_active_accounts"
  on active_accounts for select using (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- SALES_ACTIVITIES
-- -------------------------------------------------------
create policy "service_role_full_access_activities"
  on sales_activities for all using (auth.role() = 'service_role');

create policy "authenticated_read_activities"
  on sales_activities for select using (auth.role() = 'authenticated');

-- Reps can log manual activities (calls, notes) from dashboard
create policy "authenticated_insert_activities"
  on sales_activities for insert
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- OUTREACH_SEQUENCES
-- -------------------------------------------------------
create policy "service_role_full_access_outreach"
  on outreach_sequences for all using (auth.role() = 'service_role');

create policy "authenticated_read_outreach"
  on outreach_sequences for select using (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- MESSAGE_TEMPLATES
-- -------------------------------------------------------
create policy "service_role_full_access_templates"
  on message_templates for all using (auth.role() = 'service_role');

create policy "authenticated_read_templates"
  on message_templates for select using (auth.role() = 'authenticated');

-- Admins can update template copy from dashboard
create policy "authenticated_update_templates"
  on message_templates for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =============================================================
-- IMPORTANT: Stage transitions MUST go through change_salon_stage()
-- RPC, NEVER via a direct UPDATE on salons.current_stage.
-- Grant EXECUTE on the RPC to authenticated role:
-- =============================================================
grant execute on function change_salon_stage(uuid, funnel_stage, text, text)
  to authenticated;

grant execute on function assign_rep_round_robin(text)
  to service_role;

grant execute on function schedule_outreach_for_salon(uuid, boolean, boolean)
  to service_role;
