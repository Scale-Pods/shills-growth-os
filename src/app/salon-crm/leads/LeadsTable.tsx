'use client';

import React, { useMemo, useState } from 'react';
import type { Salon } from '@/lib/supabase/salonCrm';
import { Search, MapPin, DollarSign, Users, RefreshCw } from 'lucide-react';

const STAGES = [
  'lead_generated',
  'contacted',
  'interested',
  'sample_sent',
  'demo_booked',
  'negotiation',
  'won',
  'lost',
];

const STAGE_BADGE: Record<string, string> = {
  lead_generated: 'badge-blue',
  contacted: 'badge-blue',
  interested: 'badge-orange',
  sample_sent: 'badge-orange',
  demo_booked: 'badge-orange',
  negotiation: 'badge-orange',
  won: 'badge-green',
  lost: 'badge-red',
};

function stageLabel(stage: string) {
  return stage
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function LeadsTable({ initialSalons }: { initialSalons: Salon[] }) {
  const [salons] = useState<Salon[]>(initialSalons);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const regions = useMemo(
    () => Array.from(new Set(salons.map((s) => s.region).filter(Boolean))).sort(),
    [salons]
  );

  const filtered = useMemo(() => {
    return salons.filter((s) => {
      const matchesSearch =
        s.salon_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.city ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === 'all' || s.current_stage === stageFilter;
      const matchesRegion = regionFilter === 'all' || s.region === regionFilter;
      return matchesSearch && matchesStage && matchesRegion;
    });
  }, [salons, search, stageFilter, regionFilter]);

  const activeCount = salons.filter((s) => s.current_stage !== 'won' && s.current_stage !== 'lost').length;
  const wonCount = salons.filter((s) => s.current_stage === 'won').length;

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Salon Leads</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            All salons generated across regions, live from Supabase.
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => window.location.reload()}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Total Leads</span>
          <span className="value">{salons.length}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Users size={12} /> All regions</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Active in Pipeline</span>
          <span className="value">{activeCount}</span>
          <span className="trend up" style={{ color: 'var(--orange)' }}><MapPin size={12} /> Not won/lost</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Won Deals</span>
          <span className="value">{wonCount}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><DollarSign size={12} /> Converted salons</span>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Lead Pipeline</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
              <input
                type="text"
                placeholder="Search name or city..."
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 12px 8px 30px', fontSize: '13px', width: '200px' }}
              />
            </div>
            <select className="input" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ padding: '8px', fontSize: '13px' }}>
              <option value="all">All Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>{stageLabel(s)}</option>
              ))}
            </select>
            <select className="input" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} style={{ padding: '8px', fontSize: '13px' }}>
              <option value="all">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Salon</th>
                <th style={{ padding: '12px 8px' }}>Region / City</th>
                <th style={{ padding: '12px 8px' }}>Contact</th>
                <th style={{ padding: '12px 8px' }}>Source</th>
                <th style={{ padding: '12px 8px' }}>Stage</th>
                <th style={{ padding: '12px 8px' }}>Last Reply</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)' }}>
                    No leads match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ fontWeight: '700', display: 'block' }}>{s.salon_name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{s.category}{s.google_rating ? ` • ${s.google_rating}★` : ''}</span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{s.city ?? s.region}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ display: 'block' }}>{s.whatsapp_number ?? s.phone ?? '—'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{s.email ?? '—'}</span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{s.lead_source}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${STAGE_BADGE[s.current_stage] ?? 'badge-blue'}`}>{stageLabel(s.current_stage)}</span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                      {s.last_reply_at ? new Date(s.last_reply_at).toLocaleString() : 'No reply yet'}
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
