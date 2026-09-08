'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import { Phone, PhoneCall, Search, Clock, Reply, X } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  normalizeConversation,
  parseConversationTimestamp,
  parseAmount,
  formatINR,
  type RecoveryOutreachRow,
  type ConversationEntry,
} from '@/lib/supabase/receivables';

interface CallItem {
  row: RecoveryOutreachRow;
  step: number;
  content: string;
  sentAt: string | null;
  sentAtDate: Date | null;
}

function collectCalls(rows: RecoveryOutreachRow[]): CallItem[] {
  const out: CallItem[] = [];
  for (const row of rows) {
    const steps: Array<[number, string | null, string | null]> = [
      [1, row.call_1_content, row.call_1_sent_at],
      [2, row.call_2_content, row.call_2_sent_at],
    ];
    for (const [step, content, sentAt] of steps) {
      if (!sentAt) continue;
      if (!content || !content.trim()) continue;
      out.push({ row, step, content, sentAt, sentAtDate: parseConversationTimestamp(sentAt) });
    }
  }
  return out;
}

function isInbound(entry: ConversationEntry): boolean {
  const role = (entry.role || '').toLowerCase();
  return role !== 'business' && role !== 'system' && role !== 'agent';
}

export default function VoiceClient({ rows }: { rows: RecoveryOutreachRow[] }) {
  const { dateRange, dateLabel } = useAppContext();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CallItem | null>(null);

  const calls = useMemo(() => {
    return collectCalls(rows)
      .filter((c) => (c.sentAtDate ? isWithinDateRange(c.sentAtDate, dateRange) : true))
      .sort((a, b) => (b.sentAtDate?.getTime() ?? 0) - (a.sentAtDate?.getTime() ?? 0));
  }, [rows, dateRange]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return calls;
    return calls.filter((c) =>
      [c.row.party_name, c.row.phone, c.row.bill_no].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [calls, search]);

  const repliedCount = useMemo(
    () =>
      rows.filter((r) => {
        const conv = normalizeConversation(r.call_conversation);
        return conv.some(isInbound) || (r.call_replied && r.call_replied.trim().toLowerCase() === 'yes');
      }).length,
    [rows]
  );

  const active = selected ?? filtered[0] ?? null;
  const activeConversation = active ? normalizeConversation(active.row.call_conversation) : [];

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Voice Panel</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            AI voice call logs from <code>recovery_outreach</code>
            {dateLabel ? ` · ${dateLabel}` : ''}.
          </p>
        </div>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Calls Placed</span>
          <span className="value">{filtered.length}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><PhoneCall size={12} /> In range</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Calls with a Reply</span>
          <span className="value">{repliedCount}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><Reply size={12} /> call_replied / conversation</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Outstanding in Calls</span>
          <span className="value">{formatINR(filtered.reduce((s, c) => s + parseAmount(c.row.total_outstanding), 0))}</span>
          <span className="trend up" style={{ color: 'var(--orange)' }}><Clock size={12} /> Total</span>
        </div>
      </div>

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
              filtered.map((c, i) => (
                <button
                  key={`${c.row.id}-${c.step}-${i}`}
                  onClick={() => setSelected(c)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left',
                    padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: active === c ? 'var(--fill-tertiary)' : 'transparent',
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
                {active.row.phone ?? '—'} · Bill {active.row.bill_no ?? '—'} · Outstanding{' '}
                {active.row.total_outstanding ? formatINR(parseAmount(active.row.total_outstanding)) : '—'}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Call Script</span>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12.5px', fontFamily: 'var(--font-mono)', background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '10px', color: 'var(--label-primary)', lineHeight: '1.5', marginTop: '6px' }}>
                  {active.content}
                </pre>
              </div>

              {activeConversation.length > 0 && (
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Call Transcript</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                    {activeConversation.map((entry, idx) => {
                      const inbound = isInbound(entry);
                      return (
                        <div
                          key={idx}
                          style={{
                            alignSelf: inbound ? 'flex-start' : 'flex-end',
                            maxWidth: '78%',
                            background: inbound ? 'var(--fill-tertiary)' : 'rgba(175, 82, 222, 0.14)',
                            padding: '9px 13px',
                            borderRadius: '12px',
                          }}
                        >
                          {entry.stage && (
                            <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>{entry.stage}</span>
                          )}
                          <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{entry.message}</p>
                          <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', display: 'block', marginTop: '4px' }}>{entry.timestamp ?? ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
