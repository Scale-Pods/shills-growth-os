-- =============================================================
-- 11_triggers_and_functions.sql
-- All triggers and stored functions. Run after 10_outreach_sequences.sql.
-- =============================================================

-- -------------------------------------------------------
-- Generic updated_at trigger function
-- -------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_salons_updated
  before update on salons
  for each row execute function update_updated_at();

create trigger trg_reps_updated
  before update on reps
  for each row execute function update_updated_at();

create trigger trg_deals_updated
  before update on deals
  for each row execute function update_updated_at();

create trigger trg_samples_updated
  before update on samples
  for each row execute function update_updated_at();

create trigger trg_meetings_updated
  before update on meetings
  for each row execute function update_updated_at();

-- -------------------------------------------------------
-- Central stage-change function.
-- ALL n8n workflows MUST call this via RPC, never update
-- salons.current_stage directly. This ensures history +
-- cancellation logic always fires together.
-- -------------------------------------------------------
create or replace function change_salon_stage(
  p_salon_id   uuid,
  p_to_stage   funnel_stage,
  p_changed_by text,
  p_reason     text
)
returns void as $$
declare
  v_from_stage funnel_stage;
begin
  -- Read current stage
  select current_stage into v_from_stage
  from salons
  where id = p_salon_id;

  -- Guard: skip if already at the target stage
  if v_from_stage = p_to_stage then
    return;
  end if;

  -- Update salons
  update salons
  set current_stage = p_to_stage
  where id = p_salon_id;

  -- Append-only history row
  insert into salon_stage_history (salon_id, from_stage, to_stage, changed_by, reason)
  values (p_salon_id, v_from_stage, p_to_stage, p_changed_by, p_reason);

  -- Activity log
  insert into sales_activities (salon_id, channel, activity_type, description, metadata)
  values (
    p_salon_id,
    'system',
    'stage_change',
    coalesce(v_from_stage::text, 'none') || ' -> ' || p_to_stage::text,
    jsonb_build_object('from_stage', v_from_stage, 'to_stage', p_to_stage, 'reason', p_reason, 'changed_by', p_changed_by)
  );

  -- Won or lost: cancel every remaining pending outreach step
  if p_to_stage in ('won', 'lost') then
    update outreach_sequences
    set status = 'cancelled'
    where salon_id = p_salon_id
      and status = 'pending';
  end if;
end;
$$ language plpgsql;

-- -------------------------------------------------------
-- Deal won/lost trigger — auto-creates active_accounts row
-- and calls change_salon_stage() so history always fires.
-- -------------------------------------------------------
create or replace function apply_deal_won()
returns trigger as $$
begin
  if new.stage = 'won' and (old.stage is distinct from 'won') then
    new.won_at = now();

    insert into active_accounts (
      salon_id, deal_id, first_order_value,
      first_order_date, account_manager_id
    )
    values (
      new.salon_id, new.id, new.final_order_value,
      current_date, new.rep_id
    )
    on conflict (salon_id) do nothing;

    perform change_salon_stage(
      new.salon_id, 'won', 'system',
      'Deal marked won — first order placed'
    );
  end if;

  if new.stage = 'lost' and (old.stage is distinct from 'lost') then
    new.lost_at = now();
    perform change_salon_stage(
      new.salon_id, 'lost', 'system',
      coalesce(new.lost_reason, 'Deal marked lost')
    );
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_deal_won
  before update on deals
  for each row execute function apply_deal_won();

-- -------------------------------------------------------
-- Auto-log activity on every WhatsApp insert
-- -------------------------------------------------------
create or replace function log_whatsapp_activity()
returns trigger as $$
begin
  insert into sales_activities(salon_id, channel, activity_type, description, metadata)
  values (
    new.salon_id,
    'whatsapp',
    case when new.direction = 'outbound' then 'whatsapp_sent' else 'whatsapp_received' end,
    left(coalesce(new.message_body, ''), 200),
    jsonb_build_object(
      'status',    new.status,
      'interest',  new.interest,
      'intent',    new.intent,
      'step',      new.outreach_step
    )
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_log_whatsapp
  after insert on whatsapp_logs
  for each row execute function log_whatsapp_activity();

-- -------------------------------------------------------
-- Auto-log activity on every Email insert
-- -------------------------------------------------------
create or replace function log_email_activity()
returns trigger as $$
begin
  insert into sales_activities(salon_id, channel, activity_type, description, metadata)
  values (
    new.salon_id,
    'email',
    case when new.direction = 'outbound' then 'email_sent' else 'email_received' end,
    left(coalesce(new.subject, ''), 200),
    jsonb_build_object(
      'status',   new.status,
      'interest', new.interest,
      'intent',   new.intent,
      'step',     new.outreach_step
    )
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_log_email
  after insert on email_logs
  for each row execute function log_email_activity();

-- -------------------------------------------------------
-- Rep assignment: round-robin within a region.
-- Only returns an active rep with the fewest assigned salons.
-- -------------------------------------------------------
create or replace function assign_rep_round_robin(p_region text)
returns uuid as $$
  select id from reps
  where region = p_region and is_active = true
  order by (
    select count(*) from salons where assigned_rep_id = reps.id
  ) asc, random()
  limit 1;
$$ language sql stable;

-- -------------------------------------------------------
-- Helper: schedule outreach steps for a new salon.
-- Call this right after inserting a new salon to enqueue
-- Day-0 sequences for both channels (where contact exists).
-- -------------------------------------------------------
create or replace function schedule_outreach_for_salon(
  p_salon_id      uuid,
  p_has_whatsapp  boolean,
  p_has_email     boolean
)
returns void as $$
declare
  v_base_date date;
begin
  select created_at::date into v_base_date from salons where id = p_salon_id;

  if p_has_whatsapp then
    insert into outreach_sequences (salon_id, outreach_step, channel, scheduled_date)
    values (p_salon_id, 'day_0',       'whatsapp', v_base_date),
           (p_salon_id, 'day_3',       'whatsapp', v_base_date + 3),
           (p_salon_id, 'day_7',       'whatsapp', v_base_date + 7),
           (p_salon_id, 'day_14_final','whatsapp', v_base_date + 14)
    on conflict (salon_id, outreach_step, channel) do nothing;
  end if;

  if p_has_email then
    insert into outreach_sequences (salon_id, outreach_step, channel, scheduled_date)
    values (p_salon_id, 'day_0',       'email', v_base_date),
           (p_salon_id, 'day_3',       'email', v_base_date + 3),
           (p_salon_id, 'day_7',       'email', v_base_date + 7),
           (p_salon_id, 'day_14_final','email', v_base_date + 14)
    on conflict (salon_id, outreach_step, channel) do nothing;
  end if;
end;
$$ language plpgsql;
