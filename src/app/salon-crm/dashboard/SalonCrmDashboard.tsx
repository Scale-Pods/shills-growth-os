'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useAppContext } from '../../ClientWrapper';
import type { Salon, OutreachSequence } from '@/lib/supabase/salonCrm';
import { parseSentiment } from '@/lib/supabase/salonCrm';
import { Users, MapPin, MessageSquare, Mail, TrendingUp, Calendar, Send, Reply } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';

const STAGES = ['lead_generated', 'contacted', 'interested', 'sample_sent', 'demo_booked', 'negotiation', 'won', 'lost'];

function stageLabel(stage: string) {
  return stage.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatKolkata(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SalonCrmDashboard({
  salons,
  outreachSequences,
}: {
  salons: Salon[];
  outreachSequences: OutreachSequence[];
}) {
  const funnelChartRef = useRef<HTMLCanvasElement | null>(null);
  const funnelChartInstance = useRef<Chart | null>(null);
  const regionChartRef = useRef<HTMLCanvasElement | null>(null);
  const regionChartInstance = useRef<Chart | null>(null);

  const { dateRange, dateLabel } = useAppContext();

  // Leads (funnel/region/win-rate) filtered by created_at
  const dateSalons = useMemo(
    () => salons.filter((s) => isWithinDateRange(s.created_at, dateRange)),
    [salons, dateRange]
  );

  // Outreach sends filtered by executed_at
  const dateOutreach = useMemo(
    () => outreachSequences.filter((o) => isWithinDateRange(o.executed_at, dateRange)),
    [outreachSequences, dateRange]
  );

  // Replies/engagement/sentiment filtered by their own *_last_reply_at column
  const dateEmailReplySalons = useMemo(
    () => salons.filter((s) => s.email_last_reply_at && isWithinDateRange(s.email_last_reply_at, dateRange)),
    [salons, dateRange]
  );
  const dateWhatsappReplySalons = useMemo(
    () => salons.filter((s) => s.whatsapp_last_reply_at && isWithinDateRange(s.whatsapp_last_reply_at, dateRange)),
    [salons, dateRange]
  );

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const stage of STAGES) counts[stage] = 0;
    for (const s of dateSalons) counts[s.current_stage] = (counts[s.current_stage] ?? 0) + 1;
    return counts;
  }, [dateSalons]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of dateSalons) counts[s.region] = (counts[s.region] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [dateSalons]);

  const totalLeads = dateSalons.length;
  const activeLeads = dateSalons.filter((s) => s.current_stage !== 'won' && s.current_stage !== 'lost').length;
  const wonCount = stageCounts.won ?? 0;
  const lostCount = stageCounts.lost ?? 0;
  const winRate = wonCount + lostCount > 0 ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(1) : '—';

  // Outreach cadence sends: outreach_sequences where channel=X, status=sent
  const emailsSent = dateOutreach.filter((o) => o.channel === 'email' && o.status === 'sent');
  const whatsappSent = dateOutreach.filter((o) => o.channel === 'whatsapp' && o.status === 'sent');
  const lastEmailSentAt = emailsSent[0]?.executed_at ?? null;
  const lastWhatsappSentAt = whatsappSent[0]?.executed_at ?? null;

  // Replies: salons.email_last_reply_at / whatsapp_last_reply_at not null, within range
  const emailReplies = dateEmailReplySalons;
  const whatsappReplies = dateWhatsappReplySalons;
  const lastEmailReplyAt = emailReplies
    .map((s) => s.email_last_reply_at as string)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
  const lastWhatsappReplyAt = whatsappReplies
    .map((s) => s.whatsapp_last_reply_at as string)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  // Salons Engaged: either channel's last_reply_at is not null, within range
  const engagedSalons = new Set([...emailReplies, ...whatsappReplies].map((s) => s.id)).size;

  // Positive Signals: parse "positive - wants_sample - ..." format from both sentiment columns,
  // gated by whether that channel's reply falls within the selected date range
  const positiveSignals = useMemo(() => {
    const waIds = new Set(whatsappReplies.map((s) => s.id));
    const emailIds = new Set(emailReplies.map((s) => s.id));
    let waPositive = 0;
    let emailPositive = 0;
    for (const s of dateSalons) {
      if (waIds.has(s.id) && parseSentiment(s.whatsapp_sentiment).interest === 'positive') waPositive++;
      if (emailIds.has(s.id) && parseSentiment(s.email_sentiment).interest === 'positive') emailPositive++;
    }
    return { waPositive, emailPositive, total: waPositive + emailPositive };
  }, [dateSalons, whatsappReplies, emailReplies]);

  useEffect(() => {
    if (funnelChartRef.current) {
      if (funnelChartInstance.current) funnelChartInstance.current.destroy();
      const ctx = funnelChartRef.current.getContext('2d');
      if (ctx) {
        funnelChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: STAGES.map(stageLabel),
            datasets: [
              {
                label: 'Salons',
                data: STAGES.map((s) => stageCounts[s] ?? 0),
                backgroundColor: STAGES.map((s) =>
                  s === 'won' ? '#34C759' : s === 'lost' ? '#FF3B30' : '#007AFF'
                ),
                borderRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10 } } },
              y: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: 'rgba(255,255,255,0.6)' } },
            },
          },
        });
      }
    }
    return () => { funnelChartInstance.current?.destroy(); };
  }, [stageCounts]);

  useEffect(() => {
    if (regionChartRef.current) {
      if (regionChartInstance.current) regionChartInstance.current.destroy();
      const ctx = regionChartRef.current.getContext('2d');
      if (ctx) {
        regionChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: regionCounts.map(([region]) => region),
            datasets: [
              {
                data: regionCounts.map(([, count]) => count),
                backgroundColor: ['#007AFF', '#AF52DE', '#FF9500', '#34C759', '#FF3B30', '#5AC8FA', '#FF2D55', '#8E8E93'],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } } } },
          },
        });
      }
    }
    return () => { regionChartInstance.current?.destroy(); };
  }, [regionCounts]);

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Salon CRM Dashboard</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Live metrics across lead generation, outreach cadence, and inbound reply handling.
          </p>
        </div>
      </div>

      {/* Row 1: Pipeline overview */}
      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Total Leads</span>
          <span className="value">{totalLeads}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Users size={12} /> {activeLeads} active in pipeline</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Win Rate</span>
          <span className="value">{winRate}{winRate !== '—' ? '%' : ''}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><TrendingUp size={12} /> {wonCount} won / {lostCount} lost</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Salons Engaged</span>
          <span className="value">{engagedSalons}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><Calendar size={12} /> Replied on WhatsApp or Email</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Positive Signals</span>
          <span className="value">{positiveSignals.total}</span>
          <span className="trend up" style={{ color: 'var(--orange)' }}><MessageSquare size={12} /> {positiveSignals.waPositive} WA + {positiveSignals.emailPositive} email</span>
        </div>
      </div>

      {/* Row 2: Channel sends & replies */}
      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Total Emails Sent</span>
          <span className="value">{emailsSent.length}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><Send size={12} /> Last: {formatKolkata(lastEmailSentAt)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Total Email Replies</span>
          <span className="value">{emailReplies.length}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Reply size={12} /> Last: {formatKolkata(lastEmailReplyAt)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Total WhatsApp Sent</span>
          <span className="value">{whatsappSent.length}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><Send size={12} /> Last: {formatKolkata(lastWhatsappSentAt)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Total WhatsApp Replies</span>
          <span className="value">{whatsappReplies.length}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><Reply size={12} /> Last: {formatKolkata(lastWhatsappReplyAt)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Funnel Stage Distribution</h3>
          <div style={{ height: '300px', position: 'relative' }}>
            <canvas ref={funnelChartRef}></canvas>
          </div>
        </div>

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} /> Leads by Region
          </h3>
          <div style={{ height: '260px', position: 'relative' }}>
            {regionCounts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--label-tertiary)', fontSize: '13px' }}>
                No region data yet.
              </div>
            ) : (
              <canvas ref={regionChartRef}></canvas>
            )}
          </div>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={16} /> Channel Activity
        </h3>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>WhatsApp Cadence Sends</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--green)', marginTop: '4px' }}>{whatsappSent.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>{whatsappReplies.length} salons replied</div>
          </div>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Email Cadence Sends</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--blue)', marginTop: '4px' }}>{emailsSent.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>{emailReplies.length} salons replied</div>
          </div>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Demo/Negotiation Stage</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--purple)', marginTop: '4px' }}>
              {(stageCounts.demo_booked ?? 0) + (stageCounts.negotiation ?? 0)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>Late-stage active leads</div>
          </div>
        </div>
      </div>
    </div>
  );
}
