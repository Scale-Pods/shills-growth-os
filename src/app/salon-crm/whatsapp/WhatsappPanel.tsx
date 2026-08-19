'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import type { Salon } from '@/lib/supabase/salonCrm';
import { normalizeTranscript } from '@/lib/supabase/transcript';
import { MessageSquare, ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';

export default function WhatsappPanel({ salons }: { salons: Salon[] }) {
  const { dateRange, dateLabel } = useAppContext();
  const [search, setSearch] = useState('');

  const conversations = useMemo(() => {
    return salons
      .map((s) => ({
        salon: s,
        entries: normalizeTranscript(s.conversation_transcript).filter((e) => isWithinDateRange(e.at, dateRange)),
      }))
      .filter((c) => c.entries.length > 0)
      .map((c) => ({
        salon: c.salon,
        entries: [...c.entries].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
      }))
      .filter((c) => c.salon.salon_name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const aLast = a.entries[a.entries.length - 1]?.at ?? '';
        const bLast = b.entries[b.entries.length - 1]?.at ?? '';
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });
  }, [salons, search, dateRange]);

  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const activeThread = conversations.find((c) => c.salon.id === selectedSalonId) ?? conversations[0];

  const allEntries = useMemo(
    () => salons.flatMap((s) => normalizeTranscript(s.conversation_transcript)).filter((e) => isWithinDateRange(e.at, dateRange)),
    [salons, dateRange]
  );
  const inboundCount = allEntries.filter((e) => e.direction === 'inbound').length;
  const outboundCount = allEntries.filter((e) => e.direction === 'outbound').length;

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>WhatsApp Panel</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Live conversation threads from salons.conversation_transcript — the full running WhatsApp thread per salon.
          </p>
        </div>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Conversations</span>
          <span className="value">{conversations.length}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><MessageSquare size={12} /> Salons with a thread</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Inbound Messages</span>
          <span className="value">{inboundCount}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><ArrowDownLeft size={12} /> From salons</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Outbound Messages</span>
          <span className="value">{outboundCount}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><ArrowUpRight size={12} /> Templates + AI replies</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="liquid-card" style={{ padding: '16px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
            <input
              type="text"
              placeholder="Search salon..."
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 30px', fontSize: '13px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '560px', overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>No conversations yet.</div>
            ) : (
              conversations.map((c) => {
                const last = c.entries[c.entries.length - 1];
                return (
                  <button
                    key={c.salon.id}
                    onClick={() => setSelectedSalonId(c.salon.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left',
                      padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: activeThread?.salon.id === c.salon.id ? 'var(--fill-tertiary)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>{c.salon.salon_name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {last.direction === 'inbound' ? '← ' : '→ '}{last.message}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="liquid-card" style={{ padding: '20px', minHeight: '400px' }}>
          {!activeThread ? (
            <div style={{ textAlign: 'center', color: 'var(--label-tertiary)', padding: '60px 0' }}>Select a conversation.</div>
          ) : (
            <>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>{activeThread.salon.salon_name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
                {activeThread.entries.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: entry.direction === 'inbound' ? 'flex-start' : 'flex-end',
                      maxWidth: '75%',
                      background: entry.direction === 'inbound' ? 'var(--fill-tertiary)' : 'rgba(0, 122, 255, 0.12)',
                      padding: '10px 14px',
                      borderRadius: '12px',
                    }}
                  >
                    <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{entry.message}</p>
                    <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', display: 'block', marginTop: '6px' }}>
                      {new Date(entry.at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
