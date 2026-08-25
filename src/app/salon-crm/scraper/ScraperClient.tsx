'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search, RefreshCw, ChevronDown, X, Star, Building2, Clock } from 'lucide-react';
import { useAppContext } from '../../ClientWrapper';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import type { Salon } from '@/lib/supabase/salonCrm';

const SCRAPER_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_SALON_SCRAPER_WEBHOOK_URL || 'https://n8n.srv1010832.hstgr.cloud/webhook/lead-fetch';

const QUERY_OPTIONS = [
  'Beauty Salon',
  'Unisex Salon',
  'Ladies Parlour',
  'Hair Salon',
  'Bridal Salon',
  "Men's Salon",
  'Spa',
  'Nail Salon',
  'Skin Clinic',
];

interface RunGroup {
  key: string;
  region: string;
  date: string; // yyyy-mm-dd
  salons: Salon[];
  latestCreatedAt: string;
  categories: Record<string, number>;
  avgRating: number | null;
}

function groupIntoRuns(salons: Salon[]): RunGroup[] {
  const groups = new Map<string, RunGroup>();

  for (const s of salons) {
    const day = s.created_at ? s.created_at.slice(0, 10) : 'unknown';
    const region = s.region || 'Unknown region';
    const key = `${region}__${day}`;

    let group = groups.get(key);
    if (!group) {
      group = { key, region, date: day, salons: [], latestCreatedAt: s.created_at, categories: {}, avgRating: null };
      groups.set(key, group);
    }
    group.salons.push(s);
    if (s.created_at > group.latestCreatedAt) group.latestCreatedAt = s.created_at;
    const cat = s.category || 'other';
    group.categories[cat] = (group.categories[cat] || 0) + 1;
  }

  for (const group of groups.values()) {
    const rated = group.salons.filter((s) => s.google_rating != null);
    group.avgRating = rated.length > 0 ? rated.reduce((sum, s) => sum + (s.google_rating || 0), 0) / rated.length : null;
  }

  return Array.from(groups.values()).sort((a, b) => (b.latestCreatedAt > a.latestCreatedAt ? 1 : -1));
}

export default function ScraperClient({ initialSalons }: { initialSalons: Salon[] }) {
  const { showToast, dateRange } = useAppContext();

  const [region, setRegion] = useState('');
  const [queries, setQueries] = useState<string[]>([]);
  const [maxResults, setMaxResults] = useState(20);
  const [queryDropdownOpen, setQueryDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setQueryDropdownOpen(false);
      }
    }
    if (queryDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [queryDropdownOpen]);

  const toggleQuery = (q: string) => {
    setQueries((prev) => (prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]));
  };

  const canSubmit = region.trim().length > 0 && queries.length > 0 && maxResults > 0 && !submitting;

  const runScraper = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await fetch(SCRAPER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: region.trim(),
          queries: queries.map((q) => q.toLowerCase()),
          max_results: maxResults,
        }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      showToast(
        `Scraper triggered for "${region}" — ${queries.length} ${queries.length === 1 ? 'query' : 'queries'}, up to ${maxResults} leads each. New leads will appear here once the run finishes.`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to trigger scraper.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const dateFilteredSalons = useMemo(
    () => initialSalons.filter((s) => isWithinDateRange(s.created_at, dateRange)),
    [initialSalons, dateRange]
  );

  const runs = useMemo(() => groupIntoRuns(dateFilteredSalons), [dateFilteredSalons]);

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Google Maps Lead Scraper</h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          On-demand, region-based lead discovery — pick a location, one or more search queries, and how many leads you want, then run the scraper.
        </p>
      </div>

      <div className="liquid-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px' }}>
              Location Name
            </label>
            <input
              type="text"
              className="input"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Bandra West, Mumbai"
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
            />
          </div>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px' }}>
              Search Queries
            </label>
            <button
              type="button"
              onClick={() => setQueryDropdownOpen((v) => !v)}
              className="input"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                background: queryDropdownOpen ? 'var(--fill-tertiary)' : undefined,
              }}
            >
              <span style={{ color: queries.length === 0 ? 'var(--label-tertiary)' : 'var(--label-primary)' }}>
                {queries.length === 0 ? 'Select one or more queries...' : `${queries.length} selected`}
              </span>
              <ChevronDown size={14} style={{ transform: queryDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease', flexShrink: 0 }} />
            </button>

            {queryDropdownOpen && (
              <div
                className="liquid-card"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  zIndex: 500,
                  padding: '6px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                }}
              >
                {QUERY_OPTIONS.map((q) => {
                  const checked = queries.includes(q);
                  return (
                    <label
                      key={q}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        background: checked ? 'rgba(0, 122, 255, 0.08)' : 'transparent',
                      }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleQuery(q)} style={{ accentColor: 'var(--blue)' }} />
                      <span style={{ color: 'var(--label-primary)' }}>{q}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px' }}>
              Number of Leads (per query)
            </label>
            <input
              type="number"
              min={1}
              max={500}
              className="input"
              value={maxResults}
              onChange={(e) => setMaxResults(Math.max(1, parseInt(e.target.value) || 0))}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
            <button
              className="btn-primary"
              onClick={runScraper}
              disabled={!canSubmit}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 20px', width: '100%' }}
            >
              {submitting ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
              {submitting ? 'Triggering...' : 'Run Scraper'}
            </button>
          </div>
        </div>

        {queries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--separator)' }}>
            {queries.map((q) => (
              <span
                key={q}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(0, 122, 255, 0.1)',
                  color: 'var(--blue)',
                  border: '1px solid rgba(0, 122, 255, 0.2)',
                }}
              >
                {q}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => toggleQuery(q)} />
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Previous Runs</h3>
        <span style={{ fontSize: '12px', color: 'var(--label-tertiary)' }}>
          {runs.length} {runs.length === 1 ? 'run' : 'runs'} · {dateFilteredSalons.length} leads found — filtered by the date range in the header
        </span>
      </div>

      {runs.length === 0 ? (
        <div className="liquid-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>
          No scraper runs in the selected date range yet.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {runs.map((run) => {
            const topCategories = Object.entries(run.categories)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);
            return (
              <div key={run.key} className="liquid-card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(0,122,255,0.1)', padding: '8px', borderRadius: '10px', color: 'var(--blue)' }}>
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--label-primary)', textTransform: 'capitalize' }}>{run.region}</div>
                      <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Clock size={10} />
                        {new Date(run.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-blue" style={{ fontSize: '10px', padding: '4px 10px' }}>
                    {run.salons.length} {run.salons.length === 1 ? 'lead' : 'leads'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', padding: '10px 0', borderTop: '1px solid var(--separator)', borderBottom: '1px solid var(--separator)', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={13} style={{ color: 'var(--label-tertiary)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>{Object.keys(run.categories).length} categories</span>
                  </div>
                  {run.avgRating != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Star size={13} style={{ color: 'var(--yellow)' }} />
                      <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>{run.avgRating.toFixed(1)} avg rating</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {topCategories.map(([cat, count]) => (
                    <span
                      key={cat}
                      style={{
                        fontSize: '10.5px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        background: 'var(--fill-quaternary)',
                        color: 'var(--label-secondary)',
                      }}
                    >
                      {cat} · {count}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
