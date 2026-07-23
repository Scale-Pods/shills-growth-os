'use client';

import React, { useState } from 'react';
import { MapPin, Search, RefreshCw, AlertTriangle } from 'lucide-react';

const SCRAPER_WEBHOOK_URL = process.env.NEXT_PUBLIC_SALON_SCRAPER_WEBHOOK_URL;

export default function ScraperPage() {
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('unisex_salon');
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [resultMessage, setResultMessage] = useState('');

  const runScraper = async () => {
    if (!region.trim()) return;

    if (!SCRAPER_WEBHOOK_URL) {
      setStatus('error');
      setResultMessage(
        'No scraper webhook configured. Set NEXT_PUBLIC_SALON_SCRAPER_WEBHOOK_URL in .env.local to the SSE-A n8n Form Trigger / webhook URL to enable this.'
      );
      return;
    }

    setStatus('running');
    setResultMessage('');
    try {
      const res = await fetch(SCRAPER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region, category }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      setStatus('done');
      setResultMessage(`Scraper triggered for "${region}". New leads will appear on the Leads page once the workflow finishes.`);
    } catch (err) {
      setStatus('error');
      setResultMessage(err instanceof Error ? err.message : 'Failed to trigger scraper.');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Google Maps Lead Scraper</h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          On-demand, region-based lead discovery — enter a region and trigger the SSE-A workflow. No fixed default regions.
        </p>
      </div>

      <div className="liquid-card" style={{ padding: '24px', maxWidth: '560px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px' }}>
              Region / City to search
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

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px' }}>
              Salon Category
            </label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '13px' }}
            >
              <option value="unisex_salon">Unisex Salon</option>
              <option value="ladies_salon">Ladies Salon</option>
              <option value="mens_salon">Men&apos;s Salon</option>
              <option value="spa">Spa</option>
              <option value="academy">Academy</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            className="btn-primary"
            onClick={runScraper}
            disabled={status === 'running' || !region.trim()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 20px' }}
          >
            {status === 'running' ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
            {status === 'running' ? 'Triggering scraper...' : 'Run Google Maps Scraper'}
          </button>

          {resultMessage && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                background: status === 'error' ? 'rgba(255, 59, 48, 0.08)' : 'rgba(52, 199, 89, 0.08)',
                border: `1px solid ${status === 'error' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(52, 199, 89, 0.2)'}`,
              }}
            >
              {status === 'error' && <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: '2px' }} />}
              {status === 'done' && <MapPin size={14} style={{ color: 'var(--green)', flexShrink: 0, marginTop: '2px' }} />}
              <span style={{ fontSize: '12.5px', color: status === 'error' ? 'var(--red)' : 'var(--green)', lineHeight: '1.4' }}>
                {resultMessage}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
