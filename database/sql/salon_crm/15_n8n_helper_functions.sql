-- =============================================================================
-- 15_n8n_helper_functions.sql
-- Helper functions called by n8n workflows.
-- Run AFTER all previous SQL files (00-14) have been applied.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. schedule_outreach_for_salon
-- Called by WF-1 (Lead Discovery) after a new salon is inserted.
-- ---------------------------------------------------------------------------
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
  v_steps   text[] := array['day_0', 'day_3', 'day_7', 'day_14_final'];
  v_delays  int[]  := array[0, 3, 7, 14];
  v_step    text;
  v_delay   int;
  i         int;
begin
  for i in 1 .. array_length(v_steps, 1) loop
    v_step  := v_steps[i];
    v_delay := v_delays[i];

    if p_has_whatsapp then
      insert into outreach_sequences (salon_id, outreach_step, channel, scheduled_date, status)
      values (p_salon_id, v_step, 'whatsapp', (current_date + (v_delay || ' days')::interval)::date, 'pending')
      on conflict (salon_id, outreach_step, channel) do nothing;
    end if;

    if p_has_email then
      insert into outreach_sequences (salon_id, outreach_step, channel, scheduled_date, status)
      values (p_salon_id, v_step, 'email', (current_date + (v_delay || ' days')::interval)::date, 'pending')
      on conflict (salon_id, outreach_step, channel) do nothing;
    end if;

    if not p_has_whatsapp and not p_has_email then
      insert into outreach_sequences (salon_id, outreach_step, channel, scheduled_date, status)
      values (p_salon_id, v_step, 'whatsapp', (current_date + (v_delay || ' days')::interval)::date, 'pending')
      on conflict (salon_id, outreach_step, channel) do nothing;
    end if;
  end loop;
end;
$$;

grant execute on function public.schedule_outreach_for_salon(uuid, boolean, boolean) to service_role;


-- ---------------------------------------------------------------------------
-- 2. assign_rep_round_robin
-- Called by WF-7 / WF-8 when a positive reply is received.
-- ---------------------------------------------------------------------------
create or replace function public.assign_rep_round_robin(
  p_region text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rep_id uuid;
begin
  select r.id
    into v_rep_id
    from reps r
    left join salons s
      on s.assigned_rep_id = r.id
     and s.is_active = true
     and s.current_stage not in ('won', 'lost')
   where r.is_active = true
     and (p_region is null or r.region = p_region)
   group by r.id
   order by count(s.id) asc, random()
   limit 1;

  if v_rep_id is null then
    select r.id into v_rep_id from reps r where r.is_active = true order by random() limit 1;
  end if;

  return v_rep_id;
end;
$$;

grant execute on function public.assign_rep_round_robin(text) to service_role;


-- ---------------------------------------------------------------------------
-- 3. execute_founder_query (read-only wrapper for WF-13 Founder AI)
-- ---------------------------------------------------------------------------
create or replace function public.execute_founder_query(query_sql text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_upper  text;
begin
  v_upper := upper(trim(query_sql));

  if v_upper not like 'SELECT%' then
    raise exception 'Only SELECT statements are allowed.';
  end if;

  if v_upper ~* '\m(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|GRANT|REVOKE|EXECUTE|COPY|CREATE|REPLACE)\M' then
    raise exception 'Forbidden keyword detected in query.';
  end if;

  if v_upper ~* '\m(salons|outreach_sequences|whatsapp_logs|email_logs|sales_activities|deals|samples|meetings|active_accounts|message_templates|reps|users)\M' then
    raise exception 'Direct table access is not allowed. Use v_ views only.';
  end if;

  execute 'select jsonb_agg(row_to_json(t)) from (' || query_sql || ') t' into v_result;
  return coalesce(v_result, '[]'::jsonb);
end;
$$;

grant execute on function public.execute_founder_query(text) to anon, service_role;


-- ---------------------------------------------------------------------------
-- 4. View: v_pending_outreach_today (used by WF-2 Master Scheduler)
-- ---------------------------------------------------------------------------
create or replace view public.v_pending_outreach_today as
select
  os.id,
  os.salon_id,
  os.outreach_step,
  os.channel,
  os.scheduled_date,
  s.salon_name,
  s.region,
  s.city,
  s.whatsapp_number,
  s.email,
  s.current_stage,
  s.assigned_rep_id
from outreach_sequences os
join salons s on s.id = os.salon_id
where os.status = 'pending'
  and os.scheduled_date <= current_date
  and s.is_active = true
  and s.current_stage not in ('won', 'lost');

comment on view public.v_pending_outreach_today is 'All pending outreach sequences due today or overdue. Used by WF-2 Master Scheduler.';
grant select on public.v_pending_outreach_today to service_role;


-- ---------------------------------------------------------------------------
-- NOTE: WF-14 real workflow ID = Qa16H6V53wBx3KmU
-- Update the following n8n nodes manually in the UI:
--   WF-7  (nkWTOev2RAZI0uXK) -> node "Notify Rep (WF-14)"
--   WF-8  (ElZhsxMsKyFNBQHc) -> node "Notify Rep via WF-14"
--   WF-11 (vb83t7M8UYewKF3H) -> node "Notify Rep: Deal Won (WF-14)"
-- ---------------------------------------------------------------------------
