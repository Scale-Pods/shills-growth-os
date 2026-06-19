'use client';

import React, { useState } from 'react';
import { useAppContext } from '../ClientWrapper';
import {
  DollarSign,
  Calendar,
  Send,
  Smartphone,
  Mail,
  PhoneCall,
  AlertTriangle,
  Clock,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  FileText,
  UserCheck,
  CheckCircle2,
  Volume2,
  X
} from 'lucide-react';

export default function AccountsReceivablePage() {
  const {
    receivables,
    setReceivables,
    showToast
  } = useAppContext();

  // Page States
  const [selectedReceivableId, setSelectedReceivableId] = useState('rec-1');
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [outreachType, setOutreachType] = useState('whatsapp'); // whatsapp, email, voice
  const [simulatedTranscript, setSimulatedTranscript] = useState('');
  const [outreachLoading, setOutreachLoading] = useState(false);

  // Constants as specified in PRD Founder View
  const outstandingTotal = 2780000; // ₹27.8L
  const overdueTotal = 940000;      // ₹9.4L
  const collectedMonth = 620000;    // ₹6.2L

  // Find active retailer
  const activeRetailer = receivables.find(r => r.id === selectedReceivableId) || receivables[0];

  // Ageing Buckets calculation (Hardcoded base split matching ₹27.8L total, but updated reactively)
  const ageingBuckets = [
    { label: '0-30 Days', amount: 1840000, pct: 66, color: 'var(--green)' },
    { label: '31-60 Days', amount: 620000, pct: 22, color: 'var(--blue)' },
    { label: '61-90 Days', amount: 210000, pct: 8, color: 'var(--orange)' },
    { label: '90+ Days', amount: 110000, pct: 4, color: 'var(--red)' }
  ];

  // Workflow Config
  const workflowTimeline = [
    { day: 'Day 0', title: 'Invoice Issued', channel: 'Email + WhatsApp', desc: 'System automatically issues the invoice link with GST details.' },
    { day: 'Day 7', title: 'Reminder #1', channel: 'WhatsApp Nudge', desc: 'Gentle, friendly nudge sent automatically to the billing contact.' },
    { day: 'Day 14', title: 'Reminder #2', channel: 'Firm Email', desc: 'Formal reminder noting overdue state and interest clause details.' },
    { day: 'Day 21', title: 'Reminder #3', channel: 'AI Voice Call', desc: 'Automated AI voice follow-up places a call to schedule payment.' },
    { day: 'Day 30', title: 'Escalation', channel: 'Founder WhatsApp', desc: 'Dispatches legal notice draft and notifies Shills CEO Apoorv.' }
  ];

  // Open the trigger outreach console
  const openOutreach = (retailerId: string, type: string) => {
    const retailer = receivables.find(r => r.id === retailerId) || activeRetailer;
    setOutreachType(type);
    setSelectedReceivableId(retailerId);
    setOutreachLoading(true);
    setShowOutreachModal(true);

    setTimeout(() => {
      setOutreachLoading(false);
      let transcript = '';

      if (type === 'whatsapp') {
        transcript = `💬 WHATSAPP BOT OUTBOUND:\nRecipient: ${retailer.owner} (${retailer.name})\nNumber: ${retailer.phone}\n\n"Dear ${retailer.owner},\nThis is Shills Accounts Team. Just a friendly check-in regarding Invoice(s) outstanding for ₹${retailer.outstanding.toLocaleString('en-IN')}, which are now ${retailer.overdueDays} days overdue.\n\nCould you please confirm when we can expect the clearance? You can pay directly via this secure UPI link: https://pay.shillsbeauty.in/inv-rec\n\nThanks!\nShills Finance Team"`;
      } else if (type === 'email') {
        transcript = `✉️ EMAIL OUTBOUND:\nTo: ${retailer.email}\nSubject: OVERDUE STATEMENT: Shills Professional Invoices [Action Required]\n\n"Dear ${retailer.owner},\n\nWe hope this email finds you well.\n\nThis is a formal reminder that your account with Shills Professional is currently outstanding for the amount of ₹${retailer.outstanding.toLocaleString('en-IN')}.\n\nAccording to our logs, invoice balances have exceeded terms and are now ${retailer.overdueDays} days past due. We kindly ask you to wire this balance immediately to our bank details below, or use the online Gateway.\n\nBank Account: HDFC Bank A/C 98402123\nIFSC Code: HDFC0000012\n\nKind Regards,\nAccounts Recovery Department\nShills Professional"`;
      } else {
        transcript = `📞 AI VOICE DIALER CALL LOG:\nRecipient: ${retailer.owner} (${retailer.name})\nDialing: ${retailer.phone}...\nConnected [0:42 mins]\n\n[AI Agent]: "Hello, am I speaking with ${retailer.owner} from ${retailer.name}?"\n[Retailer]: "Yes, Vikram here. Who is this?"\n[AI Agent]: "Hi Vikram, I am calling from Shills Professional Accounts Department. I wanted to follow up on your pending balance of ₹${retailer.outstanding.toLocaleString('en-IN')} which is overdue. Can you confirm if the payment has been initiated?"\n[Retailer]: "Ah, yes, my account manager was supposed to GPay it yesterday. I will check and have it sent by this evening."\n[AI Agent]: "Got it, Vikram. I will mark in our system that you will clear the invoice by today. Thank you for your time!"`;
      }

      setSimulatedTranscript(transcript);
    }, 800);
  };

  // Confirm and send outreach
  const triggerOutreach = () => {
    // Advance the reminder stage
    setReceivables(prev => prev.map(r => {
      if (r.id === activeRetailer.id) {
        let nextStage = 'Reminder #1';
        if (r.stage === 'Invoice Issued') nextStage = 'Reminder #1';
        else if (r.stage === 'Reminder #1') nextStage = 'Reminder #2';
        else if (r.stage === 'Reminder #2') nextStage = 'Reminder #3';
        else if (r.stage === 'Reminder #3') nextStage = 'Escalation';
        else nextStage = 'Escalation';

        return {
          ...r,
          stage: nextStage,
          lastReminder: new Date().toISOString().split('T')[0]
        };
      }
      return r;
    }));

    setShowOutreachModal(false);
    showToast(`AI Recovery reminder successfully dispatched to ${activeRetailer.owner} via ${outreachType.toUpperCase()}`, 'success');
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Accounts Receivable Recovery System</h2>
            <span style={{ fontSize: '10px', background: 'rgba(0, 122, 255, 0.08)', color: 'var(--blue)', border: '1px solid rgba(0, 122, 255, 0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Powered by ScalePods</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>Automate follow-up timelines and track outstanding retailer invoices using conversational AI channels.</p>
        </div>
      </div>

      {/* Founder View Primary Cards */}
      <div className="metrics-grid mb-24">
        
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Founder View: Outstanding</span>
          <span className="value">₹{(outstandingTotal / 100000).toFixed(1)}L</span>
          <span className="trend up" style={{ color: 'var(--label-tertiary)' }}><Clock size={12} /> Total Retailer Debt</span>
        </div>

        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Founder View: Overdue</span>
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

      {/* Ageing Buckets Panel */}
      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Outstanding Receivables Ageing Buckets</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Progress bar container */}
          <div style={{ height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', background: 'var(--fill-tertiary)' }}>
            {ageingBuckets.map((bucket, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: `${bucket.pct}%`, 
                  background: bucket.color, 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '11px', 
                  fontWeight: '700' 
                }}
                title={`${bucket.label}: ₹${(bucket.amount / 100000).toFixed(1)}L (${bucket.pct}%)`}
              >
                {bucket.pct > 5 ? `${bucket.pct}%` : ''}
              </div>
            ))}
          </div>

          {/* Legend Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', flexWrap: 'wrap' }}>
            {ageingBuckets.map((bucket, idx) => (
              <div key={idx} style={{ background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: bucket.color }}></span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{bucket.label}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>
                  ₹{(bucket.amount / 100000).toFixed(1)}L
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline: 21-Day Recovery Workflow */}
      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>21-Day AI Recovery Workflow Automation</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', flexWrap: 'wrap' }}>
          {workflowTimeline.map((step, idx) => (
            <div key={idx} style={{ background: 'var(--fill-quaternary)', padding: '16px', borderRadius: '12px', position: 'relative', borderTop: `4px solid ${idx === 4 ? 'var(--red)' : idx === 3 ? 'var(--orange)' : 'var(--blue)'}` }}>
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

      {/* AR Invoices Table */}
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
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Trigger AI Outreach</th>
              </tr>
            </thead>
            <tbody>
              {receivables.map(r => (
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
                    <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 'normal' }}>
                      {r.invoices.length} Invoices pending
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className={`badge ${r.overdueDays === 0 ? 'badge-green' : r.overdueDays >= 30 ? 'badge-red' : 'badge-orange'}`}>
                      {r.overdueDays === 0 ? 'Current' : `${r.overdueDays} Days Overdue`}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className={`badge ${r.stage.includes('Escalation') ? 'badge-red' : r.stage.includes('Issued') ? 'badge-grey' : 'badge-blue'}`}>
                      {r.stage}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{r.lastReminder}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {r.overdueDays > 0 ? (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 10px', fontSize: '12px', background: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => openOutreach(r.id, 'whatsapp')}
                          title="WhatsApp Reminder"
                        >
                          <Smartphone size={12} /> WhatsApp
                        </button>
                        
                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 10px', fontSize: '12px', background: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => openOutreach(r.id, 'email')}
                          title="Email Reminder"
                        >
                          <Mail size={12} /> Email
                        </button>

                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 10px', fontSize: '12px', background: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => openOutreach(r.id, 'voice')}
                          title="AI Voice Call Dialer"
                        >
                          <Volume2 size={12} /> AI Voice
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--label-tertiary)', fontStyle: 'italic' }}>Accounts Good</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outreach Simulator Modal Overlay */}
      {showOutreachModal && (
        <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={() => setShowOutreachModal(false)}>
          <div className="spotlight-panel" style={{ maxWidth: '600px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {outreachType === 'whatsapp' && <Smartphone style={{ color: 'var(--green)' }} />}
                {outreachType === 'email' && <Mail style={{ color: 'var(--blue)' }} />}
                {outreachType === 'voice' && <Volume2 style={{ color: 'var(--purple)' }} />}
                <span style={{ fontWeight: '700', fontSize: '16px' }}>
                  Trigger Recovery Outreach: {activeRetailer.name}
                </span>
              </div>
              <button className="btn-icon" onClick={() => setShowOutreachModal(false)}><X size={14} /></button>
            </div>
            
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--separator)', borderBottom: '1px solid var(--separator)' }}>
              {outreachLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }}></div>
                  <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Dialing AI recovery gateways...</span>
                </div>
              ) : (
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '12.5px', 
                  fontFamily: 'var(--font-mono)', 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '16px', 
                  borderRadius: '10px', 
                  color: 'var(--label-primary)',
                  lineHeight: '1.5',
                  maxHeight: '280px',
                  overflowY: 'auto'
                }}>
                  {simulatedTranscript}
                </pre>
              )}
            </div>

            <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowOutreachModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={triggerOutreach} disabled={outreachLoading}>
                Confirm & Dispatch Alert
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
