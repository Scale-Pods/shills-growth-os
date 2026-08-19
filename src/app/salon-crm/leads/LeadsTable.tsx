'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import type { Salon } from '@/lib/supabase/salonCrm';
import { Search, MapPin, DollarSign, Users, RefreshCw, TrendingUp, X, Star, CheckCircle2, XCircle } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';

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
  const { dateRange, dateLabel } = useAppContext();
  const [salons, setSalons] = useState<Salon[]>(initialSalons);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);

  const regions = useMemo(
    () => Array.from(new Set(salons.map((s) => s.region).filter(Boolean))).sort(),
    [salons]
  );

  const dateFiltered = useMemo(
    () => salons.filter((s) => isWithinDateRange(s.created_at, dateRange)),
    [salons, dateRange]
  );

  const filtered = useMemo(() => {
    return dateFiltered.filter((s) => {
      const matchesSearch =
        s.salon_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.city ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === 'all' || s.current_stage === stageFilter;
      const matchesRegion = regionFilter === 'all' || s.region === regionFilter;
      return matchesSearch && matchesStage && matchesRegion;
    });
  }, [dateFiltered, search, stageFilter, regionFilter]);

  const activeCount = dateFiltered.filter((s) => s.current_stage !== 'won' && s.current_stage !== 'lost').length;
  const wonCount = dateFiltered.filter((s) => s.current_stage === 'won').length;
  const interestedCount = dateFiltered.filter((s) => s.current_stage === 'interested').length;

  const updateStage = async (salon: Salon, stage: 'won' | 'lost') => {
    setUpdatingStage(true);
    try {
      const res = await fetch(`/api/salon-crm/salons/${salon.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update stage');
      const { salon: updated } = await res.json();
      setSalons((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setSelectedSalon((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update stage');
    } finally {
      setUpdatingStage(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Salon Leads</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            All salons generated across regions, live from Supabase.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn-secondary"
            onClick={() => window.location.reload()}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Total Leads</span>
          <span className="value">{dateFiltered.length}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Users size={12} /> All regions</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Active in Pipeline</span>
          <span className="value">{activeCount}</span>
          <span className="trend up" style={{ color: 'var(--orange)' }}><MapPin size={12} /> Not won/lost</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Interested Leads</span>
          <span className="value">{interestedCount}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><TrendingUp size={12} /> current_stage = interested</span>
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
                filtered.map((s) => {
                  const lastReply = [s.whatsapp_last_reply_at, s.email_last_reply_at, s.last_reply_at]
                    .filter(Boolean)
                    .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSalon(s)}
                      style={{ borderBottom: '1px solid var(--separator)', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fill-quaternary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
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
                        {lastReply ? new Date(lastReply).toLocaleString() : 'No reply yet'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSalon && (
        <div
          className="spotlight-overlay"
          style={{ display: 'flex' }}
          onClick={() => setSelectedSalon(null)}
        >
          <div className="spotlight-panel" style={{ maxWidth: '620px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
              <div>
                <span style={{ fontWeight: '700', fontSize: '17px', display: 'block' }}>{selectedSalon.salon_name}</span>
                <span className={`badge ${STAGE_BADGE[selectedSalon.current_stage] ?? 'badge-blue'}`} style={{ marginTop: '6px', display: 'inline-block' }}>
                  {stageLabel(selectedSalon.current_stage)}
                </span>
              </div>
              <button className="btn-icon" onClick={() => setSelectedSalon(null)}><X size={16} /></button>
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid var(--separator)', borderBottom: '1px solid var(--separator)', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                <DetailField label="Category" value={selectedSalon.category} />
                <DetailField label="Region" value={selectedSalon.region} />
                <DetailField label="City" value={selectedSalon.city} />
                <DetailField
                  label="Google Rating"
                  value={selectedSalon.google_rating ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={12} style={{ color: 'var(--orange)' }} fill="var(--orange)" />
                      {selectedSalon.google_rating} ({selectedSalon.google_reviews_count ?? 0} reviews)
                    </span>
                  ) : null}
                />
                <DetailField label="Address" value={selectedSalon.address} full />
                <DetailField label="Coordinates" value={selectedSalon.latitude && selectedSalon.longitude ? `${selectedSalon.latitude}, ${selectedSalon.longitude}` : null} />
                <DetailField label="Phone" value={selectedSalon.phone} />
                <DetailField label="WhatsApp" value={selectedSalon.whatsapp_number} />
                <DetailField label="Email" value={selectedSalon.email} />
                <DetailField label="Created" value={new Date(selectedSalon.created_at).toLocaleString()} />
                <DetailField
                  label="WhatsApp Sentiment"
                  value={selectedSalon.whatsapp_sentiment}
                  full
                  highlight={selectedSalon.whatsapp_sentiment?.toLowerCase().startsWith('positive')}
                />
                <DetailField
                  label="Email Sentiment"
                  value={selectedSalon.email_sentiment}
                  full
                  highlight={selectedSalon.email_sentiment?.toLowerCase().startsWith('positive')}
                />
              </div>
            </div>

            <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedSalon.current_stage !== 'won' && selectedSalon.current_stage !== 'lost' ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => updateStage(selectedSalon, 'lost')}
                    disabled={updatingStage}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red)' }}
                  >
                    <XCircle size={14} /> Deal Cancelled
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => updateStage(selectedSalon, 'won')}
                    disabled={updatingStage}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--green)' }}
                  >
                    <CheckCircle2 size={14} /> Deal Closed
                  </button>
                </>
              ) : (
                <span style={{ fontSize: '12.5px', color: 'var(--label-tertiary)', fontStyle: 'italic' }}>
                  This deal is already marked {stageLabel(selectedSalon.current_stage)}.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({
  label,
  value,
  full = false,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '2px' }}>
        {label}
      </span>
      <span style={{ color: highlight ? 'var(--green)' : 'var(--label-primary)', fontWeight: highlight ? 600 : 400 }}>
        {value ?? <span style={{ color: 'var(--label-tertiary)', fontStyle: 'italic' }}>—</span>}
      </span>
    </div>
  );
}
