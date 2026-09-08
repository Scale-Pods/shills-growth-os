'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import {
  MessageSquare,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Reply,
  Search,
  Clock,
  Users,
  CheckCheck,
  TrendingUp,
} from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  normalizeConversation,
  parseConversationTimestamp,
  parseAmount,
  formatINR,
  type RecoveryOutreachRow,
  type ConversationEntry,
} from '@/lib/supabase/receivables';

type WaView = 'dashboard' | 'chats' | 'leads' | 'analytics';

interface WaThread {
  row: RecoveryOutreachRow;
  entries: Array<ConversationEntry & { _at: Date | null }>;
  waStartedAt: Date | null; // from wa_1_sent_at
}

function isInbound(entry: ConversationEntry): boolean {
  const role = (entry.role || '').toLowerCase();
  return role !== 'business' && role !== 'system' && role !== 'agent';
}

/** Every row that actually has a wa_conversation (not null / not empty). */
function buildThreads(rows: RecoveryOutreachRow[]): WaThread[] {
  return rows
    .map((row) => {
      const entries = normalizeConversation(row.wa_conversation)
        .map((e) => ({ ...e, _at: parseConversationTimestamp(e.timestamp) }))
        .sort((a, b) => (a._at?.getTime() ?? 0) - (b._at?.getTime() ?? 0));
      return { row, entries, waStartedAt: parseConversationTimestamp(row.wa_1_sent_at) };
    })
    .filter((t) => t.entries.length > 0);
}

export default function WhatsappSection({ rows, view }: { rows: RecoveryOutreachRow[]; view: WaView }) {
  const { dateRange, dateLabel } = useAppContext();

  const threads = useMemo(() => {
    return buildThreads(rows)
      .filter((t) => {
        // Connect the date filter through wa_1_sent_at, falling back to the
        // latest message timestamp when wa_1_sent_at is missing.
        const anchor = t.waStartedAt ?? t.entries[t.entries.length - 1]?._at ?? null;
        return anchor ? isWithinDateRange(anchor, dateRange) : true;
      })
      .sort((a, b) => {
        const al = a.entries[a.entries.length - 1]?._at?.getTime() ?? a.waStartedAt?.getTime() ?? 0;
        const bl = b.entries[b.entries.length - 1]?._at?.getTime() ?? b.waStartedAt?.getTime() ?? 0;
        return bl - al;
      });
  }, [rows, dateRange]);

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>
          {view === 'dashboard' && 'WhatsApp — Dashboard'}
          {view === 'chats' && 'WhatsApp — Chats'}
          {view === 'leads' && 'WhatsApp — Leads'}
          {view === 'analytics' && 'WhatsApp — Analytics'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          Recovery WhatsApp outreach from <code>recovery_outreach.wa_conversation</code>
          {dateLabel ? ` · ${dateLabel}` : ''}.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      {header}
      {view === 'dashboard' && <WaDashboard rows={rows} threads={threads} />}
      {view === 'chats' && <WaChats threads={threads} />}
      {view === 'leads' && <WaLeads threads={threads} />}
      {view === 'analytics' && <WaAnalytics rows={rows} threads={threads} />}
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function WaDashboard({ rows, threads }: { rows: RecoveryOutreachRow[]; threads: WaThread[] }) {
  const allEntries = threads.flatMap((t) => t.entries);
  const inbound = allEntries.filter(isInbound).length;
  const outbound = allEntries.length - inbound;
  const replied = threads.filter((t) => t.entries.some(isInbound)).length;
  const awaiting = threads.length - replied;
  const replyRate = threads.length > 0 ? Math.round((replied / threads.length) * 100) : 0;

  const outstandingInPlay = threads.reduce((sum, t) => sum + parseAmount(t.row.total_outstanding), 0);

  const recent = threads.slice(0, 8);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--green)" label="Active Chats" value={threads.length} icon={<MessageSquare size={12} />} sub="Have a wa_conversation" />
        <Tile accent="var(--blue)" label="Inbound Messages" value={inbound} icon={<ArrowDownLeft size={12} />} sub="From customers" />
        <Tile accent="var(--purple)" label="Outbound Messages" value={outbound} icon={<ArrowUpRight size={12} />} sub="From Shills" />
        <Tile accent="var(--orange)" label="Reply Rate" value={`${replyRate}%`} icon={<Reply size={12} />} sub={`${awaiting} awaiting`} />
      </div>

      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Outstanding in active chats</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--label-primary)' }}>{formatINR(outstandingInPlay)}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Avg. messages / chat</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--label-primary)' }}>
              {threads.length ? (allEntries.length / threads.length).toFixed(1) : '0'}
            </div>
          </div>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recent Chats</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Party</th>
                <th style={{ padding: '12px 8px' }}>Phone</th>
                <th style={{ padding: '12px 8px' }}>Messages</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px' }}>WA 1 Sent</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No chats in range.</td></tr>
              ) : (
                recent.map((t) => {
                  const repliedT = t.entries.some(isInbound);
                  return (
                    <tr key={t.row.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '700' }}>{t.row.party_name ?? '—'}</td>
                      <td style={{ padding: '12px 8px' }}>{t.row.phone ?? '—'}</td>
                      <td style={{ padding: '12px 8px' }}>{t.entries.length}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${repliedT ? 'badge-green' : 'badge-orange'}`}>{repliedT ? 'Replied' : 'Awaiting'}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{t.row.wa_1_sent_at ?? '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------- Chats ------------------------------- */

function WaChats({ threads }: { threads: WaThread[] }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      [t.row.party_name, t.row.phone, t.row.bill_no].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [threads, search]);

  const active = filtered.find((t) => t.row.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '620px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>No chats.</div>
          ) : (
            filtered.map((t) => {
              const last = t.entries[t.entries.length - 1];
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
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{t.row.party_name ?? '—'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {last ? `${isInbound(last) ? '← ' : '→ '}${last.message.replace(/\s+/g, ' ').slice(0, 54)}` : ''}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '0', minHeight: '480px', overflow: 'hidden' }}>
        {!active ? (
          <div style={{ textAlign: 'center', color: 'var(--label-tertiary)', padding: '80px 0' }}>Select a chat.</div>
        ) : (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--separator)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>{active.row.party_name ?? '—'}</h3>
                <span style={{ fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                  {active.row.phone ?? '—'} · Bill {active.row.bill_no ?? '—'} · Outstanding{' '}
                  {active.row.total_outstanding ? formatINR(parseAmount(active.row.total_outstanding)) : '—'}
                </span>
              </div>
              {active.row.current_stage && <span className="badge badge-blue">{active.row.current_stage}</span>}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '20px',
                maxHeight: '560px',
                overflowY: 'auto',
                background: 'var(--fill-quaternary)',
              }}
            >
              {active.entries.map((entry, idx) => {
                const inbound = isInbound(entry);
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: inbound ? 'flex-start' : 'flex-end',
                      maxWidth: '78%',
                      background: inbound ? 'var(--bg-layer1, #fff)' : 'rgba(37, 211, 102, 0.16)',
                      border: '1px solid var(--separator)',
                      padding: '9px 13px',
                      borderRadius: inbound ? '2px 12px 12px 12px' : '12px 2px 12px 12px',
                    }}
                  >
                    {entry.stage && (
                      <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                        {entry.stage}
                      </span>
                    )}
                    <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-primary)' }}>{entry.message}</p>
                    <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      {entry.timestamp ?? ''}
                      {!inbound && <CheckCheck size={12} style={{ color: 'var(--blue)' }} />}
                    </span>
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

/* ------------------------------- Leads ------------------------------- */

function WaLeads({ threads }: { threads: WaThread[] }) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const stages = useMemo(
    () => Array.from(new Set(threads.map((t) => t.row.current_stage).filter(Boolean))).sort() as string[],
    [threads]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      const matchesSearch =
        !q ||
        [t.row.party_name, t.row.phone, t.row.bill_no, t.row.gstin].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      const matchesStage = stageFilter === 'all' || t.row.current_stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [threads, search, stageFilter]);

  const replied = filtered.filter((t) => t.entries.some(isInbound)).length;

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--blue)" label="WhatsApp Leads" value={filtered.length} icon={<Users size={12} />} sub="With a conversation" />
        <Tile accent="var(--green)" label="Replied" value={replied} icon={<Reply size={12} />} sub="At least one inbound" />
        <Tile accent="var(--orange)" label="Awaiting" value={filtered.length - replied} icon={<Clock size={12} />} sub="No reply yet" />
        <Tile
          accent="var(--purple)"
          label="Outstanding"
          value={formatINR(filtered.reduce((s, t) => s + parseAmount(t.row.total_outstanding), 0))}
          icon={<TrendingUp size={12} />}
          sub="Across leads"
        />
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Leads (has <code>wa_conversation</code>)</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
              <input
                type="text"
                placeholder="Search party, phone, GSTIN..."
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 12px 8px 30px', fontSize: '13px', width: '220px' }}
              />
            </div>
            <select className="input" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ padding: '8px', fontSize: '13px' }}>
              <option value="all">All Stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Party</th>
                <th style={{ padding: '12px 8px' }}>Contact</th>
                <th style={{ padding: '12px 8px' }}>Bill No.</th>
                <th style={{ padding: '12px 8px' }}>Outstanding</th>
                <th style={{ padding: '12px 8px' }}>Stage</th>
                <th style={{ padding: '12px 8px' }}>Messages</th>
                <th style={{ padding: '12px 8px' }}>WA 1 Sent</th>
                <th style={{ padding: '12px 8px' }}>Last Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No leads match this filter.</td></tr>
              ) : (
                filtered.map((t) => {
                  const last = t.entries[t.entries.length - 1];
                  return (
                    <tr key={t.row.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontWeight: '700', display: 'block' }}>{t.row.party_name ?? '—'}</span>
                        {t.row.gstin && <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)' }}>GSTIN: {t.row.gstin}</span>}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ display: 'block' }}>{t.row.phone ?? '—'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{t.row.email ?? '—'}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{t.row.bill_no ?? '—'}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '600' }}>
                        {t.row.total_outstanding ? formatINR(parseAmount(t.row.total_outstanding)) : '—'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${t.entries.some(isInbound) ? 'badge-green' : 'badge-orange'}`}>
                          {t.row.current_stage ?? (t.entries.some(isInbound) ? 'Replied' : 'Awaiting')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{t.entries.length}</td>
                      <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{t.row.wa_1_sent_at ?? '—'}</td>
                      <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{last?.timestamp ?? '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ---------------------------- Analytics ---------------------------- */

function WaAnalytics({ rows, threads }: { rows: RecoveryOutreachRow[]; threads: WaThread[] }) {
  const allEntries = threads.flatMap((t) => t.entries);
  const inbound = allEntries.filter(isInbound).length;
  const outbound = allEntries.length - inbound;
  const repliedThreads = threads.filter((t) => t.entries.some(isInbound));
  const replyRate = threads.length > 0 ? Math.round((repliedThreads.length / threads.length) * 100) : 0;

  // WA steps sent (wa_1/2/3_sent_at present)
  const stepSent = [
    rows.filter((r) => r.wa_1_sent_at && r.wa_1_content).length,
    rows.filter((r) => r.wa_2_sent_at && r.wa_2_content).length,
    rows.filter((r) => r.wa_3_sent_at && r.wa_3_content).length,
  ];

  const responseHours: number[] = [];
  for (const t of threads) {
    const firstOut = t.entries.find((e) => !isInbound(e))?._at ?? t.waStartedAt;
    const firstIn = t.entries.find((e) => isInbound(e))?._at ?? null;
    if (firstOut && firstIn && firstIn.getTime() > firstOut.getTime()) {
      responseHours.push((firstIn.getTime() - firstOut.getTime()) / 3_600_000);
    }
  }
  const avgResponse = responseHours.length ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length : null;

  const sentimentCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of threads) {
      if (!t.row.sentiment) continue;
      const s = t.row.sentiment.trim().toLowerCase();
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [threads]);

  const recoveredValue = threads
    .filter((t) => String(t.row.closed).toLowerCase() === 'yes' || String(t.row.status).toLowerCase() === 'closed')
    .reduce((s, t) => s + parseAmount(t.row.total_outstanding), 0);
  const openValue = threads
    .filter((t) => !(String(t.row.closed).toLowerCase() === 'yes' || String(t.row.status).toLowerCase() === 'closed'))
    .reduce((s, t) => s + parseAmount(t.row.total_outstanding), 0);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--green)" label="Messages Exchanged" value={allEntries.length} icon={<MessageSquare size={12} />} sub={`${outbound} out / ${inbound} in`} />
        <Tile accent="var(--blue)" label="Reply Rate" value={`${replyRate}%`} icon={<Reply size={12} />} sub={`${repliedThreads.length}/${threads.length} chats`} />
        <Tile accent="var(--purple)" label="Avg. Response Time" value={avgResponse != null ? `${avgResponse.toFixed(1)}h` : '—'} icon={<Clock size={12} />} sub="First customer reply" />
        <Tile accent="var(--orange)" label="Recovered Value" value={formatINR(recoveredValue)} icon={<CheckCheck size={12} />} sub="Closed chats" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>WhatsApp Messages by Step</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['WA 1', 'WA 2', 'WA 3'].map((label, i) => {
              const max = Math.max(...stepSent, 1);
              const pct = Math.round((stepSent[i] / max) * 100);
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', width: '60px', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', width: '32px', textAlign: 'right' }}>{stepSent[i]}</span>
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

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Engagement Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <FunnelRow label="WA sent (step 1)" value={stepSent[0]} max={Math.max(stepSent[0], threads.length, 1)} color="var(--blue)" />
            <FunnelRow label="Chats with a thread" value={threads.length} max={Math.max(stepSent[0], threads.length, 1)} color="var(--purple)" />
            <FunnelRow label="Customer replied" value={repliedThreads.length} max={Math.max(stepSent[0], threads.length, 1)} color="var(--orange)" />
            <FunnelRow
              label="Closed / recovered"
              value={threads.filter((t) => String(t.row.closed).toLowerCase() === 'yes' || String(t.row.status).toLowerCase() === 'closed').length}
              max={Math.max(stepSent[0], threads.length, 1)}
              color="var(--green)"
            />
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
