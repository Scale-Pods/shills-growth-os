'use client';

import React, { useState } from 'react';
import { useAppContext } from '../ClientWrapper';
import {
  Bot,
  MessageSquare,
  Star,
  CheckCircle,
  AlertTriangle,
  Send,
  Smartphone,
  ChevronRight,
  UserCheck,
  Award,
  ThumbsDown,
  UserX,
  XCircle,
  Plus,
  Clock
} from 'lucide-react';

export default function CustomerCarePage() {
  const {
    supportCases,
    setSupportCases,
    reviews,
    setReviews,
    showToast
  } = useAppContext();

  // Page States
  const [selectedChannel, setSelectedChannel] = useState('whatsapp'); // whatsapp, shopify, website
  const [activeCaseId, setActiveCaseId] = useState('case-1');
  const [overrideInput, setOverrideInput] = useState('');
  
  // Journey Step State
  const [activeJourneyStep, setActiveJourneyStep] = useState(4); // default to feedback collection

  // Review Solicit Simulator States
  const [simRating, setSimRating] = useState(0);
  const [simReviewText, setSimReviewText] = useState('');
  const [simName, setSimName] = useState('Nisha Gupta');
  const [simProduct, setSimProduct] = useState('Nail Gel Set #12');
  const [ticketCreated, setTicketCreated] = useState(false);

  // CSAT Stats
  const totalReviews = reviews.length;
  const negativeIntercepted = reviews.filter(r => r.rating <= 3).length;
  const csatScore = 4.82;

  // Journey Steps Configuration
  const journeySteps = [
    { label: 'Order Placed', desc: 'AI sends confirmation invoice + delivery schedule via WhatsApp.' },
    { label: 'Order Shipped', desc: 'AI updates order status and logs carrier tracking link.' },
    { label: 'Tracking Updates', desc: 'AI monitors courier API and handles delays proactively.' },
    { label: 'Delivery Confirmation', desc: 'AI checks in to confirm package arrival at door.' },
    { label: 'Feedback Collection', desc: 'Day 3 automation pings user for rating. ⭐⭐⭐⭐⭐' },
    { label: 'Review Generation', desc: 'AI pushes 4-5★ to Nykaa/Amazon; intercepts 1-3★ to Support.' }
  ];

  // Active Case Thread
  const activeCase = supportCases.find(c => c.id === activeCaseId) || supportCases[0];

  // Send Manual Override Message
  const handleSendOverride = () => {
    if (!overrideInput.trim()) return;

    setSupportCases(prev => prev.map(c => {
      if (c.id === activeCaseId) {
        return {
          ...c,
          thread: [
            ...c.thread,
            { sender: 'founder-user', msg: `[Human Override] ${overrideInput}`, time: 'Just now' }
          ]
        };
      }
      return c;
    }));

    setOverrideInput('');
    showToast('Manual support override message sent.', 'success');
  };

  // Escalate case
  const handleEscalate = () => {
    setSupportCases(prev => prev.map(c => {
      if (c.id === activeCaseId) {
        return { ...c, escalation: 'Human Support Needed' };
      }
      return c;
    }));
    showToast('Ticket escalated to Live Support Manager.', 'info');
  };

  // Resolve case
  const handleResolve = () => {
    setSupportCases(prev => prev.map(c => {
      if (c.id === activeCaseId) {
        const isClosed = c.status === 'Resolved';
        return { ...c, status: isClosed ? 'Open' : 'Resolved', escalation: 'None' };
      }
      return c;
    }));
    showToast(activeCase.status === 'Open' ? 'Ticket marked as Resolved.' : 'Ticket re-opened.', 'success');
  };

  // Handle stars selection in mock survey
  const handleRatingSelect = (rating: number) => {
    setSimRating(rating);
    setTicketCreated(false);
  };

  // Submit survey feedback
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (simRating === 0) return;

    if (simRating >= 4) {
      // Create review
      const newReview = {
        id: `rev-${reviews.length + 1}`,
        customer: simName,
        rating: simRating,
        platform: 'Google Reviews',
        text: simReviewText || 'Great product! Absolutely loved it.',
        date: new Date().toISOString().split('T')[0],
        sentiment: 'positive',
        reply: 'Thank you for your response! We appreciate your support.'
      };
      setReviews([newReview, ...reviews]);
      showToast('Rating is 4-5★. Review pushed to Google & Amazon API!', 'success');
      
      // Reset
      setSimRating(0);
      setSimReviewText('');
    } else {
      // 1-3 stars: create support ticket
      const newCase = {
        id: `case-${supportCases.length + 1}`,
        customer: simName,
        channel: 'whatsapp',
        msg: `[Auto-Intercept Rating: ${simRating}★] ${simReviewText || 'Product did not meet expectations.'}`,
        status: 'Open',
        escalation: 'Low CSAT Auto-Intercept',
        time: 'Just now',
        thread: [
          { sender: 'customer', msg: `[Feedback Rating: ${simRating}★] ${simReviewText || 'Product did not meet expectations.'}`, time: 'Just now' },
          { sender: 'ai', msg: 'We are sorry you had a sub-par experience. We have logged ticket case-' + (supportCases.length + 1) + ' and escalated this to our CS manager.', time: 'Just now' }
        ]
      };
      setSupportCases([newCase, ...supportCases]);
      setTicketCreated(true);
      showToast('Rating is 1-3★. Negative review intercepted! Support ticket created.', 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Customer Care & Review Engine</h2>
            <span style={{ fontSize: '10px', background: 'rgba(0, 122, 255, 0.08)', color: 'var(--blue)', border: '1px solid rgba(0, 122, 255, 0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Powered by ScalePods</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>Automate shipment support chats and intercept negative ratings before they impact marketplace scores.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Live CSAT Level</span>
          <span className="value">{csatScore} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>/ 5</span></span>
          <span className="trend up"><CheckCircle size={12} /> Target: &gt; 4.7</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Public Reviews Generated</span>
          <span className="value">{totalReviews} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Ratings</span></span>
          <span className="trend up"><Award size={12} /> Nykaa, Google, Amazon</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Negative Reviews Intercepted</span>
          <span className="value">{negativeIntercepted} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Cases</span></span>
          <span className="trend down" style={{ color: 'var(--red)' }}><ThumbsDown size={12} /> Kept Off Public Feeds</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Avg Ticket Resolution</span>
          <span className="value">14.2 <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Mins</span></span>
          <span className="trend up"><Clock size={12} /> Automated Solves</span>
        </div>
      </div>

      {/* Customer Journey Stepper */}
      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>AI Post-Purchase Customer Journey</h3>
        
        {/* Horizontal Stepper */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          {journeySteps.map((step, index) => (
            <div 
              key={index} 
              onClick={() => setActiveJourneyStep(index)}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                cursor: 'pointer',
                minWidth: '120px'
              }}
            >
              <div 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: activeJourneyStep === index ? 'var(--blue)' : 'var(--fill-primary)', 
                  color: activeJourneyStep === index ? 'white' : 'var(--label-secondary)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                  marginBottom: '8px',
                  border: activeJourneyStep === index ? '2px solid white' : 'none',
                  transition: 'all 200ms ease'
                }}
              >
                {index + 1}
              </div>
              <span style={{ fontSize: '12px', fontWeight: activeJourneyStep === index ? '700' : '500', color: activeJourneyStep === index ? 'var(--label-primary)' : 'var(--label-secondary)', textAlign: 'center' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Selected Step Explanation Card */}
        <div style={{ background: 'var(--fill-quaternary)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--blue)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>
            Stage {activeJourneyStep + 1}: {journeySteps[activeJourneyStep].label}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>
            {journeySteps[activeJourneyStep].desc}
          </p>
        </div>
      </div>

      {/* Main Grid: AI Support Chat & Post Delivery Survey Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Support Case Console */}
        <div className="liquid-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--separator)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={20} style={{ color: 'var(--blue)' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>AI Support Agent Streams</h3>
                <p style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Live streams on Shopify, WhatsApp, and Instagram DM</p>
              </div>
            </div>
            
            {/* Channel Filter tabs */}
            <div style={{ display: 'flex', background: 'var(--fill-tertiary)', padding: '2px', borderRadius: '8px' }}>
              {['whatsapp', 'shopify', 'website'].map(ch => (
                <button 
                  key={ch} 
                  onClick={() => setSelectedChannel(ch)}
                  style={{ 
                    padding: '4px 10px', 
                    border: 'none', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: '700',
                    background: selectedChannel === ch ? 'var(--bg-layer1)' : 'transparent',
                    color: selectedChannel === ch ? 'var(--blue)' : 'var(--label-secondary)',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '16px' }}>
            
            {/* Ticket streams sidebar */}
            <div style={{ borderRight: '1px solid var(--separator)', paddingRight: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {supportCases.filter(c => c.channel === selectedChannel || selectedChannel === 'whatsapp').map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setActiveCaseId(c.id)}
                  style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: activeCaseId === c.id ? 'var(--fill-tertiary)' : 'transparent',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    borderLeft: c.escalation !== 'None' ? '3px solid var(--red)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700' }}>{c.customer}</span>
                    <span style={{ color: 'var(--label-tertiary)' }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--label-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.msg}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Thread */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--separator)', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>{activeCase.customer}</span>
                  <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginLeft: '8px' }}>({activeCase.channel.toUpperCase()})</span>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {activeCase.escalation === 'None' && activeCase.status === 'Open' && (
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--red)' }}
                      onClick={handleEscalate}
                    >
                      Escalate
                    </button>
                  )}
                  <button 
                    className="btn-primary" 
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={handleResolve}
                  >
                    {activeCase.status === 'Open' ? 'Resolve' : 'Reopen'}
                  </button>
                </div>
              </div>

              {/* Messages feed */}
              <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '6px', marginBottom: '10px' }}>
                {activeCase.thread.map((msg, idx) => {
                  const isUser = msg.sender === 'founder-user';
                  const isAI = msg.sender === 'ai';
                  
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        background: isUser ? 'var(--blue)' : isAI ? 'var(--fill-secondary)' : 'var(--fill-tertiary)',
                        color: isUser ? 'white' : 'var(--label-primary)',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        maxWidth: '85%',
                        fontSize: '12.5px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      <p>{msg.msg}</p>
                      <span style={{ fontSize: '9px', opacity: 0.6, display: 'block', textAlign: 'right', marginTop: '4px' }}>
                        {msg.time}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Text Input Override */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Type message to override AI response..." 
                  value={overrideInput}
                  onChange={(e) => setOverrideInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendOverride(); }}
                  style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }}
                />
                <button className="btn-primary" onClick={handleSendOverride}>
                  <Send size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Customer Experience Solicit Simulator */}
        <div className="liquid-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={16} style={{ color: 'var(--blue)' }} /> Post-Delivery Survey
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--label-secondary)', marginBottom: '16px' }}>
            Simulate a customer receiving a Day 3 check-in survey. Observe review routing or ticket creation.
          </p>

          <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>Customer Name</label>
              <input 
                type="text" 
                className="input" 
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>Product Purchased</label>
              <select 
                className="input" 
                value={simProduct}
                onChange={(e) => setSimProduct(e.target.value)}
                style={{ width: '100%', padding: '6px', fontSize: '12px' }}
              >
                <option value="Nail Gel Set #12">Nail Gel Set #12</option>
                <option value="Vitamin C Face Serum 30ml">Vitamin C Serum</option>
                <option value="Rosewater Face Mist 100ml">Rosewater Face Mist</option>
              </select>
            </div>

            {/* Star selector */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>Star Rating (Day 3 Check-in)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleRatingSelect(num)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Star 
                      size={24} 
                      style={{ 
                        color: num <= simRating ? 'var(--yellow)' : 'var(--fill-primary)',
                        fill: num <= simRating ? 'var(--yellow)' : 'transparent',
                        transition: 'all 100ms ease'
                      }} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review feedback text */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>Customer Experience Comments</label>
              <textarea 
                className="input" 
                rows={3}
                value={simReviewText}
                onChange={(e) => setSimReviewText(e.target.value)}
                placeholder={simRating >= 4 ? 'Provide positive review text...' : 'Provide negative experience details...'}
                style={{ width: '100%', padding: '6px 10px', fontSize: '12px', resize: 'none' }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={simRating === 0}>
              Submit Survey Response
            </button>
          </form>

          {/* Conditional Alerts */}
          {simRating >= 4 && (
            <div style={{ marginTop: '16px', background: 'rgba(52, 199, 89, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(52, 199, 89, 0.2)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--green)' }}>
                <CheckCircle size={12} /> ROUTING AI AUTOMATION
              </div>
              <p style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '4px' }}>
                AI detected {simRating}★ rating. Soliciting user review directly to <strong>Google, Amazon, and Nykaa storefronts</strong> to boost SEO.
              </p>
            </div>
          )}

          {simRating > 0 && simRating <= 3 && !ticketCreated && (
            <div style={{ marginTop: '16px', background: 'rgba(255, 59, 48, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 59, 48, 0.2)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--red)' }}>
                <AlertTriangle size={12} /> NEGATIVE RATING INTERCEPT
              </div>
              <p style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '4px' }}>
                AI detected {simRating}★ rating. Public submission blocked. Pressing submit will automatically create a <strong>High Priority Support Ticket</strong> in the dashboard.
              </p>
            </div>
          )}

          {ticketCreated && (
            <div style={{ marginTop: '16px', background: 'rgba(255, 59, 48, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 59, 48, 0.2)', textAlign: 'center' }}>
              <XCircle size={20} style={{ color: 'var(--red)', margin: '0 auto 6px' }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--label-primary)' }}>Support Ticket Created!</span>
              <p style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '2px' }}>
                Assigned Case #{supportCases.length}. AI Support Agent initialized.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
