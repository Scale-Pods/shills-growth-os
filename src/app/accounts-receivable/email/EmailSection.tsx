'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import {
  Mail,
  Send,
  Inbox,
  Reply,
  Search,
  TrendingUp,
  MessageSquareText,
  Clock,
  X,
} from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  normalizeConversation,
  parseConversationTimestamp,
  parseAmount,
  formatINR,
  outreachOwedAmount,
  outreachStep,
  type RecoveryOutreachRow,
  type ConversationEntry,
} from '@/lib/supabase/receivables';

type EmailView = 'dashboard' | 'sent' | 'received' | 'analytics';

/** One outbound email step flattened from a row. */
interface SentEmail {
  row: RecoveryOutreachRow;
  step: number; // 1-8
  content: string;
  sentAt: string | null;
  sentAtDate: Date | null;
}

function collectSentEmails(rows: RecoveryOutreachRow[]): SentEmail[] {
  const out: SentEmail[] = [];
  for (const row of rows) {
    for (let n = 1; n <= 8; n++) {
      const { content, sent_at: sentAt } = outreachStep(row, 'email', n as 1);
      // Only show when the email was actually sent AND has content.
      if (!sentAt) continue;
      if (!content || !content.trim()) continue;
      out.push({
        row,
        step: n,
        content,
        sentAt,
        sentAtDate: parseConversationTimestamp(sentAt),
      });
    }
  }
  return out;
}

function isInbound(entry: ConversationEntry): boolean {
  const role = (entry.role || '').toLowerCase();
  return role !== 'business' && role !== 'system' && role !== 'agent';
}

export default function EmailSection({
  rows,
  view,
}: {
  rows: RecoveryOutreachRow[];
  view: EmailView;
}) {
  const { dateRange, dateLabel } = useAppContext();

  // --- Sent emails, date-filtered on their own sent_at ---
  const sentEmails = useMemo(() => {
    return collectSentEmails(rows)
      .filter((e) => (e.sentAtDate ? isWithinDateRange(e.sentAtDate, dateRange) : true))
      .sort((a, b) => (b.sentAtDate?.getTime() ?? 0) - (a.sentAtDate?.getTime() ?? 0));
  }, [rows, dateRange]);

  // --- Conversations (threads), date-filtered on latest message timestamp ---
  const threads = useMemo(() => {
    return rows
      .map((row) => {
        const entries = normalizeConversation(row.email_conversation)
          .map((e) => ({ ...e, _at: parseConversationTimestamp(e.timestamp) }))
          .sort((a, b) => (a._at?.getTime() ?? 0) - (b._at?.getTime() ?? 0));
        return { row, entries };
      })
      .filter((t) => t.entries.length > 0)
      .filter((t) => {
        const last = t.entries[t.entries.length - 1]?._at;
        return last ? isWithinDateRange(last, dateRange) : true;
      })
      .sort((a, b) => {
        const al = a.entries[a.entries.length - 1]?._at?.getTime() ?? 0;
        const bl = b.entries[b.entries.length - 1]?._at?.getTime() ?? 0;
        return bl - al;
      });
  }, [rows, dateRange]);

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>
          {view === 'dashboard' && 'Email — Dashboard'}
          {view === 'sent' && 'Email — Sent'}
          {view === 'received' && 'Email — Received'}
          {view === 'analytics' && 'Email — Analytics'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          Recovery email outreach from <code>recovery_outreach</code>
          {dateLabel ? ` · ${dateLabel}` : ''}.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      {header}
      {view === 'dashboard' && <EmailDashboard rows={rows} sentEmails={sentEmails} threads={threads} />}
      {view === 'sent' && <EmailSent sentEmails={sentEmails} />}
      {view === 'received' && <EmailReceived threads={threads} />}
      {view === 'analytics' && <EmailAnalytics rows={rows} sentEmails={sentEmails} threads={threads} />}
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function EmailDashboard({
  rows,
  sentEmails,
  threads,
}: {
  rows: RecoveryOutreachRow[];
  sentEmails: SentEmail[];
  threads: Array<{ row: RecoveryOutreachRow; entries: Array<ConversationEntry & { _at: Date | null }> }>;
}) {
  const repliedCount = threads.filter((t) => t.entries.some(isInbound)).length;
  const inboundMsgs = threads.reduce((n, t) => n + t.entries.filter(isInbound).length, 0);
  const awaiting = threads.length - repliedCount;
  const replyRate = threads.length > 0 ? Math.round((repliedCount / threads.length) * 100) : 0;

  const stageCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const s = (r.current_stage || 'Unknown').trim();
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const recent = sentEmails.slice(0, 8);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--blue)" label="Emails Sent" value={sentEmails.length} icon={<Send size={12} />} sub="Steps 1–3, in range" />
        <Tile accent="var(--green)" label="Threads Replied" value={repliedCount} icon={<Reply size={12} />} sub={`${replyRate}% reply rate`} />
        <Tile accent="var(--orange)" label="Awaiting Reply" value={awaiting} icon={<Clock size={12} />} sub="No inbound yet" />
        <Tile accent="var(--purple)" label="Inbound Messages" value={inboundMsgs} icon={<Inbox size={12} />} sub="From customers" />
      </div>

      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Pipeline by Recovery Stage</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stageCounts.length === 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>No rows.</span>
          ) : (
            stageCounts.map(([stage, count]) => {
              const pct = Math.round((count / rows.length) * 100);
              return (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', width: '160px', flexShrink: 0 }}>{stage}</span>
                  <div style={{ flex: 1, height: '10px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue)' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', width: '40px', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recent Sent Emails</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Party</th>
                <th style={{ padding: '12px 8px' }}>Step</th>
                <th style={{ padding: '12px 8px' }}>Bill No.</th>
                <th style={{ padding: '12px 8px' }}>Outstanding</th>
                <th style={{ padding: '12px 8px' }}>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No sent emails in range.</td></tr>
              ) : (
                recent.map((e, i) => (
                  <tr key={`${e.row.id}-${e.step}-${i}`} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '700' }}>{e.row.party_name ?? '—'}</td>
                    <td style={{ padding: '12px 8px' }}><span className="badge badge-blue">Email {e.step}</span></td>
                    <td style={{ padding: '12px 8px' }}>{e.row.bill_no ?? '—'}</td>
                    <td style={{ padding: '12px 8px' }}>{formatINR(outreachOwedAmount(e.row))}</td>
                    <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{e.sentAt ?? '—'}</td>
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

/* ------------------------------- Sent ------------------------------- */

function EmailSent({ sentEmails }: { sentEmails: SentEmail[] }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SentEmail | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sentEmails;
    return sentEmails.filter((e) =>
      [e.row.party_name, e.row.email, e.row.bill_no, e.row.voucher_no]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [sentEmails, search]);

  const active = selected ?? filtered[0] ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
      <div className="liquid-card" style={{ padding: '16px' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
          <input
            type="text"
            placeholder="Search party, bill, voucher..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 30px', fontSize: '13px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '620px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>No sent emails.</div>
          ) : (
            filtered.map((e, i) => (
              <button
                key={`${e.row.id}-${e.step}-${i}`}
                onClick={() => setSelected(e)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left',
                  padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: active === e ? 'var(--fill-tertiary)' : 'transparent',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  {e.row.party_name ?? '—'}
                  <span className="badge badge-blue" style={{ flexShrink: 0 }}>Email {e.step}</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{e.row.bill_no ?? e.row.voucher_no ?? ''}</span>
                <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)' }}>{e.sentAt ?? '—'}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px', minHeight: '420px' }}>
        {!active ? (
          <div style={{ textAlign: 'center', color: 'var(--label-tertiary)', padding: '60px 0' }}>Select a sent email.</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>
                {active.row.party_name ?? '—'} · Email {active.step}
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--label-tertiary)' }}>Sent {active.sentAt ?? '—'}</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--label-tertiary)', marginBottom: '14px' }}>
              To: {active.row.email ?? '—'} · Bill {active.row.bill_no ?? '—'} · Final Amount{' '}
              {formatINR(outreachOwedAmount(active.row))}
            </div>
            <EmailBody html={active.content} />
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Received ----------------------------- */

function EmailReceived({
  threads,
}: {
  threads: Array<{ row: RecoveryOutreachRow; entries: Array<ConversationEntry & { _at: Date | null }> }>;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      [t.row.party_name, t.row.email, t.row.bill_no].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [threads, search]);

  const active = filtered.find((t) => t.row.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
      <div className="liquid-card" style={{ padding: '16px' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
          <input
            type="text"
            placeholder="Search party..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 30px', fontSize: '13px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '620px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>No conversations.</div>
          ) : (
            filtered.map((t) => {
              const last = t.entries[t.entries.length - 1];
              const replied = t.entries.some(isInbound);
              return (
                <button
                  key={t.row.id}
                  onClick={() => setSelectedId(t.row.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left',
                    padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: active?.row.id === t.row.id ? 'var(--fill-tertiary)' : 'transparent',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    {t.row.party_name ?? '—'}
                    <span className={`badge ${replied ? 'badge-green' : 'badge-orange'}`} style={{ flexShrink: 0 }}>
                      {replied ? 'Replied' : 'Awaiting'}
                    </span>
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {last ? `${isInbound(last) ? '← ' : '→ '}${stripHtml(last.message).slice(0, 60)}` : ''}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px', minHeight: '420px' }}>
        {!active ? (
          <div style={{ textAlign: 'center', color: 'var(--label-tertiary)', padding: '60px 0' }}>Select a conversation.</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>{active.row.party_name ?? '—'}</h3>
              <span style={{ fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{active.row.email ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '560px', overflowY: 'auto' }}>
              {active.entries.map((entry, idx) => {
                const inbound = isInbound(entry);
                return (
                  <div
                    key={idx}
                    style={{
                      background: inbound ? 'var(--fill-tertiary)' : 'rgba(0, 122, 255, 0.08)',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      borderLeft: `3px solid ${inbound ? 'var(--green)' : 'var(--blue)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', fontWeight: 600 }}>
                        {inbound ? 'Customer' : 'Shills'}{entry.stage ? ` · ${entry.stage}` : ''}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)' }}>{entry.timestamp ?? ''}</span>
                    </div>
                    <EmailBody html={entry.message} compact />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Analytics ---------------------------- */

function EmailAnalytics({
  rows,
  sentEmails,
  threads,
}: {
  rows: RecoveryOutreachRow[];
  sentEmails: SentEmail[];
  threads: Array<{ row: RecoveryOutreachRow; entries: Array<ConversationEntry & { _at: Date | null }> }>;
}) {
  const byStep = [1, 2, 3].map((s) => sentEmails.filter((e) => e.step === s).length);
  const repliedThreads = threads.filter((t) => t.entries.some(isInbound));
  const replyRate = threads.length > 0 ? Math.round((repliedThreads.length / threads.length) * 100) : 0;

  // Average response time: first inbound after the first outbound in a thread.
  const responseHours: number[] = [];
  for (const t of threads) {
    const firstOut = t.entries.find((e) => !isInbound(e))?._at ?? null;
    const firstIn = t.entries.find((e) => isInbound(e))?._at ?? null;
    if (firstOut && firstIn && firstIn.getTime() > firstOut.getTime()) {
      responseHours.push((firstIn.getTime() - firstOut.getTime()) / 3_600_000);
    }
  }
  const avgResponse = responseHours.length
    ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length
    : null;

  const sentimentCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (!r.sentiment) continue;
      const s = r.sentiment.trim().toLowerCase();
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const outstandingRecovered = useMemo(() => {
    let closed = 0;
    let open = 0;
    for (const r of rows) {
      const amt = outreachOwedAmount(r);
      if (String(r.closed).toLowerCase() === 'yes' || String(r.status).toLowerCase() === 'closed') closed += amt;
      else open += amt;
    }
    return { closed, open };
  }, [rows]);

  const disputeCount = rows.filter((r) => r.dispute && r.dispute.trim() && r.dispute.trim().toLowerCase() !== 'no').length;

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--blue)" label="Total Emails Sent" value={sentEmails.length} icon={<Send size={12} />} sub={`${byStep[0]}/${byStep[1]}/${byStep[2]} by step`} />
        <Tile accent="var(--green)" label="Reply Rate" value={`${replyRate}%`} icon={<Reply size={12} />} sub={`${repliedThreads.length}/${threads.length} threads`} />
        <Tile accent="var(--purple)" label="Avg. Response Time" value={avgResponse != null ? `${avgResponse.toFixed(1)}h` : '—'} icon={<Clock size={12} />} sub="First customer reply" />
        <Tile accent="var(--orange)" label="Open Disputes" value={disputeCount} icon={<MessageSquareText size={12} />} sub="dispute set" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Emails by Step</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Email 1', 'Email 2', 'Email 3'].map((label, i) => {
              const max = Math.max(...byStep, 1);
              const pct = Math.round((byStep[i] / max) * 100);
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', width: '70px', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue)' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', width: '32px', textAlign: 'right' }}>{byStep[i]}</span>
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
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Outstanding: Recovered vs Open</h3>
          <div style={{ height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', background: 'var(--fill-tertiary)', marginBottom: '16px' }}>
            {(() => {
              const total = outstandingRecovered.closed + outstandingRecovered.open || 1;
              const cPct = Math.round((outstandingRecovered.closed / total) * 100);
              return (
                <>
                  <div style={{ width: `${cPct}%`, background: 'var(--green)' }} title={`Recovered ${formatINR(outstandingRecovered.closed)}`} />
                  <div style={{ width: `${100 - cPct}%`, background: 'var(--orange)' }} title={`Open ${formatINR(outstandingRecovered.open)}`} />
                </>
              );
            })()}
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
            <div><span style={{ color: 'var(--green)', fontWeight: 700 }}>{formatINR(outstandingRecovered.closed)}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Recovered / closed</div></div>
            <div><span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatINR(outstandingRecovered.open)}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Still open</div></div>
          </div>
        </div>

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <FunnelRow label="Parties in recovery" value={rows.length} max={rows.length} color="var(--blue)" />
            <FunnelRow label="Emailed at least once" value={new Set(sentEmails.map((e) => e.row.id)).size} max={rows.length} color="var(--purple)" />
            <FunnelRow label="Customer replied" value={repliedThreads.length} max={rows.length} color="var(--orange)" />
            <FunnelRow label="Closed / recovered" value={rows.filter((r) => String(r.closed).toLowerCase() === 'yes' || String(r.status).toLowerCase() === 'closed').length} max={rows.length} color="var(--green)" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ Shared ------------------------------ */

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

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', width: '150px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: '700', width: '36px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/** Renders an HTML email body sandboxed in an iframe (srcDoc), or plain text if it isn't HTML. */
function EmailBody({ html, compact = false }: { html: string; compact?: boolean }) {
  const looksHtml = /<\s*(html|body|table|div|p|h1|td|tr)[\s>]/i.test(html);
  const [open, setOpen] = useState(false);

  if (!looksHtml) {
    return <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-secondary)' }}>{html}</p>;
  }

  return (
    <>
      <div
        style={{
          border: '1px solid var(--separator)',
          borderRadius: '10px',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <iframe
          title="email-body"
          srcDoc={html}
          sandbox=""
          style={{ width: '100%', height: compact ? '320px' : '520px', border: 'none', display: 'block' }}
        />
      </div>
      <button
        className="btn-secondary"
        onClick={() => setOpen(true)}
        style={{ marginTop: '8px', fontSize: '12px', padding: '6px 12px' }}
      >
        Open full size
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '760px',
              maxWidth: '100%',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-layer1, #1c1c1e)',
              borderRadius: '14px',
              border: '1px solid var(--separator)',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: '1px solid var(--separator)',
                flexShrink: 0,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--label-primary)' }}>Email preview</span>
              <button className="btn-icon" onClick={() => setOpen(false)}><X size={14} /></button>
            </div>
            <iframe
              title="email-full"
              srcDoc={html}
              sandbox=""
              style={{ flex: 1, width: '100%', border: 'none', background: '#fff', display: 'block' }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
