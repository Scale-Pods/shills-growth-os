'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import {
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Reply,
  Search,
  Clock,
  Users,
  Check,
  CheckCheck,
  TrendingUp,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import { normalizeTranscript } from '@/lib/supabase/transcript';
import { parseSentiment, type Salon, type TranscriptEntry } from '@/lib/supabase/salonCrm';

type WaView = 'dashboard' | 'chats' | 'leads' | 'analytics';

interface WaThread {
  salon: Salon;
  entries: TranscriptEntry[];
  lastAt: string | null;
}

type DeliveryState = 'sent' | 'delivered' | 'read' | 'failed' | 'unknown';

/** Parse the raw transcript entry status ("delivered", "failed: <title> (<details>)", ...)
 * into a normalized state plus a human-readable detail string for failures. */
function parseDeliveryStatus(raw: string | null | undefined): { state: DeliveryState; detail: string | null } {
  if (!raw) return { state: 'unknown', detail: null };
  const lower = raw.toLowerCase();
  if (lower.startsWith('failed')) {
    const detail = raw.slice(raw.indexOf(':') + 1).trim() || null;
    return { state: 'failed', detail };
  }
  if (lower === 'read') return { state: 'read', detail: null };
  if (lower === 'delivered') return { state: 'delivered', detail: null };
  if (lower === 'sent') return { state: 'sent', detail: null };
  return { state: 'unknown', detail: raw };
}

function deliveryStateColor(state: DeliveryState): string {
  switch (state) {
    case 'read': return 'var(--green)';
    case 'delivered': return 'var(--blue)';
    case 'sent': return 'var(--label-tertiary)';
    case 'failed': return 'var(--red)';
    default: return 'var(--label-tertiary)';
  }
}

function DeliveryIcon({ state, size = 12 }: { state: DeliveryState; size?: number }) {
  const color = deliveryStateColor(state);
  if (state === 'failed') return <AlertCircle size={size} style={{ color }} />;
  if (state === 'read' || state === 'delivered') return <CheckCheck size={size} style={{ color }} />;
  if (state === 'sent') return <Check size={size} style={{ color }} />;
  return null;
}

function buildThreads(salons: Salon[]): WaThread[] {
  return salons
    .map((salon) => {
      const entries = normalizeTranscript(salon.conversation_transcript)
        .slice()
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
      return { salon, entries, lastAt: entries[entries.length - 1]?.at ?? null };
    })
    .filter((t) => t.entries.length > 0);
}

export default function WhatsappSection({ salons, view }: { salons: Salon[]; view: WaView }) {
  const { dateRange, dateLabel } = useAppContext();

  const threads = useMemo(() => {
    return buildThreads(salons)
      .filter((t) => {
        // Anchor the date filter on whatsapp_last_reply_at, falling back to the
        // latest message timestamp when there is no recorded reply.
        const anchor = t.salon.whatsapp_last_reply_at ?? t.lastAt;
        return anchor ? isWithinDateRange(anchor, dateRange) : true;
      })
      .sort((a, b) => new Date(b.lastAt ?? 0).getTime() - new Date(a.lastAt ?? 0).getTime());
  }, [salons, dateRange]);

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>
            {view === 'dashboard' && 'WhatsApp — Dashboard'}
            {view === 'chats' && 'WhatsApp — Chats'}
            {view === 'leads' && 'WhatsApp — Leads'}
            {view === 'analytics' && 'WhatsApp — Analytics'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Salon CRM WhatsApp threads from <code>salons.conversation_transcript</code>
            {dateLabel ? ` · ${dateLabel}` : ''}.
          </p>
        </div>
      </div>

      {view === 'dashboard' && <WaDashboard threads={threads} />}
      {view === 'chats' && <WaChats threads={threads} />}
      {view === 'leads' && <WaLeads threads={threads} />}
      {view === 'analytics' && <WaAnalytics threads={threads} />}
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function WaDashboard({ threads }: { threads: WaThread[] }) {
  const allEntries = threads.flatMap((t) => t.entries);
  const inbound = allEntries.filter((e) => e.direction === 'inbound').length;
  const outbound = allEntries.length - inbound;
  const replied = threads.filter((t) => t.entries.some((e) => e.direction === 'inbound')).length;
  const awaiting = threads.length - replied;
  const replyRate = threads.length > 0 ? Math.round((replied / threads.length) * 100) : 0;

  const recent = threads.slice(0, 8);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--green)" label="Active Chats" value={threads.length} icon={<MessageSquare size={12} />} sub="Salons with a thread" />
        <Tile accent="var(--blue)" label="Inbound Messages" value={inbound} icon={<ArrowDownLeft size={12} />} sub="From salons" />
        <Tile accent="var(--purple)" label="Outbound Messages" value={outbound} icon={<ArrowUpRight size={12} />} sub="From Shills" />
        <Tile accent="var(--orange)" label="Reply Rate" value={`${replyRate}%`} icon={<Reply size={12} />} sub={`${awaiting} awaiting`} />
      </div>

      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Avg. messages / chat</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--label-primary)' }}>
              {threads.length ? (allEntries.length / threads.length).toFixed(1) : '0'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Positive sentiment</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)' }}>
              {threads.filter((t) => parseSentiment(t.salon.whatsapp_sentiment).interest === 'positive').length}
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
                <th style={{ padding: '12px 8px' }}>Salon</th>
                <th style={{ padding: '12px 8px' }}>Number</th>
                <th style={{ padding: '12px 8px' }}>Messages</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px' }}>Last Reply</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No chats in range.</td></tr>
              ) : (
                recent.map((t) => {
                  const repliedT = t.entries.some((e) => e.direction === 'inbound');
                  return (
                    <tr key={t.salon.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '700' }}>{t.salon.salon_name}</td>
                      <td style={{ padding: '12px 8px' }}>{t.salon.whatsapp_number ?? t.salon.phone ?? '—'}</td>
                      <td style={{ padding: '12px 8px' }}>{t.entries.length}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${repliedT ? 'badge-green' : 'badge-orange'}`}>{repliedT ? 'Replied' : 'Awaiting'}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                        {t.salon.whatsapp_last_reply_at ? new Date(t.salon.whatsapp_last_reply_at).toLocaleString() : '—'}
                      </td>
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
  const { showToast } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DeliveryState>('all');

  const stages = useMemo(
    () => Array.from(new Set(threads.map((t) => t.salon.current_stage).filter(Boolean))).sort(),
    [threads]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      const matchesSearch =
        !q || [t.salon.salon_name, t.salon.whatsapp_number, t.salon.phone, t.salon.city].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      const matchesStage = stageFilter === 'all' || t.salon.current_stage === stageFilter;
      const last = t.entries[t.entries.length - 1];
      const lastOutbound = [...t.entries].reverse().find((e) => e.direction === 'outbound');
      const lastState = lastOutbound ? parseDeliveryStatus(lastOutbound.status).state : 'unknown';
      const matchesStatus = statusFilter === 'all' || lastState === statusFilter;
      return matchesSearch && matchesStage && matchesStatus && Boolean(last);
    });
  }, [threads, search, stageFilter, statusFilter]);

  const active = filtered.find((t) => t.salon.id === selectedId) ?? filtered[0] ?? null;

  const copyShareLink = (phone: string, salonId: string) => {
    const url = `${window.location.origin}/share/whatsapp/${encodeURIComponent(phone)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(salonId);
    showToast('Public share link copied to clipboard.', 'success');
    setTimeout(() => setCopiedId((id) => (id === salonId ? null : id)), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
      <div className="liquid-card" style={{ padding: '16px' }}>
        <SearchBox value={search} onChange={setSearch} placeholder="Search salon or number..." />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <select
            className="input"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{ padding: '7px 8px', fontSize: '12px', flex: 1, color: 'var(--label-primary)' }}
          >
            <option value="all">All stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | DeliveryState)}
            style={{ padding: '7px 8px', fontSize: '12px', flex: 1, color: 'var(--label-primary)' }}
          >
            <option value="all">All status</option>
            <option value="read">Read</option>
            <option value="delivered">Delivered</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '560px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <Empty text="No chats match this filter." />
          ) : (
            filtered.map((t) => {
              const last = t.entries[t.entries.length - 1];
              const lastOutbound = [...t.entries].reverse().find((e) => e.direction === 'outbound');
              const lastDelivery = lastOutbound ? parseDeliveryStatus(lastOutbound.status) : null;
              return (
                <button key={t.salon.id} onClick={() => setSelectedId(t.salon.id)} style={rowBtnStyle(active?.salon.id === t.salon.id)}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--label-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.salon.salon_name}
                    </span>
                    {lastDelivery && lastDelivery.state !== 'unknown' && (
                      <DeliveryIcon state={lastDelivery.state} size={13} />
                    )}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--label-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {last ? `${last.direction === 'inbound' ? '← ' : '→ '}${last.message.replace(/\s+/g, ' ').slice(0, 54)}` : ''}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '0', minHeight: '480px', overflow: 'hidden' }}>
        {!active ? (
          <Empty text="Select a chat." pad />
        ) : (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--separator)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--label-primary)' }}>{active.salon.salon_name}</h3>
                <span style={{ fontSize: '11.5px', color: 'var(--label-secondary)' }}>
                  {active.salon.whatsapp_number ?? active.salon.phone ?? '—'} · {active.salon.city ?? active.salon.region}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{active.salon.current_stage.replace(/_/g, ' ')}</span>
                {active.salon.whatsapp_number && (
                  <button
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => copyShareLink(active.salon.whatsapp_number!, active.salon.id)}
                  >
                    {copiedId === active.salon.id ? <Check size={13} style={{ color: 'var(--green)' }} /> : <Link2 size={13} />}
                    {copiedId === active.salon.id ? 'Copied' : 'Share'}
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px',
                maxHeight: '560px', overflowY: 'auto', background: 'var(--fill-quaternary)',
              }}
            >
              {active.entries.map((entry, idx) => {
                const inbound = entry.direction === 'inbound';
                const delivery = !inbound ? parseDeliveryStatus(entry.status) : null;
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: inbound ? 'flex-start' : 'flex-end',
                      maxWidth: '78%',
                      background: inbound ? 'var(--bg-layer1, #fff)' : 'rgba(37, 211, 102, 0.16)',
                      border: delivery?.state === 'failed' ? '1px solid var(--red)' : '1px solid var(--separator)',
                      padding: '9px 13px',
                      borderRadius: inbound ? '2px 12px 12px 12px' : '12px 2px 12px 12px',
                    }}
                  >
                    <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-primary)' }}>{entry.message}</p>
                    <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      {new Date(entry.at).toLocaleString()}
                      {delivery && delivery.state !== 'unknown' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: deliveryStateColor(delivery.state) }} title={delivery.detail ?? delivery.state}>
                          <DeliveryIcon state={delivery.state} size={12} />
                          <span style={{ textTransform: 'capitalize' }}>{delivery.state}</span>
                        </span>
                      )}
                    </span>
                    {delivery?.state === 'failed' && delivery.detail && (
                      <p style={{ fontSize: '10.5px', color: 'var(--red)', margin: '4px 0 0', textAlign: 'right' }}>{delivery.detail}</p>
                    )}
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
    () => Array.from(new Set(threads.map((t) => t.salon.current_stage).filter(Boolean))).sort(),
    [threads]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      const matchesSearch =
        !q || [t.salon.salon_name, t.salon.whatsapp_number, t.salon.phone, t.salon.city].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      const matchesStage = stageFilter === 'all' || t.salon.current_stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [threads, search, stageFilter]);

  const replied = filtered.filter((t) => t.entries.some((e) => e.direction === 'inbound')).length;
  const positive = filtered.filter((t) => parseSentiment(t.salon.whatsapp_sentiment).interest === 'positive').length;

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--blue)" label="WhatsApp Leads" value={filtered.length} icon={<Users size={12} />} sub="With a conversation" />
        <Tile accent="var(--green)" label="Replied" value={replied} icon={<Reply size={12} />} sub="At least one inbound" />
        <Tile accent="var(--orange)" label="Awaiting" value={filtered.length - replied} icon={<Clock size={12} />} sub="No reply yet" />
        <Tile accent="var(--purple)" label="Positive Signals" value={positive} icon={<TrendingUp size={12} />} sub="whatsapp_sentiment" />
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Leads (has <code>conversation_transcript</code>)</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
              <input
                type="text"
                placeholder="Search salon, number, city..."
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 12px 8px 30px', fontSize: '13px', width: '220px' }}
              />
            </div>
            <select className="input" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ padding: '8px', fontSize: '13px' }}>
              <option value="all">All Stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Salon</th>
                <th style={{ padding: '12px 8px' }}>Contact</th>
                <th style={{ padding: '12px 8px' }}>Region / City</th>
                <th style={{ padding: '12px 8px' }}>Stage</th>
                <th style={{ padding: '12px 8px' }}>Messages</th>
                <th style={{ padding: '12px 8px' }}>Sentiment</th>
                <th style={{ padding: '12px 8px' }}>Last Reply</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No leads match this filter.</td></tr>
              ) : (
                filtered.map((t) => {
                  const sentiment = parseSentiment(t.salon.whatsapp_sentiment);
                  return (
                    <tr key={t.salon.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontWeight: '700', display: 'block' }}>{t.salon.salon_name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{t.salon.category}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ display: 'block' }}>{t.salon.whatsapp_number ?? t.salon.phone ?? '—'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{t.salon.email ?? '—'}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{t.salon.city ?? t.salon.region}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${t.salon.current_stage === 'won' ? 'badge-green' : t.salon.current_stage === 'lost' ? 'badge-red' : 'badge-blue'}`} style={{ textTransform: 'capitalize' }}>
                          {t.salon.current_stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{t.entries.length}</td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: sentiment.interest === 'positive' ? 'var(--green)' : sentiment.interest === 'negative' || sentiment.interest === 'not_interested' ? 'var(--red)' : 'var(--label-secondary)', textTransform: 'capitalize' }}>
                        {sentiment.interest ?? '—'}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                        {t.salon.whatsapp_last_reply_at ? new Date(t.salon.whatsapp_last_reply_at).toLocaleString() : '—'}
                      </td>
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

function WaAnalytics({ threads }: { threads: WaThread[] }) {
  const allEntries = threads.flatMap((t) => t.entries);
  const inbound = allEntries.filter((e) => e.direction === 'inbound').length;
  const outbound = allEntries.length - inbound;
  const repliedThreads = threads.filter((t) => t.entries.some((e) => e.direction === 'inbound'));
  const replyRate = threads.length > 0 ? Math.round((repliedThreads.length / threads.length) * 100) : 0;

  const responseHours: number[] = [];
  for (const t of threads) {
    const firstOut = t.entries.find((e) => e.direction === 'outbound')?.at ?? null;
    const firstIn = t.entries.find((e) => e.direction === 'inbound')?.at ?? null;
    if (firstOut && firstIn && new Date(firstIn).getTime() > new Date(firstOut).getTime()) {
      responseHours.push((new Date(firstIn).getTime() - new Date(firstOut).getTime()) / 3_600_000);
    }
  }
  const avgResponse = responseHours.length ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length : null;

  const sentimentCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of threads) {
      const s = parseSentiment(t.salon.whatsapp_sentiment).interest;
      if (!s) continue;
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [threads]);

  const wonCount = threads.filter((t) => t.salon.current_stage === 'won').length;
  const lostCount = threads.filter((t) => t.salon.current_stage === 'lost').length;

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--green)" label="Messages Exchanged" value={allEntries.length} icon={<MessageSquare size={12} />} sub={`${outbound} out / ${inbound} in`} />
        <Tile accent="var(--blue)" label="Reply Rate" value={`${replyRate}%`} icon={<Reply size={12} />} sub={`${repliedThreads.length}/${threads.length} chats`} />
        <Tile accent="var(--purple)" label="Avg. Response Time" value={avgResponse != null ? `${avgResponse.toFixed(1)}h` : '—'} icon={<Clock size={12} />} sub="First salon reply" />
        <Tile accent="var(--orange)" label="Won from WhatsApp" value={wonCount} icon={<CheckCheck size={12} />} sub={`${lostCount} lost`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Inbound vs Outbound</h3>
          <div style={{ height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', background: 'var(--fill-tertiary)', marginBottom: '16px' }}>
            {(() => {
              const total = inbound + outbound || 1;
              const oPct = Math.round((outbound / total) * 100);
              return (
                <>
                  <div style={{ width: `${oPct}%`, background: 'var(--purple)' }} title={`Outbound ${outbound}`} />
                  <div style={{ width: `${100 - oPct}%`, background: 'var(--blue)' }} title={`Inbound ${inbound}`} />
                </>
              );
            })()}
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
            <div><span style={{ color: 'var(--purple)', fontWeight: 700 }}>{outbound}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Outbound</div></div>
            <div><span style={{ color: 'var(--blue)', fontWeight: 700 }}>{inbound}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Inbound</div></div>
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
                const color = s.startsWith('pos') ? 'var(--green)' : s.startsWith('neg') || s === 'not_interested' ? 'var(--red)' : 'var(--orange)';
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', width: '110px', flexShrink: 0, textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</span>
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
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Engagement Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <FunnelRow label="Chats started" value={threads.length} max={Math.max(threads.length, 1)} color="var(--blue)" />
            <FunnelRow label="Salon replied" value={repliedThreads.length} max={Math.max(threads.length, 1)} color="var(--purple)" />
            <FunnelRow label="Positive sentiment" value={threads.filter((t) => parseSentiment(t.salon.whatsapp_sentiment).interest === 'positive').length} max={Math.max(threads.length, 1)} color="var(--orange)" />
            <FunnelRow label="Won" value={wonCount} max={Math.max(threads.length, 1)} color="var(--green)" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ Shared ------------------------------ */

function Tile({ accent, label, value, icon, sub }: { accent: string; label: string; value: React.ReactNode; icon: React.ReactNode; sub: string }) {
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

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative', marginBottom: '12px' }}>
      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
      <input
        type="text"
        placeholder={placeholder}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 12px 8px 30px', fontSize: '13px' }}
      />
    </div>
  );
}

function Empty({ text, pad = false }: { text: string; pad?: boolean }) {
  return (
    <div style={{ padding: pad ? '80px 0' : '20px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>{text}</div>
  );
}

function rowBtnStyle(activeRow: boolean): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--label-primary)',
    font: 'inherit',
    background: activeRow ? 'var(--fill-tertiary)' : 'transparent',
  };
}
