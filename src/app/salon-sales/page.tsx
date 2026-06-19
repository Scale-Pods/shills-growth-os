'use client';

import React, { useState } from 'react';
import { useAppContext } from '../ClientWrapper';
import {
  Users,
  Search,
  Sliders,
  Send,
  Plus,
  RefreshCw,
  MapPin,
  Smartphone,
  Mail,
  Volume2,
  Calendar,
  DollarSign,
  TrendingUp,
  Map,
  CheckCircle,
  Clock,
  ArrowRight,
  ClipboardList
} from 'lucide-react';

export default function SalonSalesPage() {
  const {
    salonLeads,
    setSalonLeads,
    showToast
  } = useAppContext();

  // Scraper State
  const [scraperLocation, setScraperLocation] = useState('Bandra West, Mumbai');
  const [scraperTarget, setScraperTarget] = useState('Nail studios');
  const [scraperStatus, setScraperStatus] = useState('idle'); // idle, scraping, complete
  const [scrapedResults, setScrapedResults] = useState<any[]>([]);

  // CRM Filter States
  const [crmSearch, setCrmSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  
  // Selected lead for outreach panel
  const [selectedLeadId, setSelectedLeadId] = useState('lead-1');
  const [outreachChannel, setOutreachChannel] = useState('whatsapp');

  // Compute CRM Pipeline figures
  const totalLeads = 342;
  const meetingsBooked = 28;
  const samplesSent = salonLeads.filter(l => l.stage === 'Sample Sent').length;
  const pipelineValue = salonLeads.filter(l => l.stage !== 'Lost' && l.stage !== 'Won').length * 45000 + 120000;

  // Google Maps scraper simulator
  const runScraper = () => {
    setScraperStatus('scraping');
    setScrapedResults([]);

    setTimeout(() => {
      const mockScraped = [
        { id: `scraped-${Date.now()}-1`, name: 'Posh Polished Salon', phone: '+91 98112 04040', email: 'hello@poshpolished.in', location: scraperLocation, website: 'poshpolished.in', stage: 'Lead', notes: 'Scraped from Google Maps' },
        { id: `scraped-${Date.now()}-2`, name: 'Glamour Tips Academy', phone: '+91 99334 55110', email: 'admissions@glamourtips.com', location: scraperLocation, website: 'glamourtipsacademy.com', stage: 'Lead', notes: 'Scraped from Google Maps' }
      ];

      setScrapedResults(mockScraped);
      setScraperStatus('complete');
      showToast(`Scraper finished. Extracted 2 verified B2B leads from ${scraperLocation}.`, 'success');
    }, 1800);
  };

  // Add scraped leads to CRM
  const importLeads = () => {
    if (scrapedResults.length === 0) return;
    setSalonLeads(prev => [...prev, ...scrapedResults]);
    setScrapedResults([]);
    setScraperStatus('idle');
    showToast('Imported leads directly into B2B CRM pipeline!', 'success');
  };

  // Switch lead stage
  const moveStage = (leadId: string, nextStage: string) => {
    setSalonLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        showToast(`Moved ${l.name} stage to ${nextStage}`, 'info');
        return { ...l, stage: nextStage };
      }
      return l;
    }));
  };

  // Trigger outbound outreach
  const triggerOutreach = (leadId: string) => {
    const lead = salonLeads.find(l => l.id === leadId);
    if (!lead) return;

    let msg = '';
    if (outreachChannel === 'whatsapp') {
      msg = `Outbound WhatsApp sent: "Hi ${lead.name}, we'd love to ship a free tester package of Shills Gel Set #12 for your nail artists..."`;
    } else if (outreachChannel === 'email') {
      msg = `Outbound B2B Email sent: "Proposal: Premium Gel Polish Wholesale Partnership - Shills Professional"`;
    } else {
      msg = `AI Voice Call queued: Dialing ${lead.phone} with Salon Onboarding voice agent...`;
    }

    showToast(msg, 'success');
    
    // Automatically advance stage from Lead to Contacted
    if (lead.stage === 'Lead') {
      moveStage(leadId, 'Contacted');
    }
  };

  const activeLead = salonLeads.find(l => l.id === selectedLeadId) || salonLeads[0];

  const crmStages = ['Lead', 'Contacted', 'Interested', 'Sample Sent', 'Negotiation', 'Won', 'Lost'];

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>B2B Salon Sales Engine</h2>
            <span style={{ fontSize: '10px', background: 'rgba(0, 122, 255, 0.08)', color: 'var(--blue)', border: '1px solid rgba(0, 122, 255, 0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Powered by ScalePods</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>Scrape beauty academies and nail studios off Google Maps, and queue automated outreach campaigns.</p>
        </div>
      </div>

      {/* CRM Stats */}
      <div className="metrics-grid mb-24">
        
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Total Leads Generated</span>
          <span className="value">{totalLeads} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Salons</span></span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Map size={12} /> Google Maps Source</span>
        </div>

        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Meetings Booked</span>
          <span className="value">{meetingsBooked} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Demos</span></span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><Calendar size={12} /> B2B Pitch Schedule</span>
        </div>

        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Samples Dispatched</span>
          <span className="value">{samplesSent} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Kits</span></span>
          <span className="trend up" style={{ color: 'var(--orange)' }}><ClipboardList size={12} /> Trial Run Stage</span>
        </div>

        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">CRM Pipeline Value</span>
          <span className="value">₹{(pipelineValue / 100000).toFixed(1)}L</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><DollarSign size={12} /> Estimated Contracts</span>
        </div>

      </div>

      {/* Google Maps Scraper Interface */}
      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} style={{ color: 'var(--red)' }} /> Google Maps Lead Scraper
        </h3>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>Geographic Target Location</label>
            <input 
              type="text" 
              className="input" 
              value={scraperLocation}
              onChange={(e) => setScraperLocation(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
              placeholder="e.g. Bandra West, Mumbai"
            />
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>Salon Category Target</label>
            <select 
              className="input"
              value={scraperTarget}
              onChange={(e) => setScraperTarget(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '13px' }}
            >
              <option value="Nail studios">Nail Studios & Salons</option>
              <option value="Beauty salons">Beauty Salons</option>
              <option value="Nail academies">Nail Academies</option>
              <option value="Makeup studios">Makeup Studios</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={runScraper}
              disabled={scraperStatus === 'scraping'}
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {scraperStatus === 'scraping' ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
              {scraperStatus === 'scraping' ? 'Scraping Google Maps...' : 'Run Google Maps Scraper'}
            </button>
          </div>
        </div>

        {/* Live Scraper Logs Screen */}
        {scraperStatus === 'scraping' && (
          <div style={{ background: 'black', padding: '12px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={12} className="animate-pulse" />
              <span>[SYSTEM LOG]: Dialing GMap Geocoding API for coordinates of {scraperLocation}...</span>
            </div>
            <div>[SYSTEM LOG]: Pulling local listings matching query: "{scraperTarget}"...</div>
            <div style={{ color: 'white' }}>[SYSTEM LOG]: Extracting Name, Mobile numbers, Emails, and website contact forms...</div>
          </div>
        )}

        {/* Results Found screen */}
        {scraperStatus === 'complete' && scrapedResults.length > 0 && (
          <div style={{ background: 'var(--fill-quaternary)', padding: '16px', borderRadius: '12px', border: '1.5px dashed var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--label-primary)' }}>Scraped Leads Found:</span>
              <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={importLeads}>Import to CRM</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scrapedResults.map((r, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-layer1)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontWeight: '700' }}>{r.name}</span>
                    <span style={{ color: 'var(--label-tertiary)', marginLeft: '8px' }}>{r.location}</span>
                  </div>
                  <div>
                    <span>{r.phone} • {r.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* B2B CRM pipeline & outreach console */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* B2B CRM Table */}
        <div className="liquid-card" style={{ padding: '24px' }}>
          <div className="table-header-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Active B2B Sales Pipeline</h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Search CRM..." 
                className="input" 
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px', width: '150px' }}
              />
              <select 
                className="input"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                style={{ padding: '8px', fontSize: '13px' }}
              >
                <option value="all">All Stages</option>
                {crmStages.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                  <th style={{ padding: '12px 8px' }}>Studio / Salon</th>
                  <th style={{ padding: '12px 8px' }}>Location</th>
                  <th style={{ padding: '12px 8px' }}>Contacts</th>
                  <th style={{ padding: '12px 8px' }}>Pipeline Stage</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Shift Stage</th>
                </tr>
              </thead>
              <tbody>
                {salonLeads
                  .filter(l => {
                    const matchesSearch = l.name.toLowerCase().includes(crmSearch.toLowerCase()) || l.location.toLowerCase().includes(crmSearch.toLowerCase());
                    const matchesStage = stageFilter === 'all' || l.stage === stageFilter;
                    return matchesSearch && matchesStage;
                  })
                  .map(l => (
                    <tr 
                      key={l.id} 
                      onClick={() => setSelectedLeadId(l.id)}
                      style={{ borderBottom: '1px solid var(--separator)', cursor: 'pointer', background: selectedLeadId === l.id ? 'var(--fill-tertiary)' : 'transparent' }}
                    >
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontWeight: '700', display: 'block' }}>{l.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{l.website}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{l.location}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ display: 'block' }}>{l.phone}</span>
                        <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{l.email}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${
                          l.stage === 'Won' ? 'badge-green' : l.stage === 'Lost' ? 'badge-red' : l.stage === 'Sample Sent' ? 'badge-orange' : 'badge-blue'
                        }`}>
                          {l.stage}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <select 
                          className="input"
                          value={l.stage}
                          onChange={(e) => moveStage(l.id, e.target.value)}
                          style={{ padding: '4px', fontSize: '11.5px', background: 'var(--bg-layer1)' }}
                        >
                          {crmStages.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CRM Outreach Console */}
        <div className="liquid-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Outreach Control Panel
          </h3>
          
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Active Lead</span>
            <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '2px' }}>{activeLead.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '2px' }}>{activeLead.location} • Stage: <strong>{activeLead.stage}</strong></div>
            <p style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '8px', color: 'var(--label-secondary)', borderTop: '1px solid var(--separator)', paddingTop: '6px' }}>
              Notes: "{activeLead.notes}"
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>Select Outreach Channel</label>
              <div style={{ display: 'flex', background: 'var(--fill-tertiary)', padding: '2px', borderRadius: '8px' }}>
                <button 
                  onClick={() => setOutreachChannel('whatsapp')}
                  style={{ flex: 1, border: 'none', background: outreachChannel === 'whatsapp' ? 'var(--bg-layer1)' : 'transparent', color: outreachChannel === 'whatsapp' ? 'var(--green)' : 'var(--label-secondary)', fontSize: '11px', fontWeight: '700', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Smartphone size={12} /> WA
                </button>
                <button 
                  onClick={() => setOutreachChannel('email')}
                  style={{ flex: 1, border: 'none', background: outreachChannel === 'email' ? 'var(--bg-layer1)' : 'transparent', color: outreachChannel === 'email' ? 'var(--blue)' : 'var(--label-secondary)', fontSize: '11px', fontWeight: '700', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Mail size={12} /> Email
                </button>
                <button 
                  onClick={() => setOutreachChannel('voice')}
                  style={{ flex: 1, border: 'none', background: outreachChannel === 'voice' ? 'var(--bg-layer1)' : 'transparent', color: outreachChannel === 'voice' ? 'var(--purple)' : 'var(--label-secondary)', fontSize: '11px', fontWeight: '700', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Volume2 size={12} /> Voice
                </button>
              </div>
            </div>

            {/* Template Box */}
            <div style={{ background: 'var(--fill-secondary)', padding: '12px', borderRadius: '8px', fontSize: '11.5px' }}>
              <span style={{ fontWeight: '700', color: 'var(--label-secondary)', textTransform: 'uppercase', fontSize: '9px' }}>AI Template Draft</span>
              <p style={{ marginTop: '4px', color: 'var(--label-primary)', lineHeight: '1.4' }}>
                {outreachChannel === 'whatsapp' && `Hi ${activeLead.name.split(' ')[0]}, this is Shills B2B Onboarding. We saw your Google Maps listing. We'd love to dispatch a free tester pack of Shills Gel Set #12 for your nail artists. Pls verify details.`}
                {outreachChannel === 'email' && `Subject: Salon Wholesale Catalog & Starter Kit Proposal - Shills Professional\n\nDear Buying Manager,\nWe would love to establish a wholesale relationship with ${activeLead.name}...`}
                {outreachChannel === 'voice' && `[Outgoing Voice Dialer Protocol]\nSpeech text: "Hello, calling from Shills B2B division regarding wholesale pricing quotes for ${activeLead.name}..."`}
              </p>
            </div>

            <button 
              className="btn-primary" 
              onClick={() => triggerOutreach(activeLead.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Send size={14} /> Send Outreach Campaign
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
