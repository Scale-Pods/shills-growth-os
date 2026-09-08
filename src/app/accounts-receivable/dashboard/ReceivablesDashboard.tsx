'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import {
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Receipt,
  Users,
  Send,
  Reply,
  MessageSquare,
  Mail,
  Phone,
} from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  normalizeConversation,
  parseConversationTimestamp,
  parseAmount,
  formatINR,
  type PartyLedgerRow,
  type RecoveryOutreachRow,
  type ConversationEntry,
} from '@/lib/supabase/receivables';

function isClosed(row: RecoveryOutreachRow): boolean {
  return String(row.closed).toLowerCase() === 'yes' || String(row.status).toLowerCase() === 'closed';
}

function isInbound(entry: ConversationEntry): boolean {
  const role = (entry.role || '').toLowerCase();
  return role !== 'business' && role !== 'system' && role !== 'agent';
}

/** Latest activity timestamp on a recovery_outreach row, for date filtering. */
function rowActivityDate(row: RecoveryOutreachRow): Date | null {
  const candidates = [
    row.updated_at,
    row.created_at,
    row.email_1_sent_at,
    row.wa_1_sent_at,
    row.call_1_sent_at,
    row.cycle_started_date,
    row.transaction_date,
  ];
  let best: Date | null = null;
  for (const c of candidates) {
    const d = c ? parseConversationTimestamp(c) ?? new Date(c) : null;
    if (d && !Number.isNaN(d.getTime()) && (!best || d.getTime() > best.getTime())) best = d;
  }
  return best;
}

export default function ReceivablesDashboard({
  ledger,
  outreach,
}: {
  ledger: PartyLedgerRow[];
  outreach: RecoveryOutreachRow[];
}) {
  const { dateRange, dateLabel } = useAppContext();
  // Stable "now" captured once on mount — used for invoice ageing.
  const [now] = useState(() => Date.now());

  // --- Date-filtered slices ---
  const dateLedger = useMemo(
    () => ledger.filter((r) => isWithinDateRange(r.created_at, dateRange)),
    [ledger, dateRange]
  );
  const dateOutreach = useMemo(
    () => outreach.filter((r) => isWithinDateRange(rowActivityDate(r), dateRange)),
    [outreach, dateRange]
  );

  // --- Ledger money metrics ---
  const ledgerStats = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const r of dateLedger) {
      debit += parseAmount(r.debit);
      credit += parseAmount(r.credit);
    }
    const outstanding = debit - credit;
    const openInvoices = dateLedger.filter((r) => String(r.closed).toLowerCase() !== 'yes');
    const openOutstanding = openInvoices.reduce(
      (sum, r) => sum + (parseAmount(r.running_balance) || parseAmount(r.debit) - parseAmount(r.credit)),
      0
    );
    const parties = new Set(dateLedger.map((r) => r.party_name).filter(Boolean)).size;
    return { debit, credit, outstanding, openOutstanding, openCount: openInvoices.length, parties };
  }, [dateLedger]);

  // --- Recovery metrics ---
  const recoveryStats = useMemo(() => {
    const total = dateOutreach.length;
    const closed = dateOutreach.filter(isClosed);
    const open = dateOutreach.filter((r) => !isClosed(r));
    const recoveredValue = closed.reduce((s, r) => s + parseAmount(r.total_outstanding), 0);
    const openValue = open.reduce((s, r) => s + parseAmount(r.total_outstanding), 0);
    const overdueValue = dateOutreach.reduce((s, r) => s + parseAmount(r.overdue_amount), 0);

    let emailsSent = 0;
    let waSent = 0;
    let callsSent = 0;
    for (const r of dateOutreach) {
      if (r.email_1_sent_at && r.email_1_content) emailsSent++;
      if (r.email_2_sent_at && r.email_2_content) emailsSent++;
      if (r.email_3_sent_at && r.email_3_content) emailsSent++;
      if (r.wa_1_sent_at && r.wa_1_content) waSent++;
      if (r.wa_2_sent_at && r.wa_2_content) waSent++;
      if (r.wa_3_sent_at && r.wa_3_content) waSent++;
      if (r.call_1_sent_at && r.call_1_content) callsSent++;
      if (r.call_2_sent_at && r.call_2_content) callsSent++;
    }

    const emailReplied = dateOutreach.filter(
      (r) => normalizeConversation(r.email_conversation).some(isInbound) || String(r.email_replied).toLowerCase() === 'yes'
    ).length;
    const waReplied = dateOutreach.filter(
      (r) => normalizeConversation(r.wa_conversation).some(isInbound) || String(r.wa_replied).toLowerCase() === 'yes'
    ).length;
    const callReplied = dateOutreach.filter(
      (r) => normalizeConversation(r.call_conversation).some(isInbound) || String(r.call_replied).toLowerCase() === 'yes'
    ).length;
    const anyReplied = dateOutreach.filter(
      (r) =>
        normalizeConversation(r.email_conversation).some(isInbound) ||
        normalizeConversation(r.wa_conversation).some(isInbound) ||
        normalizeConversation(r.call_conversation).some(isInbound) ||
        String(r.email_replied).toLowerCase() === 'yes' ||
        String(r.wa_replied).toLowerCase() === 'yes' ||
        String(r.call_replied).toLowerCase() === 'yes'
    ).length;

    const disputes = dateOutreach.filter(
      (r) => r.dispute && r.dispute.trim() && r.dispute.trim().toLowerCase() !== 'no'
    ).length;

    const totalTouches = emailsSent + waSent + callsSent;
    const collectionRate = total > 0 ? Math.round((closed.length / total) * 100) : 0;
    const replyRate = total > 0 ? Math.round((anyReplied / total) * 100) : 0;

    return {
      total,
      closedCount: closed.length,
      openCount: open.length,
      recoveredValue,
      openValue,
      overdueValue,
      emailsSent,
      waSent,
      callsSent,
      totalTouches,
      emailReplied,
      waReplied,
      callReplied,
      anyReplied,
      disputes,
      collectionRate,
      replyRate,
    };
  }, [dateOutreach]);

  // --- Stage breakdown ---
  const stageBreakdown = useMemo(() => {
    const m = new Map<string, { count: number; value: number }>();
    for (const r of dateOutreach) {
      const stage = (r.current_stage || 'Unknown').trim();
      const cur = m.get(stage) ?? { count: 0, value: 0 };
      cur.count += 1;
      cur.value += parseAmount(r.total_outstanding);
      m.set(stage, cur);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].value - a[1].value);
  }, [dateOutreach]);

  // --- Ageing buckets from ledger open balances ---
  const ageing = useMemo(() => {
    const buckets = [
      { label: '0–30 Days', min: 0, max: 30, amount: 0, color: 'var(--green)' },
      { label: '31–60 Days', min: 31, max: 60, amount: 0, color: 'var(--blue)' },
      { label: '61–90 Days', min: 61, max: 90, amount: 0, color: 'var(--orange)' },
      { label: '90+ Days', min: 91, max: Infinity, amount: 0, color: 'var(--red)' },
    ];
    for (const r of dateLedger) {
      if (String(r.closed).toLowerCase() === 'yes') continue;
      const bal = parseAmount(r.running_balance) || parseAmount(r.debit) - parseAmount(r.credit);
      if (bal <= 0) continue;
      const created = r.created_at ? new Date(r.created_at).getTime() : now;
      const ageDays = Math.max(0, Math.floor((now - created) / 86_400_000));
      const bucket = buckets.find((b) => ageDays >= b.min && ageDays <= b.max) ?? buckets[buckets.length - 1];
      bucket.amount += bal;
    }
    const total = buckets.reduce((s, b) => s + b.amount, 0);
    return { buckets, total };
  }, [dateLedger, now]);

  // --- Recent ledger ---
  const recentLedger = dateLedger.slice(0, 8);

  const channelTouches = [
    { label: 'Email', sent: recoveryStats.emailsSent, replied: recoveryStats.emailReplied, icon: <Mail size={13} />, color: 'var(--blue)' },
    { label: 'WhatsApp', sent: recoveryStats.waSent, replied: recoveryStats.waReplied, icon: <MessageSquare size={13} />, color: 'var(--green)' },
    { label: 'Voice', sent: recoveryStats.callsSent, replied: recoveryStats.callReplied, icon: <Phone size={13} />, color: 'var(--purple)' },
  ];

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Receivables Dashboard</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Live outstanding balances, ageing, and AI recovery performance from <code>party_ledger</code> + <code>recovery_outreach</code>
            {dateLabel ? ` · ${dateLabel}` : ''}.
          </p>
        </div>
      </div>

      {/* Row 1 — money */}
      <div className="metrics-grid mb-24">
        <Tile
          accent="var(--purple)"
          label="Total Outstanding"
          value={formatINR(ledgerStats.openOutstanding)}
          icon={<Clock size={12} />}
          sub={`${ledgerStats.openCount} open invoices`}
        />
        <Tile
          accent="var(--red)"
          label="Overdue Amount"
          value={formatINR(recoveryStats.overdueValue)}
          icon={<AlertTriangle size={12} />}
          sub={`${recoveryStats.openCount} in recovery`}
        />
        <Tile
          accent="var(--green)"
          label="Recovered"
          value={formatINR(recoveryStats.recoveredValue)}
          icon={<TrendingUp size={12} />}
          sub={`${recoveryStats.closedCount} accounts closed`}
        />
        <Tile
          accent="var(--blue)"
          label="Collection Rate"
          value={`${recoveryStats.collectionRate}%`}
          icon={<CheckCircle2 size={12} />}
          sub={`${recoveryStats.closedCount}/${recoveryStats.total} recovery cycles`}
        />
      </div>

      {/* Row 2 — activity */}
      <div className="metrics-grid mb-24">
        <Tile
          accent="var(--blue)"
          label="Invoices Uploaded"
          value={dateLedger.length}
          icon={<Receipt size={12} />}
          sub={`${ledgerStats.parties} parties`}
        />
        <Tile
          accent="var(--orange)"
          label="Outreach Touches"
          value={recoveryStats.totalTouches}
          icon={<Send size={12} />}
          sub={`${recoveryStats.emailsSent}✉ · ${recoveryStats.waSent}💬 · ${recoveryStats.callsSent}📞`}
        />
        <Tile
          accent="var(--green)"
          label="Reply Rate"
          value={`${recoveryStats.replyRate}%`}
          icon={<Reply size={12} />}
          sub={`${recoveryStats.anyReplied} accounts replied`}
        />
        <Tile
          accent="var(--red)"
          label="Open Disputes"
          value={recoveryStats.disputes}
          icon={<AlertTriangle size={12} />}
          sub="Flagged by customer"
        />
      </div>

      {/* Ageing */}
      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Outstanding Ageing (open ledger balances)</h3>
        {ageing.total === 0 ? (
          <span style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>No open balances in this date range.</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', background: 'var(--fill-tertiary)' }}>
              {ageing.buckets.map((b, idx) => {
                const pct = Math.round((b.amount / ageing.total) * 100);
                return (
                  <div
                    key={idx}
                    style={{ width: `${pct}%`, background: b.color, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '700' }}
                    title={`${b.label}: ${formatINR(b.amount)} (${pct}%)`}
                  >
                    {pct > 6 ? `${pct}%` : ''}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              {ageing.buckets.map((b, idx) => (
                <div key={idx} style={{ background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color }}></span>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>{b.label}</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{formatINR(b.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Stage breakdown */}
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recovery Pipeline by Stage</h3>
          {stageBreakdown.length === 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>No recovery cycles in range.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stageBreakdown.map(([stage, { count, value }]) => {
                const maxVal = Math.max(...stageBreakdown.map(([, s]) => s.value), 1);
                const pct = Math.round((value / maxVal) * 100);
                return (
                  <div key={stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{stage}</span>
                      <span style={{ color: 'var(--label-tertiary)' }}>{count} · {formatINR(value)}</span>
                    </div>
                    <div style={{ height: '10px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Channel performance */}
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Channel Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {channelTouches.map((c) => {
              const rate = c.sent > 0 ? Math.round((c.replied / c.sent) * 100) : 0;
              return (
                <div key={c.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: c.color }}>{c.icon} {c.label}</span>
                    <span style={{ color: 'var(--label-tertiary)' }}>{c.sent} sent · {c.replied} replied · {rate}%</span>
                  </div>
                  <div style={{ height: '10px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${c.sent > 0 ? (c.replied / c.sent) * 100 : 0}%`, height: '100%', background: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--separator)', display: 'flex', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Recovered value</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green)' }}>{formatINR(recoveryStats.recoveredValue)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Still open</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--orange)' }}>{formatINR(recoveryStats.openValue)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent ledger */}
      <div className="liquid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Recent Ledger Entries</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Party</th>
                <th style={{ padding: '12px 8px' }}>Bill No.</th>
                <th style={{ padding: '12px 8px' }}>Voucher</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Debit</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Credit</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Running Balance</th>
                <th style={{ padding: '12px 8px' }}>Closed</th>
                <th style={{ padding: '12px 8px' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)' }}>
                    No ledger entries in this date range.
                  </td>
                </tr>
              ) : (
                recentLedger.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ fontWeight: '700', display: 'block' }}>{r.party_name ?? '—'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{r.email ?? '—'}</span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{r.bill_no ?? '—'}</td>
                    <td style={{ padding: '12px 8px' }}>{r.voucher_no ?? '—'}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{r.debit ? formatINR(parseAmount(r.debit)) : '—'}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, color: parseAmount(r.credit) > 0 ? 'var(--green)' : undefined }}>
                      {r.credit ? formatINR(parseAmount(r.credit)) : '—'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>{r.running_balance ? formatINR(parseAmount(r.running_balance)) : '—'}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${String(r.closed).toLowerCase() === 'yes' ? 'badge-green' : 'badge-orange'}`}>{r.closed ?? 'No'}</span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({
  accent,
  label,
  value,
  icon,
  sub,
}: {
  accent: string;
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="metric-tile liquid-card" style={{ '--tile-accent-color': accent } as React.CSSProperties}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      <span className="trend up" style={{ color: accent }}>{icon} {sub}</span>
    </div>
  );
}
