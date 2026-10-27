'use client';

import React, { useState } from 'react';
import { X, Loader2, Check, Send } from 'lucide-react';

type Channel = '' | 'whatsapp' | 'email' | 'voice_call';

const CHANNEL_OPTIONS: Array<{ value: Channel; label: string }> = [
  { value: '', label: 'Blank' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'voice_call', label: 'Voice Call' },
];

const SEQUENCE_LENGTH = 30;

/**
 * Admin-only outreach sequence builder. Picks a channel (or blank) for each
 * of 30 days and POSTs the plan to /api/outreach-generator, which forwards
 * it to the n8n outreach webhook. Gated in the header to
 * OUTREACH_SETTINGS_ALLOWED_EMAIL — this component itself does no gating,
 * the caller decides whether to render it.
 */
export default function OutreachSequenceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [sequenceType, setSequenceType] = useState('30_day');
  const [channels, setChannels] = useState<Channel[]>(Array(SEQUENCE_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const setDay = (dayIndex: number, value: Channel) => {
    const next = [...channels];
    next[dayIndex] = value;
    setChannels(next);
  };

  const allBlank = channels.every((c) => c === '');

  const handleClose = () => {
    if (submitting) return;
    onClose();
    setTimeout(() => {
      setResult(null);
      setErrorMessage('');
    }, 200);
  };

  const handleSend = async () => {
    setSubmitting(true);
    setResult(null);
    setErrorMessage('');
    try {
      const payload = {
        sequence_type: sequenceType,
        days: channels.map((channel, i) => ({ day: i + 1, channel: channel || null })),
      };
      const res = await fetch('/api/outreach-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setResult('success');
    } catch (err) {
      setResult('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send sequence.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={handleClose}>
      <div className="spotlight-panel" style={{ maxWidth: '520px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
          <span style={{ fontWeight: '700', fontSize: '16px' }}>Outreach Sequence Generator</span>
          <button className="btn-icon" onClick={handleClose} disabled={submitting} title="Close">
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sequence Type
            </label>
            <select
              className="input"
              value={sequenceType}
              onChange={(e) => setSequenceType(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
            >
              <option value="30_day">30 Day Sequence</option>
            </select>
          </div>

          {sequenceType === '30_day' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Channel per Day
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {channels.map((channel, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '600', width: '56px', flexShrink: 0, color: 'var(--label-secondary)' }}>
                      Day {i + 1}
                    </span>
                    <select
                      className="input"
                      value={channel}
                      onChange={(e) => setDay(i, e.target.value as Channel)}
                      style={{ flex: 1, padding: '7px 10px', fontSize: '12.5px' }}
                    >
                      {CHANNEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--separator)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '12.5px', flex: 1, minWidth: '140px' }}>
            {result === 'success' && (
              <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                <Check size={13} /> Sequence sent successfully
              </span>
            )}
            {result === 'error' && <span style={{ color: 'var(--red)', fontWeight: '600' }}>{errorMessage}</span>}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button className="btn-secondary" onClick={handleClose} disabled={submitting}>
              Close
            </button>
            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={submitting || allBlank}
              title={allBlank ? 'Pick a channel for at least one day' : undefined}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: submitting || allBlank ? 0.7 : 1 }}
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send size={13} /> Send Sequence
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
