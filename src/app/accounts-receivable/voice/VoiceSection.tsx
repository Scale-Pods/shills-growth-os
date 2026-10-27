'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import { Phone, PhoneCall, Search, Clock, Reply, TrendingUp } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  parseConversationTimestamp,
  formatINR,
  outreachOwedAmount,
  callStep,
  type RecoveryOutreachRow,
} from '@/lib/supabase/receivables';

type VoiceView = 'dashboard' | 'logs' | 'analytics';

interface CallItem {
  row: RecoveryOutreachRow;
  step: number; // 1-8
  content: string;
  status: string | null;
  sentAt: string | null;
  sentAtDate: Date | null;
  sentiment: string | null;
  note: string | null;
  recordingUrl: string | null;
}

function collectCalls(rows: RecoveryOutreachRow[]): CallItem[] {
  const out: CallItem[] = [];
  for (const row of rows) {
    for (let n = 1; n <= 8; n++) {
      const { content, status, sent_at: sentAt, sentiment, note, recording_url: recordingUrl } = callStep(row, n as 1);
      if (!sentAt) continue;
      if (!content || !content.trim()) continue;
      out.push({ row, step: n, content, status, sentAt, sentAtDate: parseConversationTimestamp(sentAt), sentiment, note, recordingUrl });
    }
  }
  return out;
}

/** A call step "replied" when it has a recorded sentiment — calls have no reply transcript field. */
function hasReply(c: CallItem): boolean {
  return Boolean(c.sentiment && c.sentiment.trim());
}

export default function VoiceSection({ rows, view }: { rows: RecoveryOutreachRow[]; view: VoiceView }) {
  const { dateRange, dateLabel } = useAppContext();

  const calls = useMemo(() => {
    return collectCalls(rows)
      .filter((c) => (c.sentAtDate ? isWithinDateRange(c.sentAtDate, dateRange) : true))
      .sort((a, b) => (b.sentAtDate?.getTime() ?? 0) - (a.sentAtDate?.getTime() ?? 0));
  }, [rows, dateRange]);

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>
          {view === 'dashboard' && 'Voice — Dashboard'}
          {view === 'logs' && 'Voice — Call Logs'}
          {view === 'analytics' && 'Voice — Analytics'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          AI voice call logs from <code>recovery_outreach_seq</code>
          {dateLabel ? ` · ${dateLabel}` : ''}.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      {header}
      {view === 'dashboard' && <VoiceDashboard calls={calls} />}
      {view === 'logs' && <VoiceLogs calls={calls} />}
      {view === 'analytics' && <VoiceAnalytics calls={calls} />}
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function VoiceDashboard({ calls }: { calls: CallItem[] }) {
  const replied = calls.filter(hasReply).length;
  const replyRate = calls.length > 0 ? Math.round((replied / calls.length) * 100) : 0;
  const outstandingInPlay = useMemo(() => {
    const seen = new Set<number>();
    let sum = 0;
    for (const c of calls) {
      if (seen.has(c.row.id)) continue;
      seen.add(c.row.id);
      sum += outreachOwedAmount(c.row);
    }
    return sum;
  }, [calls]);

  const recent = calls.slice(0, 8);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--purple)" label="Calls Placed" value={calls.length} icon={<PhoneCall size={12} />} sub="In range" />
        <Tile accent="var(--green)" label="Calls with a Reply" value={replied} icon={<Reply size={12} />} sub="Sentiment recorded" />
        <Tile accent="var(--blue)" label="Reply Rate" value={`${replyRate}%`} icon={<Phone size={12} />} sub={`${calls.length - replied} awaiting`} />
        <Tile accent="var(--orange)" label="Final Amount in Calls" value={formatINR(outstandingInPlay)} icon={<Clock size={12} />} sub="Across parties called" />
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recent Calls</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Party</th>
                <th style={{ padding: '12px 8px' }}>Phone</th>
                <th style={{ padding: '12px 8px' }}>Step</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px' }}>Sent</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No calls in range.</td></tr>
              ) : (
                recent.map((c, i) => (
                  <tr key={`${c.row.id}-${c.step}-${i}`} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '700' }}>{c.row.party_name ?? '—'}</td>
                    <td style={{ padding: '12px 8px' }}>{c.row.phone ?? '—'}</td>
                    <td style={{ padding: '12px 8px' }}><span className="badge badge-blue">Call {c.step}</span></td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${hasReply(c) ? 'badge-green' : 'badge-orange'}`}>{c.status ?? (hasReply(c) ? 'Replied' : 'Awaiting')}</span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{c.sentAt ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* -------------------------------- Logs -------------------------------- */

function VoiceLogs({ calls }: { calls: CallItem[] }) {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return calls;
    return calls.filter((c) =>
      [c.row.party_name, c.row.phone, c.row.bill_no].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [calls, search]);

  const keyOf = (c: CallItem) => `${c.row.id}-${c.step}`;
  const active = filtered.find((c) => keyOf(c) === selectedKey) ?? filtered[0] ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
      <div className="liquid-card" style={{ padding: '16px' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
          <input
            type="text"
            placeholder="Search party or phone..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 30px', fontSize: '13px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '560px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>No calls in range.</div>
          ) : (
            filtered.map((c) => (
              <button
                key={keyOf(c)}
                onClick={() => setSelectedKey(keyOf(c))}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left',
                  padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: active && keyOf(active) === keyOf(c) ? 'var(--fill-tertiary)' : 'transparent',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  {c.row.party_name ?? '—'}
                  <span className="badge badge-blue" style={{ flexShrink: 0 }}>Call {c.step}</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{c.row.phone ?? ''}</span>
                <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)' }}>{c.sentAt ?? '—'}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px', minHeight: '400px' }}>
        {!active ? (
          <div style={{ textAlign: 'center', color: 'var(--label-tertiary)', padding: '60px 0' }}>Select a call.</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>{active.row.party_name ?? '—'} · Call {active.step}</h3>
              <span style={{ fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{active.sentAt ?? '—'}</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--label-tertiary)', marginBottom: '14px' }}>
              {active.row.phone ?? '—'} · Bill {active.row.bill_no ?? '—'} · Final Amount{' '}
              {formatINR(outreachOwedAmount(active.row))}
            </div>

            {active.recordingUrl && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Call Recording</span>
                <audio controls src={active.recordingUrl} style={{ width: '100%', marginTop: '6px', height: '36px' }} />
              </div>
            )}

            {active.note && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Note</span>
                <p style={{ fontSize: '12.5px', background: 'var(--fill-quaternary)', padding: '12px 14px', borderRadius: '10px', color: 'var(--label-primary)', lineHeight: '1.5', marginTop: '6px', whiteSpace: 'pre-wrap' }}>
                  {active.note}
                </p>
              </div>
            )}

            {active.sentiment && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Sentiment</span>
                <div style={{ marginTop: '6px' }}>
                  <span
                    className={`badge ${
                      active.sentiment.toLowerCase().startsWith('pos')
                        ? 'badge-green'
                        : active.sentiment.toLowerCase().startsWith('neg')
                        ? 'badge-red'
                        : 'badge-orange'
                    }`}
                  >
                    {active.sentiment}
                  </span>
                </div>
              </div>
            )}

            <div>
              <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Call Script</span>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12.5px', fontFamily: 'var(--font-mono)', background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '10px', color: 'var(--label-primary)', lineHeight: '1.5', marginTop: '6px' }}>
                {active.content}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Analytics ------------------------------ */

function VoiceAnalytics({ calls }: { calls: CallItem[] }) {
  const replied = calls.filter(hasReply);
  const replyRate = calls.length > 0 ? Math.round((replied.length / calls.length) * 100) : 0;

  const stepCounts = useMemo(() => {
    const counts = new Array(8).fill(0);
    for (const c of calls) counts[c.step - 1]++;
    return counts;
  }, [calls]);

  const sentimentCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of calls) {
      if (!c.sentiment) continue;
      const s = c.sentiment.trim().toLowerCase();
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [calls]);

  const { recoveredValue, openValue } = useMemo(() => {
    const seen = new Set<number>();
    let recovered = 0;
    let open = 0;
    for (const c of calls) {
      if (seen.has(c.row.id)) continue;
      seen.add(c.row.id);
      const amt = outreachOwedAmount(c.row);
      const isClosed = String(c.row.closed).toLowerCase() === 'yes' || String(c.row.status).toLowerCase() === 'closed';
      if (isClosed) recovered += amt;
      else open += amt;
    }
    return { recoveredValue: recovered, openValue: open };
  }, [calls]);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--purple)" label="Calls Placed" value={calls.length} icon={<PhoneCall size={12} />} sub="In range" />
        <Tile accent="var(--blue)" label="Reply Rate" value={`${replyRate}%`} icon={<Reply size={12} />} sub={`${replied.length}/${calls.length} calls`} />
        <Tile accent="var(--green)" label="Recovered Value" value={formatINR(recoveredValue)} icon={<TrendingUp size={12} />} sub="Closed accounts" />
        <Tile accent="var(--orange)" label="Still Open" value={formatINR(openValue)} icon={<Clock size={12} />} sub="Open accounts" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Calls by Step</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stepCounts.map((count, i) => {
              const max = Math.max(...stepCounts, 1);
              const pct = Math.round((count / max) * 100);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', width: '56px', flexShrink: 0 }}>Call {i + 1}</span>
                  <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--purple)' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', width: '32px', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Sentiment Distribution</h3>
          {sentimentCounts.length === 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>No sentiment data.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sentimentCounts.map(([s, count]) => {
                const total = sentimentCounts.reduce((n, [, c]) => n + c, 0);
                const pct = Math.round((count / total) * 100);
                const color = s.startsWith('pos') ? 'var(--green)' : s.startsWith('neg') ? 'var(--red)' : 'var(--orange)';
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', width: '90px', flexShrink: 0, textTransform: 'capitalize' }}>{s}</span>
                    <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', width: '32px', textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recovered vs Open Value</h3>
          <div style={{ height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', background: 'var(--fill-tertiary)', marginBottom: '16px' }}>
            {(() => {
              const total = recoveredValue + openValue || 1;
              const cPct = Math.round((recoveredValue / total) * 100);
              return (
                <>
                  <div style={{ width: `${cPct}%`, background: 'var(--green)' }} />
                  <div style={{ width: `${100 - cPct}%`, background: 'var(--orange)' }} />
                </>
              );
            })()}
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
            <div><span style={{ color: 'var(--green)', fontWeight: 700 }}>{formatINR(recoveredValue)}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Recovered</div></div>
            <div><span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatINR(openValue)}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Open</div></div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------- Shared ------------------------------- */

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
