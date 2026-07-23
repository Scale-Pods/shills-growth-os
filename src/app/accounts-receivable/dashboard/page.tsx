'use client';

import React from 'react';
import { useAppContext } from '../../ClientWrapper';
import {
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

export default function AccountsReceivableDashboardPage() {
  const { receivables } = useAppContext();

  const outstandingTotal = 2780000;
  const overdueTotal = 940000;
  const collectedMonth = 620000;

  const ageingBuckets = [
    { label: '0-30 Days', amount: 1840000, pct: 66, color: 'var(--green)' },
    { label: '31-60 Days', amount: 620000, pct: 22, color: 'var(--blue)' },
    { label: '61-90 Days', amount: 210000, pct: 8, color: 'var(--orange)' },
    { label: '90+ Days', amount: 110000, pct: 4, color: 'var(--red)' },
  ];

  const workflowTimeline = [
    { day: 'Day 0', title: 'Invoice Issued', channel: 'Email + WhatsApp', desc: 'System automatically issues the invoice link with GST details.' },
    { day: 'Day 7', title: 'Reminder #1', channel: 'WhatsApp Nudge', desc: 'Gentle, friendly nudge sent automatically to the billing contact.' },
    { day: 'Day 14', title: 'Reminder #2', channel: 'Firm Email', desc: 'Formal reminder noting overdue state and interest clause details.' },
    { day: 'Day 21', title: 'Reminder #3', channel: 'AI Voice Call', desc: 'Automated AI voice follow-up places a call to schedule payment.' },
    { day: 'Day 30', title: 'Escalation', channel: 'Founder WhatsApp', desc: 'Dispatches legal notice draft and notifies Shills CEO.' },
  ];

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Receivables Dashboard</h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          Overview of outstanding balances, ageing, and the 21-day AI recovery workflow.
        </p>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Outstanding</span>
          <span className="value">₹{(outstandingTotal / 100000).toFixed(1)}L</span>
          <span className="trend up" style={{ color: 'var(--label-tertiary)' }}><Clock size={12} /> Total Retailer Debt</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Overdue</span>
          <span className="value">₹{(overdueTotal / 100000).toFixed(1)}L</span>
          <span className="trend down" style={{ color: 'var(--red)' }}><AlertTriangle size={12} /> Exceeded Credit Limits</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Collected This Month</span>
          <span className="value">₹{(collectedMonth / 100000).toFixed(1)}L</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><TrendingUp size={12} /> Recovery Velocity</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Automated Recovery ROI</span>
          <span className="value">94.2%</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><CheckCircle2 size={12} /> AI Containment Active</span>
        </div>
      </div>

      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Outstanding Receivables Ageing Buckets</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', background: 'var(--fill-tertiary)' }}>
            {ageingBuckets.map((bucket, idx) => (
              <div
                key={idx}
                style={{ width: `${bucket.pct}%`, background: bucket.color, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '700' }}
                title={`${bucket.label}: ₹${(bucket.amount / 100000).toFixed(1)}L (${bucket.pct}%)`}
              >
                {bucket.pct > 5 ? `${bucket.pct}%` : ''}
              </div>
            ))}
          </div>
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {ageingBuckets.map((bucket, idx) => (
              <div key={idx} style={{ background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: bucket.color }}></span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{bucket.label}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>₹{(bucket.amount / 100000).toFixed(1)}L</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>21-Day AI Recovery Workflow Automation</h3>
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {workflowTimeline.map((step, idx) => (
            <div key={idx} style={{ background: 'var(--fill-quaternary)', padding: '16px', borderRadius: '12px', borderTop: `4px solid ${idx === 4 ? 'var(--red)' : idx === 3 ? 'var(--orange)' : 'var(--blue)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--blue)' }}>{step.day}</span>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>{step.channel}</span>
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>{step.title}</h4>
              <p style={{ fontSize: '11px', color: 'var(--label-secondary)', lineHeight: '1.4' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Accounts Receivable Ledger</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Retailer</th>
                <th style={{ padding: '12px 8px' }}>Billing Contact</th>
                <th style={{ padding: '12px 8px' }}>Outstanding Balance</th>
                <th style={{ padding: '12px 8px' }}>Overdue Days</th>
                <th style={{ padding: '12px 8px' }}>Current Recovery Stage</th>
                <th style={{ padding: '12px 8px' }}>Last Reminder Date</th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ fontWeight: '700', display: 'block' }}>{r.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>ID: {r.id}</span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ fontWeight: '600', display: 'block' }}>{r.owner}</span>
                    <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{r.email} • {r.phone}</span>
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: '700' }}>
                    ₹{r.outstanding.toLocaleString('en-IN')}
                    <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 'normal' }}>{r.invoices.length} Invoices pending</div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className={`badge ${r.overdueDays === 0 ? 'badge-green' : r.overdueDays >= 30 ? 'badge-red' : 'badge-orange'}`}>
                      {r.overdueDays === 0 ? 'Current' : `${r.overdueDays} Days Overdue`}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className={`badge ${r.stage.includes('Escalation') ? 'badge-red' : r.stage.includes('Issued') ? 'badge-grey' : 'badge-blue'}`}>{r.stage}</span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{r.lastReminder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
