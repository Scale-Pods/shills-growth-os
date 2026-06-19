'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../ClientWrapper';
import {
  Bot,
  Star,
  CheckCircle,
  AlertTriangle,
  Send,
  Smartphone,
  Award,
  ThumbsDown,
  XCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Bell,
  RotateCcw,
  ArrowUpRight
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderEvent {
  stage: string;
  time: string;
  done: boolean;
  waMsg: string;
  carrier?: string;
  trackId?: string;
}

// ─── Journey Lifecycle Config ─────────────────────────────────────────────────

const buildOrderTimeline = (orderId: string, carrier: string, trackId: string): OrderEvent[] => [
  {
    stage: 'Order Placed',
    time: '10:02 AM',
    done: true,
    waMsg: `✅ *Order Confirmed!* Hi! Your Shills order *${orderId}* has been placed successfully.\n\n📦 Items: Nail Gel Set #12 × 1\n💰 Amount: ₹999\n📍 Delivery to: 3rd Floor, Sector 15, Noida\n\nWe'll notify you when it ships. Track anytime: shills.in/track/${trackId}`
  },
  {
    stage: 'Payment Verified',
    time: '10:03 AM',
    done: true,
    waMsg: `💳 *Payment Received!* Your payment of ₹999 for order *${orderId}* is confirmed via UPI.\n\nReceipt: shills.in/receipt/${trackId}\n\nYour order is now being packed! 📦`
  },
  {
    stage: 'Packed & Ready',
    time: '11:30 AM',
    done: true,
    waMsg: `📦 *Order Packed!* Your Shills order *${orderId}* has been packed and is ready for pickup.\n\nEstimated dispatch: Within 2 hours.\n\nNeed to change address? Reply *CHANGE* within the next 30 minutes.`
  },
  {
    stage: 'Out for Delivery',
    time: '02:15 PM',
    done: true,
    carrier,
    trackId,
    waMsg: `🚚 *Out for Delivery!* Your Shills package is on its way!\n\n🔖 Tracking ID: *${trackId}*\n🚚 Carrier: ${carrier}\n📍 Live track: shills.in/track/${trackId}\n\n⏱ Expected arrival: Today by 6:00 PM\n\nOur rider will call you before delivery. Please be available!`
  },
  {
    stage: 'Delivery Attempted',
    time: '05:48 PM',
    done: false,
    carrier,
    trackId,
    waMsg: `⚠️ *Delivery Attempted!* We tried delivering order *${orderId}* but couldn't reach you.\n\n🚚 Carrier: ${carrier} · ID: ${trackId}\n\nWe'll retry tomorrow between 10 AM–6 PM.\n\nTo reschedule or update address, reply *RESCHEDULE*.`
  },
  {
    stage: 'Delivered',
    time: '—',
    done: false,
    waMsg: `✅ *Delivered Successfully!* Your Shills order *${orderId}* has been delivered.\n\n🏠 Received at: Your address\n📸 Proof of delivery available at: shills.in/track/${trackId}\n\nEnjoy your product! We'll check in on Day 3 for your feedback. 💅`
  },
  {
    stage: 'Day 3 Review Ask',
    time: '—',
    done: false,
    waMsg: `⭐ *How's your Shills product?* Hi! It's been 3 days since you received your order.\n\nWe'd love to hear your feedback:\n👉 shills.in/review/${trackId}\n\nRate us in 10 seconds! Your review helps other customers. 🙏\n\n_Reply ISSUE if you need support._`
  }
];

const DELIVERY_PARTNER_UPDATES = [
  { carrier: 'Delhivery', trackId: 'DEL-9840-X', status: 'In Transit', location: 'Noida Hub', updated: '2 min ago', eta: 'Today 5:30 PM' },
  { carrier: 'Shiprocket', trackId: 'SR-7712-B', status: 'Out for Delivery', location: 'Sector 15, Noida', updated: '12 min ago', eta: 'Today 4:00 PM' },
  { carrier: 'Shadowfax', trackId: 'SFX-3301-C', status: 'Delivered', location: 'Customer Address', updated: '1h ago', eta: 'Completed' },
  { carrier: 'Xpressbees', trackId: 'XB-5509-D', status: 'Exception', location: 'Delhi Sorting Hub', updated: '45 min ago', eta: 'Delayed — Rescheduled Tomorrow' },
];

const SLA_RULES = [
  { rule: 'First Response SLA', target: '< 5 min', actual: '2.8 min', met: true },
  { rule: 'Refund Processing', target: '< 48 hrs', actual: '31 hrs avg', met: true },
  { rule: 'Exchange Dispatch', target: '< 24 hrs', actual: '19 hrs avg', met: true },
  { rule: 'Escalation Resolution', target: '< 2 hrs', actual: '1h 44m', met: true },
  { rule: 'CSAT Survey Send (Day 3)', target: 'Day 3 post delivery', actual: '100% automated', met: true },
  { rule: 'Negative Review Intercept', target: '1-3★ → ticket < 1 min', actual: '0.4 min avg', met: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerCarePage() {
  const { supportCases, setSupportCases, reviews, setReviews, showToast } = useAppContext();

  // ── Page State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'inbox' | 'lifecycle' | 'tracking' | 'reviews' | 'sla'>('inbox');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [activeCaseId, setActiveCaseId] = useState('case-1');
  const [overrideInput, setOverrideInput] = useState('');
  const [statusFilterCases, setStatusFilterCases] = useState('all');
  const [activeOrderId, setActiveOrderId] = useState('SH-9840');
  const [activeCarrier, setActiveCarrier] = useState('Delhivery');
  const [activeTrackId, setActiveTrackId] = useState('DEL-9840-X');
  const [trackingPullLoading, setTrackingPullLoading] = useState(false);
  const [waPreviewStep, setWaPreviewStep] = useState(0);

  // Survey Sim
  const [simRating, setSimRating] = useState(0);
  const [simName, setSimName] = useState('Nisha Gupta');
  const [simReviewText, setSimReviewText] = useState('');
  const [ticketCreated, setTicketCreated] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const timeline = useMemo(() => buildOrderTimeline(activeOrderId, activeCarrier, activeTrackId), [activeOrderId, activeCarrier, activeTrackId]);

  const filteredCases = useMemo(() => supportCases.filter(c => {
    const matchChannel = selectedChannel === 'all' || c.channel === selectedChannel;
    const matchStatus = statusFilterCases === 'all' || c.status.toLowerCase() === statusFilterCases;
    return matchChannel && matchStatus;
  }), [supportCases, selectedChannel, statusFilterCases]);

  const activeCase = supportCases.find(c => c.id === activeCaseId) || supportCases[0];

  const csatScore = 4.82;
  const totalReviews = reviews.length;
  const negativeIntercepted = reviews.filter(r => r.rating <= 3).length;
  const openCases = supportCases.filter(c => c.status === 'Open').length;

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSendOverride = () => {
    if (!overrideInput.trim()) return;
    setSupportCases(prev => prev.map(c => {
      if (c.id === activeCaseId) return { ...c, thread: [...c.thread, { sender: 'founder-user', msg: `[Human Override] ${overrideInput}`, time: 'Just now' }] };
      return c;
    }));
    setOverrideInput('');
    showToast('Manual override sent on behalf of support team.', 'success');
  };

  const handleEscalate = () => {
    setSupportCases(prev => prev.map(c => c.id === activeCaseId ? { ...c, escalation: 'Escalated — CS Manager' } : c));
    showToast('Case escalated to Live Support Manager. Notification sent.', 'info');
  };

  const handleResolve = () => {
    setSupportCases(prev => prev.map(c => {
      if (c.id === activeCaseId) return { ...c, status: c.status === 'Open' ? 'Resolved' : 'Open', escalation: 'None' };
      return c;
    }));
    showToast(activeCase?.status === 'Open' ? 'Case marked Resolved.' : 'Case reopened.', 'success');
  };

  const handleSendWaUpdate = (step: OrderEvent) => {
    showToast(`WhatsApp sent to customer: "${step.stage}" — ${step.waMsg.substring(0, 60)}...`, 'success');
  };

  const handlePullTracking = () => {
    setTrackingPullLoading(true);
    setTimeout(() => {
      setTrackingPullLoading(false);
      showToast(`Live tracking pulled from ${activeCarrier} API. Status: Out for Delivery — ${activeTrackId}`, 'success');
    }, 1400);
  };

  const handleFeedbackSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (simRating === 0) return;
    if (simRating >= 4) {
      setReviews([{ id: `rev-${reviews.length + 1}`, customer: simName, rating: simRating, platform: 'Google Reviews', text: simReviewText || 'Great product!', date: new Date().toISOString().split('T')[0], sentiment: 'positive', reply: 'Thank you for your feedback!' }, ...reviews]);
      showToast(`${simRating}★ rating → pushed live to Google & Amazon review APIs!`, 'success');
      setSimRating(0); setSimReviewText('');
    } else {
      const newCase = { id: `case-${supportCases.length + 1}`, customer: simName, channel: 'whatsapp', msg: `[Auto-Intercept: ${simRating}★] ${simReviewText || 'Negative experience reported.'}`, status: 'Open', escalation: 'Low CSAT Intercept', time: 'Just now', thread: [{ sender: 'customer', msg: `Rating: ${simRating}★ — ${simReviewText || 'Negative experience.'}`, time: 'Just now' }, { sender: 'ai', msg: `Hi ${simName}, we're really sorry to hear about your experience! A support manager has been assigned to your case. We'll make this right within 2 hours. Case ID: #${supportCases.length + 1}`, time: 'Just now' }] };
      setSupportCases([newCase, ...supportCases]);
      setTicketCreated(true);
      showToast(`${simRating}★ intercepted! Public review blocked. Support ticket #${supportCases.length + 1} created.`, 'error');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Customer Care Command Centre</h2>
            <span style={{ fontSize: '10px', background: 'rgba(0,122,255,0.08)', color: 'var(--blue)', border: '1px solid rgba(0,122,255,0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Powered by ScalePods</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Full order lifecycle WhatsApp automation • Live carrier tracking • AI support inbox • Review interception
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => showToast('Syncing all open cases from WhatsApp, Shopify & Instagram DM...', 'info')}>
            <RefreshCw size={14} /> Sync Inbox
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Live CSAT Score</span>
          <span className="value">{csatScore} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>/ 5.0</span></span>
          <span className="trend up"><CheckCircle size={12} /> Target: &gt;4.7</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Public Reviews Generated</span>
          <span className="value">{totalReviews} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Ratings</span></span>
          <span className="trend up"><Award size={12} /> Nykaa · Google · Amazon</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Negative Reviews Blocked</span>
          <span className="value">{negativeIntercepted} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Cases</span></span>
          <span className="trend down" style={{ color: 'var(--red)' }}><ThumbsDown size={12} /> Kept Off Public Feeds</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Open Cases Now</span>
          <span className="value">{openCases} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Tickets</span></span>
          <span className="trend down" style={{ color: openCases > 3 ? 'var(--red)' : 'var(--orange)' }}><Bell size={12} /> Needs Attention</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Avg First Response</span>
          <span className="value">2.8 <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Min</span></span>
          <span className="trend up"><Clock size={12} /> AI Automated</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--teal)' } as React.CSSProperties}>
          <span className="label">Tickets Auto-Resolved</span>
          <span className="value">78<span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>%</span></span>
          <span className="trend up"><Bot size={12} /> No Human Needed</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--fill-tertiary)', padding: '3px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {[['inbox', 'Support Inbox', Bot], ['lifecycle', 'Order Lifecycle', Package], ['tracking', 'Carrier Tracking', Truck], ['reviews', 'Review Engine', Star], ['sla', 'SLA Dashboard', TrendingUp]].map(([key, label, Icon]: any) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: '700', background: activeTab === key ? 'var(--bg-layer1)' : 'transparent', color: activeTab === key ? 'var(--blue)' : 'var(--label-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ── TAB: SUPPORT INBOX ──────────────────────────────────────────────────── */}
      {activeTab === 'inbox' && (
        <div className="split-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '20px', alignItems: 'start' }}>
          <div className="liquid-card" style={{ padding: '20px' }}>
            {/* Inbox Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} style={{ color: 'var(--blue)' }} />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>AI Support Streams</h3>
                  <p style={{ fontSize: '11px', color: 'var(--label-tertiary)', margin: 0 }}>WhatsApp · Shopify · Instagram DM · Website</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: 'var(--fill-tertiary)', padding: '2px', borderRadius: '8px' }}>
                  {['all', 'whatsapp', 'shopify', 'website'].map(ch => (
                    <button key={ch} onClick={() => setSelectedChannel(ch)} style={{ padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '700', background: selectedChannel === ch ? 'var(--bg-layer1)' : 'transparent', color: selectedChannel === ch ? 'var(--blue)' : 'var(--label-secondary)', cursor: 'pointer', textTransform: 'uppercase' }}>{ch}</button>
                  ))}
                </div>
                <select className="input" value={statusFilterCases} onChange={e => setStatusFilterCases(e.target.value)} style={{ fontSize: '11px', padding: '4px 6px' }}>
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="console-body" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '14px' }}>
              {/* Case List */}
              <div style={{ borderRight: '1px solid var(--separator)', paddingRight: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                {filteredCases.map(c => (
                  <div key={c.id} onClick={() => setActiveCaseId(c.id)} style={{ padding: '10px', borderRadius: '8px', background: activeCaseId === c.id ? 'var(--fill-tertiary)' : 'transparent', marginBottom: '6px', cursor: 'pointer', borderLeft: c.escalation !== 'None' ? '3px solid var(--red)' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: '700' }}>{c.customer}</span>
                      <span className={`badge badge-${c.status === 'Open' ? 'orange' : 'green'}`} style={{ fontSize: '8px' }}>{c.status}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', marginBottom: '2px', textTransform: 'uppercase' }}>{c.channel} · {c.time}</div>
                    <div style={{ fontSize: '11px', color: 'var(--label-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.msg}</div>
                    {c.escalation !== 'None' && <div style={{ fontSize: '9px', color: 'var(--red)', marginTop: '3px', fontWeight: '700' }}>⚡ {c.escalation}</div>}
                  </div>
                ))}
              </div>

              {/* Chat Thread */}
              {activeCase && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--separator)', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>{activeCase.customer}</span>
                      <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', marginLeft: '8px' }}>{activeCase.channel.toUpperCase()}</span>
                      {activeCase.escalation !== 'None' && <span style={{ fontSize: '10px', color: 'var(--red)', marginLeft: '8px', fontWeight: '700' }}>⚡ {activeCase.escalation}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showToast('Initiated refund flow for this case.', 'success')}>
                        <RotateCcw size={11} /> Refund
                      </button>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showToast('Replacement order triggered.', 'success')}>
                        <Package size={11} /> Replace
                      </button>
                      {activeCase.status === 'Open' && (
                        <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--orange)' }} onClick={handleEscalate}>
                          <ArrowUpRight size={11} /> Escalate
                        </button>
                      )}
                      <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleResolve}>
                        {activeCase.status === 'Open' ? 'Resolve' : 'Reopen'}
                      </button>
                    </div>
                  </div>

                  <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: '10px' }}>
                    {activeCase.thread.map((msg, idx) => {
                      const isUser = msg.sender === 'founder-user';
                      const isAI = msg.sender === 'ai';
                      return (
                        <div key={idx} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', background: isUser ? 'var(--blue)' : isAI ? 'var(--fill-secondary)' : 'var(--fill-tertiary)', color: isUser ? 'white' : 'var(--label-primary)', padding: '10px 14px', borderRadius: '12px', maxWidth: '85%', fontSize: '12.5px' }}>
                          {isAI && <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--blue)', marginBottom: '3px' }}>AI AGENT</div>}
                          {!isAI && !isUser && <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--label-tertiary)', marginBottom: '3px' }}>CUSTOMER</div>}
                          <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.msg}</p>
                          <span style={{ fontSize: '9px', opacity: 0.6, display: 'block', textAlign: 'right', marginTop: '4px' }}>{msg.time}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="input" placeholder="Override AI response or add note..." value={overrideInput} onChange={e => setOverrideInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSendOverride(); }} style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }} />
                    <button className="btn-primary" onClick={handleSendOverride}><Send size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Day 3 Survey Panel */}
          <div className="liquid-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={15} style={{ color: 'var(--blue)' }} /> Post-Delivery Survey Simulator
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--label-secondary)', marginBottom: '14px' }}>
              Simulate a Day 3 check-in rating. 4-5★ routes to public platforms. 1-3★ creates a private support ticket.
            </p>

            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '3px' }}>Customer Name</label>
                <input type="text" className="input" value={simName} onChange={e => setSimName(e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '3px' }}>Star Rating</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <button key={num} type="button" onClick={() => { setSimRating(num); setTicketCreated(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Star size={22} style={{ color: num <= simRating ? 'var(--yellow)' : 'var(--fill-primary)', fill: num <= simRating ? 'var(--yellow)' : 'transparent', transition: 'all 100ms ease' }} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '3px' }}>Comments</label>
                <textarea className="input" rows={3} value={simReviewText} onChange={e => setSimReviewText(e.target.value)} placeholder={simRating >= 4 ? 'Positive review...' : 'What went wrong?'} style={{ width: '100%', padding: '6px 10px', fontSize: '12px', resize: 'none' }} />
              </div>
              <button type="submit" className="btn-primary" disabled={simRating === 0} style={{ fontSize: '12px' }}>Submit Survey Response</button>
            </form>

            {simRating >= 4 && (
              <div style={{ marginTop: '12px', background: 'rgba(52,199,89,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(52,199,89,0.2)' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--green)', marginBottom: '3px' }}><CheckCircle size={11} /> ROUTING TO PUBLIC PLATFORMS</div>
                <p style={{ fontSize: '10px', color: 'var(--label-secondary)', margin: 0 }}>AI will push this {simRating}★ review to Google, Amazon & Nykaa via API.</p>
              </div>
            )}
            {simRating > 0 && simRating <= 3 && !ticketCreated && (
              <div style={{ marginTop: '12px', background: 'rgba(255,59,48,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,59,48,0.2)' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--red)', marginBottom: '3px' }}><AlertTriangle size={11} /> NEGATIVE INTERCEPT — PUBLIC BLOCKED</div>
                <p style={{ fontSize: '10px', color: 'var(--label-secondary)', margin: 0 }}>Submitting will create a High Priority support ticket instead of posting publicly.</p>
              </div>
            )}
            {ticketCreated && (
              <div style={{ marginTop: '12px', background: 'rgba(255,59,48,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,59,48,0.2)', textAlign: 'center' }}>
                <XCircle size={18} style={{ color: 'var(--red)', margin: '0 auto 4px' }} />
                <div style={{ fontSize: '11px', fontWeight: '700' }}>Support Ticket #{supportCases.length} Created</div>
                <div style={{ fontSize: '10px', color: 'var(--label-secondary)', marginTop: '2px' }}>AI agent initialized and notified CS manager.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: ORDER LIFECYCLE ─────────────────────────────────────────────────── */}
      {activeTab === 'lifecycle' && (
        <div className="split-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '20px', alignItems: 'start' }}>
          {/* Timeline */}
          <div className="liquid-card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px' }}>Order Lifecycle — WhatsApp Automation</h3>
              <p style={{ fontSize: '12px', color: 'var(--label-secondary)', margin: 0 }}>Every stage triggers an automatic WhatsApp message to the customer. Click a stage to preview the message.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input type="text" className="input" placeholder="Order ID (e.g. SH-9840)" value={activeOrderId} onChange={e => setActiveOrderId(e.target.value)} style={{ fontSize: '12px', padding: '6px 10px', width: '140px' }} />
              <select className="input" value={activeCarrier} onChange={e => setActiveCarrier(e.target.value)} style={{ fontSize: '12px', padding: '6px 8px' }}>
                {['Delhivery', 'Shiprocket', 'Shadowfax', 'Xpressbees', 'Blue Dart'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="text" className="input" placeholder="Tracking ID" value={activeTrackId} onChange={e => setActiveTrackId(e.target.value)} style={{ fontSize: '12px', padding: '6px 10px', width: '130px' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', background: 'var(--separator)' }} />
              {timeline.map((step, idx) => (
                <div key={idx} onClick={() => setWaPreviewStep(idx)} style={{ display: 'flex', gap: '16px', marginBottom: '20px', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step.done ? 'var(--green)' : waPreviewStep === idx ? 'var(--blue)' : 'var(--fill-secondary)', color: step.done || waPreviewStep === idx ? 'white' : 'var(--label-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, border: waPreviewStep === idx ? '2px solid white' : 'none', fontSize: '12px', fontWeight: '700' }}>
                    {step.done ? <CheckCircle size={14} /> : idx + 1}
                  </div>
                  <div style={{ flexGrow: 1, paddingTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: waPreviewStep === idx ? '700' : '600', color: step.done ? 'var(--label-primary)' : 'var(--label-secondary)' }}>{step.stage}</span>
                      <span style={{ fontSize: '10px', color: 'var(--label-tertiary)' }}>{step.time}</span>
                    </div>
                    {step.done && <span className="badge badge-green" style={{ fontSize: '9px', marginTop: '2px' }}>Completed</span>}
                    {!step.done && waPreviewStep === idx && <span className="badge badge-blue" style={{ fontSize: '9px', marginTop: '2px' }}>Preview Selected</span>}
                    {!step.done && waPreviewStep !== idx && <span className="badge badge-grey" style={{ fontSize: '9px', marginTop: '2px' }}>Pending</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Message Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={14} style={{ color: 'var(--green)' }} /> WhatsApp Message Preview
                </h4>
                <span style={{ fontSize: '10px', color: 'var(--label-tertiary)' }}>Stage {waPreviewStep + 1}: {timeline[waPreviewStep]?.stage}</span>
              </div>

              {/* Phone mockup */}
              <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ background: '#075e54', padding: '10px 12px', borderRadius: '8px 8px 0 0', fontSize: '11px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>S</div>
                  Shills Beauty (Official)
                  <CheckCircle2 size={10} style={{ color: '#25d366', marginLeft: 'auto' }} />
                </div>
                <div style={{ background: '#0b0b0b', padding: '12px', borderRadius: '0 0 8px 8px', minHeight: '180px' }}>
                  <div style={{ background: '#1f2c34', padding: '10px 12px', borderRadius: '0 8px 8px 8px', maxWidth: '85%', marginLeft: 'auto' }}>
                    <p style={{ fontSize: '11px', color: '#e9edef', margin: 0, whiteSpace: 'pre-line', lineHeight: '1.5' }}>{timeline[waPreviewStep]?.waMsg}</p>
                    <div style={{ fontSize: '9px', color: '#8696a0', textAlign: 'right', marginTop: '4px' }}>{timeline[waPreviewStep]?.time || 'Pending'} ✓✓</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn-primary" style={{ flexGrow: 1, fontSize: '12px' }} onClick={() => handleSendWaUpdate(timeline[waPreviewStep])}>
                  <Send size={12} /> Send This Message Now
                </button>
                <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={() => showToast('Message copied to clipboard.', 'info')}>
                  Copy
                </button>
              </div>
            </div>

            <div className="liquid-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>Automation Rules Active</h4>
              {[
                ['Order Placed', 'Immediate — via Shopify webhook'],
                ['Payment Verified', 'Immediate — via Razorpay webhook'],
                ['Out for Delivery', 'Carrier API pull — every 2 hrs'],
                ['Delivery Attempted', 'Carrier exception webhook'],
                ['Delivered', 'Carrier delivery confirmation'],
                ['Day 3 Review Ask', 'Scheduled — 72 hrs post delivery'],
              ].map(([stage, rule]) => (
                <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid var(--separator)', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600' }}>{stage}</span>
                  <span style={{ color: 'var(--label-tertiary)', fontSize: '10px' }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CARRIER TRACKING ────────────────────────────────────────────────── */}
      {activeTab === 'tracking' && (
        <div className="carrier-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div className="liquid-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px' }}>Live Delivery Partner Pull</h3>
                <p style={{ fontSize: '12px', color: 'var(--label-secondary)', margin: 0 }}>Platform fetches real-time status from each carrier's API and triggers WhatsApp updates automatically.</p>
              </div>
              <button className="btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handlePullTracking} disabled={trackingPullLoading}>
                {trackingPullLoading ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />} Pull All Statuses
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DELIVERY_PARTNER_UPDATES.map((d, idx) => (
                <div key={idx} style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px', borderLeft: `3px solid ${d.status === 'Delivered' ? 'var(--green)' : d.status === 'Exception' ? 'var(--red)' : d.status === 'Out for Delivery' ? 'var(--blue)' : 'var(--orange)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{d.carrier}</span>
                      <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', marginLeft: '8px' }}>{d.trackId}</span>
                    </div>
                    <span className={`badge ${d.status === 'Delivered' ? 'badge-green' : d.status === 'Exception' ? 'badge-red' : d.status === 'Out for Delivery' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: '9px' }}>{d.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--label-secondary)', marginBottom: '8px' }}>
                    <span><MapPin size={10} style={{ marginRight: '3px' }} />{d.location}</span>
                    <span><Clock size={10} style={{ marginRight: '3px' }} />{d.updated}</span>
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ color: 'var(--label-tertiary)' }}>ETA: </span>
                    <span style={{ fontWeight: '700', color: d.status === 'Exception' ? 'var(--red)' : 'var(--label-primary)' }}>{d.eta}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <button className="btn-primary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => showToast(`WhatsApp update sent to customer for ${d.trackId}: "${d.status} — ${d.location}"`, 'success')}>
                      <Smartphone size={10} /> WA Update
                    </button>
                    {d.status === 'Exception' && (
                      <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px', color: 'var(--red)' }} onClick={() => showToast(`Escalated ${d.trackId} exception to ops team.`, 'error')}>
                        <AlertTriangle size={10} /> Escalate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} style={{ color: 'var(--blue)' }} /> Carrier Performance
              </h4>
              {[['Delhivery', 94.2, 'var(--green)'], ['Shiprocket', 91.8, 'var(--green)'], ['Shadowfax', 88.5, 'var(--orange)'], ['Xpressbees', 83.1, 'var(--orange)'], ['Blue Dart', 96.4, 'var(--green)']].map(([name, pct, color]) => (
                <div key={name as string} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '600' }}>{name as string}</span>
                    <span style={{ color: color as string, fontWeight: '700' }}>{pct as number}% on-time</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--fill-primary)', borderRadius: '2px' }}>
                    <div style={{ width: `${pct as number}%`, height: '100%', background: color as string, borderRadius: '2px', transition: 'width 600ms ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>Exception Handling Rules</h4>
              {[
                ['Delivery Attempted (2x failed)', 'Auto-call customer + raise ticket'],
                ['Package Delayed > 2 days', 'WhatsApp apology + ₹50 coupon'],
                ['RTO Initiated', 'AI contacts customer to retry delivery'],
                ['Damaged in Transit', 'Immediate replacement order triggered'],
                ['Lost Shipment', 'Full refund + replacement within 24hrs'],
              ].map(([trigger, action]) => (
                <div key={trigger as string} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '11px' }}>
                  <AlertTriangle size={12} style={{ color: 'var(--orange)', flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontWeight: '700' }}>{trigger as string}</div>
                    <div style={{ color: 'var(--label-secondary)' }}>{action as string}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: REVIEW ENGINE ──────────────────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="liquid-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px' }}>Public Review Feed</h3>
              <p style={{ fontSize: '12px', color: 'var(--label-secondary)', margin: 0 }}>4-5★ auto-posted to marketplaces. 1-3★ privately intercepted into support tickets.</p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge badge-green" style={{ fontSize: '10px', padding: '4px 10px' }}>CSAT {csatScore}/5</span>
              <span className="badge badge-blue" style={{ fontSize: '10px', padding: '4px 10px' }}>{totalReviews} Reviews</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {reviews.map(r => (
              <div key={r.id} style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px', borderLeft: `3px solid ${r.rating >= 4 ? 'var(--green)' : 'var(--red)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '13px' }}>{r.customer}</span>
                    <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', marginLeft: '8px' }}>{r.platform} · {r.date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1,2,3,4,5].map(n => <Star key={n} size={11} style={{ color: n <= r.rating ? 'var(--yellow)' : 'var(--fill-primary)', fill: n <= r.rating ? 'var(--yellow)' : 'transparent' }} />)}
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--label-secondary)', margin: '0 0 8px', lineHeight: '1.4' }}>{r.text}</p>
                {r.reply && <div style={{ fontSize: '11px', background: 'var(--fill-primary)', padding: '8px', borderRadius: '6px' }}><span style={{ color: 'var(--blue)', fontWeight: '700' }}>Brand Reply: </span>{r.reply}</div>}
                {!r.reply && r.rating >= 4 && (
                  <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px', marginTop: '4px' }} onClick={() => showToast('AI reply drafted and posted to review platform.', 'success')}>
                    AI Auto-Reply
                  </button>
                )}
                {r.rating < 4 && <span className="badge badge-red" style={{ fontSize: '9px', marginTop: '4px', display: 'inline-block' }}>Intercepted — Not Public</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: SLA DASHBOARD ──────────────────────────────────────────────────── */}
      {activeTab === 'sla' && (
        <div className="sla-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="liquid-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>SLA Compliance Monitor</h3>
            {SLA_RULES.map((rule, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--separator)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{rule.rule}</div>
                  <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', marginTop: '2px' }}>Target: {rule.target}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: rule.met ? 'var(--green)' : 'var(--red)' }}>{rule.actual}</div>
                  <span className={`badge ${rule.met ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '9px' }}>{rule.met ? '✓ MET' : '✗ BREACH'}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>AI Automation Coverage</h4>
              {[['Order notifications', 100], ['Delivery status pulls', 100], ['Review solicitation (Day 3)', 100], ['1-3★ intercept to ticket', 100], ['First AI response', 100], ['Refund initiation (standard)', 82], ['Exchange dispatch', 79], ['Complex escalations', 0]].map(([label, pct]) => (
                <div key={label as string} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>{label as string}</span>
                    <span style={{ fontWeight: '700', color: (pct as number) === 100 ? 'var(--green)' : (pct as number) > 50 ? 'var(--orange)' : 'var(--red)' }}>{pct as number}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--fill-primary)', borderRadius: '2px' }}>
                    <div style={{ width: `${pct as number}%`, height: '100%', background: (pct as number) === 100 ? 'var(--green)' : (pct as number) > 50 ? 'var(--orange)' : 'var(--red)', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>Quick Actions</h4>
              {[['Send bulk WA — all pending orders', 'success'], ['Pull all carrier updates now', 'info'], ['Escalate all unresolved > 4hrs', 'error'], ['Export case log to CSV', 'info']].map(([label, type]) => (
                <button key={label as string} className="btn-secondary" style={{ width: '100%', textAlign: 'left', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => showToast(`${label}`, type as any)}>
                  <ChevronRight size={12} /> {label as string}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
