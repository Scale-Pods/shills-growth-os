'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import { Smartphone, X } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';

export default function ReceivablesWhatsappPage() {
  const { receivables, setReceivables, showToast, dateRange, dateLabel } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');

  const dateReceivables = useMemo(
    () =>
      receivables
        .map((r) => ({ ...r, invoices: r.invoices.filter((inv) => isWithinDateRange(inv.date, dateRange)) }))
        .filter((r) => (dateRange?.from || dateRange?.to ? r.invoices.length > 0 : true)),
    [receivables, dateRange]
  );

  const overdue = dateReceivables.filter((r) => r.overdueDays > 0);
  const activeRetailer = receivables.find((r) => r.id === activeId) || overdue[0];

  const openOutreach = (retailerId: string) => {
    const retailer = receivables.find((r) => r.id === retailerId) || overdue[0];
    setActiveId(retailerId);
    setLoading(true);
    setShowModal(true);
    setTimeout(() => {
      setLoading(false);
      setTranscript(
        `💬 WHATSAPP BOT OUTBOUND:\nRecipient: ${retailer.owner} (${retailer.name})\nNumber: ${retailer.phone}\n\n"Dear ${retailer.owner},\nThis is Shills Accounts Team. Just a friendly check-in regarding Invoice(s) outstanding for ₹${retailer.outstanding.toLocaleString('en-IN')}, which are now ${retailer.overdueDays} days overdue.\n\nCould you please confirm when we can expect the clearance? You can pay directly via this secure UPI link: https://pay.shillsbeauty.in/inv-rec\n\nThanks!\nShills Finance Team"`
      );
    }, 800);
  };

  const confirmSend = () => {
    setReceivables((prev) =>
      prev.map((r) => {
        if (r.id !== activeRetailer.id) return r;
        let nextStage = 'Reminder #1';
        if (r.stage === 'Invoice Issued') nextStage = 'Reminder #1';
        else if (r.stage === 'Reminder #1') nextStage = 'Reminder #2';
        else if (r.stage === 'Reminder #2') nextStage = 'Reminder #3';
        else nextStage = 'Escalation';
        return { ...r, stage: nextStage, lastReminder: new Date().toISOString().split('T')[0] };
      })
    );
    setShowModal(false);
    showToast(`WhatsApp reminder dispatched to ${activeRetailer.owner}`, 'success');
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Receivables — WhatsApp Panel</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Trigger and review WhatsApp payment reminders for overdue retailer accounts.
          </p>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Retailer</th>
                <th style={{ padding: '12px 8px' }}>Number</th>
                <th style={{ padding: '12px 8px' }}>Outstanding</th>
                <th style={{ padding: '12px 8px' }}>Overdue Days</th>
                <th style={{ padding: '12px 8px' }}>Stage</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {overdue.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No overdue accounts.</td></tr>
              ) : overdue.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '700' }}>{r.name}</td>
                  <td style={{ padding: '12px 8px' }}>{r.phone}</td>
                  <td style={{ padding: '12px 8px', fontWeight: '700' }}>₹{r.outstanding.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 8px' }}><span className="badge badge-red">{r.overdueDays} days</span></td>
                  <td style={{ padding: '12px 8px' }}><span className="badge badge-blue">{r.stage}</span></td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => openOutreach(r.id)}>
                      <Smartphone size={12} /> Send WhatsApp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && activeRetailer && (
        <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={() => setShowModal(false)}>
          <div className="spotlight-panel" style={{ maxWidth: '600px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone style={{ color: 'var(--green)' }} />
                <span style={{ fontWeight: '700', fontSize: '16px' }}>WhatsApp Reminder: {activeRetailer.name}</span>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--separator)', borderBottom: '1px solid var(--separator)' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }}></div>
                  <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Preparing message...</span>
                </div>
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12.5px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', color: 'var(--label-primary)', lineHeight: '1.5', maxHeight: '280px', overflowY: 'auto' }}>
                  {transcript}
                </pre>
              )}
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={confirmSend} disabled={loading}>Confirm & Dispatch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
