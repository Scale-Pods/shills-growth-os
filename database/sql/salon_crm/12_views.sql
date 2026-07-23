-- =============================================================
-- 12_views.sql
-- Read-only analytics views. The founder AI assistant queries
-- ONLY these views (never raw tables). Run after 11_triggers.
-- =============================================================

-- -------------------------------------------------------
-- Overall funnel snapshot
-- -------------------------------------------------------
create or replace view v_funnel_overview as
select
  current_stage,
  count(*) as salon_count
from salons
where is_active = true
group by current_stage
order by current_stage;

-- -------------------------------------------------------
-- Funnel by region
-- -------------------------------------------------------
create or replace view v_funnel_by_region as
select
  region,
  current_stage,
  count(*) as salon_count
from salons
where is_active = true
group by region, current_stage
order by region, current_stage;

-- -------------------------------------------------------
-- Conversion rate by region
-- -------------------------------------------------------
create or replace view v_conversion_rate_by_region as
select
  region,
  count(*) filter (where current_stage != 'lost')   as total_active_leads,
  count(*) filter (where current_stage = 'won')     as won_count,
  round(
    count(*) filter (where current_stage = 'won')::numeric
    / nullif(count(*), 0) * 100, 2
  )                                                  as conversion_rate_pct
from salons
group by region
order by conversion_rate_pct desc nulls last;

-- -------------------------------------------------------
-- Rep performance
-- -------------------------------------------------------
create or replace view v_rep_performance as
select
  r.id                                                          as rep_id,
  r.full_name,
  r.region,
  count(distinct s.id)                                          as assigned_salons,
  count(d.id) filter (where d.stage = 'won')                   as deals_won,
  coalesce(
    sum(d.final_order_value) filter (where d.stage = 'won'), 0
  )                                                             as revenue_generated,
  round(
    count(d.id) filter (where d.stage = 'won')::numeric
    / nullif(count(distinct s.id), 0) * 100, 2
  )                                                             as win_rate_pct
from reps r
left join salons s  on s.assigned_rep_id = r.id
left join deals  d  on d.rep_id = r.id
group by r.id, r.full_name, r.region;

-- -------------------------------------------------------
-- Time-in-stage (uses stage_history for accurate durations)
-- -------------------------------------------------------
create or replace view v_time_in_stage as
select
  h.salon_id,
  s.salon_name,
  s.region,
  h.to_stage,
  h.created_at                                              as entered_at,
  lead(h.created_at) over (
    partition by h.salon_id order by h.created_at
  ) - h.created_at                                         as time_in_stage
from salon_stage_history h
join salons s on s.id = h.salon_id;

-- -------------------------------------------------------
-- Pending outreach due today (used by WF-2 daily scheduler)
-- -------------------------------------------------------
create or replace view v_pending_outreach_today as
select
  os.*,
  s.salon_name,
  s.region,
  s.city,
  s.phone,
  s.whatsapp_number,
  s.email,
  s.current_stage,
  s.assigned_rep_id
from outreach_sequences os
join salons s on s.id = os.salon_id
where os.status = 'pending'
  and os.scheduled_date <= current_date
  and s.is_active = true
  and s.current_stage in ('lead_generated', 'contacted');

-- -------------------------------------------------------
-- Monthly revenue
-- -------------------------------------------------------
create or replace view v_monthly_revenue as
select
  date_trunc('month', won_at)   as month,
  count(*)                      as deals_won,
  sum(final_order_value)        as revenue
from deals
where stage = 'won'
group by 1
order by 1 desc;

-- -------------------------------------------------------
-- Outreach reply summary (recent inbound activity)
-- -------------------------------------------------------
create or replace view v_recent_inbound_replies as
select
  'whatsapp'    as channel,
  wl.salon_id,
  s.salon_name,
  s.region,
  wl.interest,
  wl.intent,
  wl.reply_summary,
  wl.created_at
from whatsapp_logs wl
join salons s on s.id = wl.salon_id
where wl.direction = 'inbound'
union all
select
  'email'       as channel,
  el.salon_id,
  s.salon_name,
  s.region,
  el.interest,
  el.intent,
  el.reply_summary,
  el.created_at
from email_logs el
join salons s on s.id = el.salon_id
where el.direction = 'inbound'
order by created_at desc;

-- -------------------------------------------------------
-- Active accounts summary
-- -------------------------------------------------------
create or replace view v_active_accounts_summary as
select
  aa.id,
  s.salon_name,
  s.region,
  s.city,
  aa.first_order_value,
  aa.first_order_date,
  r.full_name  as account_manager,
  aa.created_at
from active_accounts aa
join salons s on s.id = aa.salon_id
left join reps r on r.id = aa.account_manager_id
order by aa.created_at desc;
