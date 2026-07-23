'use client';

import React from 'react';
import Link from 'next/link';
import { useAppContext } from '../ClientWrapper';
import type { Salon, WhatsappLog, EmailLog } from '@/lib/supabase/salonCrm';
import {
  LayoutDashboard,
  Package,
  Bot,
  DollarSign,
  Users,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

interface MasterDashboardProps {
  salonCrm: {
    salons: Salon[];
    whatsappLogs: WhatsappLog[];
    emailLogs: EmailLog[];
  };
}

export default function MasterDashboard({ salonCrm }: MasterDashboardProps) {
  const { inventory, supportCases, receivables, reviews, contentDrafts } = useAppContext();

  // Salon CRM (live)
  const salonLeadsTotal = salonCrm.salons.length;
  const salonWon = salonCrm.salons.filter((s) => s.current_stage === 'won').length;
  const salonActive = salonCrm.salons.filter((s) => s.current_stage !== 'won' && s.current_stage !== 'lost').length;
  const salonPositiveSignals =
    salonCrm.whatsappLogs.filter((l) => l.interest === 'positive').length +
    salonCrm.emailLogs.filter((l) => l.interest === 'positive').length;

  // Receivables (mock)
  const totalOutstanding = receivables.reduce((acc, r) => acc + r.outstanding, 0);
  const overdueCount = receivables.filter((r) => r.overdueDays > 0).length;

  // Inventory (mock)
  const lowStockCount = inventory.filter((p) => {
    const totalStock = p.warehouse + p.amazon + p.blinkit + p.myntra + p.flipkart + p.instamart + p.nykaa + p.shopify;
    const daysLeft = p.avgMonthlySales > 0 ? Math.round((totalStock / p.avgMonthlySales) * 30) : 100;
    return daysLeft <= 15;
  }).length;
  const totalInventoryValue = inventory.reduce((acc, p) => {
    const totalStock = p.warehouse + p.amazon + p.blinkit + p.myntra + p.flipkart + p.instamart + p.nykaa + p.shopify;
    return acc + totalStock * p.cost;
  }, 0);

  // Customer Care (mock)
  const activeCases = supportCases.filter((c) => c.status === 'Open').length;
  const negativeReviews = reviews.filter((r) => r.rating <= 3).length;

  // Content OS (mock)
  const contentInReview = contentDrafts.filter((c) => c.status === 'review').length;

  const channels = [
    {
      id: 'executive',
      name: 'Executive Board',
      href: '/dashboard',
      icon: LayoutDashboard,
      color: 'var(--blue)',
      stat: `₹${(totalOutstanding / 100000).toFixed(1)}L`,
      statLabel: 'Founder overview',
    },
    {
      id: 'inventory',
      name: 'Inventory Intel',
      href: '/inventory',
      icon: Package,
      color: 'var(--orange)',
      stat: `${lowStockCount} SKUs`,
      statLabel: 'Low stock alerts',
    },
    {
      id: 'customer-care',
      name: 'Customer Care',
      href: '/customer-care',
      icon: Bot,
      color: 'var(--green)',
      stat: `${activeCases} open`,
      statLabel: 'Active support cases',
    },
    {
      id: 'content-os',
      name: 'Content OS',
      href: '/marketing',
      icon: Sparkles,
      color: 'var(--pink)',
      stat: `${contentInReview} in review`,
      statLabel: 'Content pipeline',
    },
    {
      id: 'salon-crm',
      name: 'Salon CRM',
      href: '/salon-crm/dashboard',
      icon: Users,
      color: 'var(--purple)',
      stat: `${salonLeadsTotal} leads`,
      statLabel: 'B2B salon pipeline',
    },
    {
      id: 'receivables',
      name: 'Receivables Recovery',
      href: '/accounts-receivable/dashboard',
      icon: DollarSign,
      color: 'var(--red)',
      stat: `${overdueCount} overdue`,
      statLabel: 'AR collections',
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Master Dashboard</h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          Combined metrics across every channel. Pick a channel below to drill in.
        </p>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Salon CRM Leads</span>
          <span className="value">{salonLeadsTotal}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><Users size={12} /> {salonActive} active, {salonWon} won</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Receivables Outstanding</span>
          <span className="value">₹{(totalOutstanding / 100000).toFixed(1)}L</span>
          <span className="trend down" style={{ color: 'var(--red)' }}><Clock size={12} /> {overdueCount} invoices overdue</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Inventory Value</span>
          <span className="value">₹{(totalInventoryValue / 100000).toFixed(1)}L</span>
          <span className="trend down" style={{ color: 'var(--red)' }}><AlertTriangle size={12} /> {lowStockCount} low stock SKUs</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Salon CRM Positive Signals</span>
          <span className="value">{salonPositiveSignals}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><TrendingUp size={12} /> Across WhatsApp + Email</span>
        </div>
      </div>

      <div className="liquid-card mb-24" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Support & Content Snapshot</h3>
        <p style={{ fontSize: '12px', color: 'var(--label-secondary)', marginBottom: '16px' }}>Quick pulse on customer care and marketing pipeline</p>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Open Support Cases</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--green)', marginTop: '4px' }}>{activeCases}</div>
          </div>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Negative Reviews Intercepted</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--orange)', marginTop: '4px' }}>{negativeReviews}</div>
          </div>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Content Awaiting Review</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--pink)', marginTop: '4px' }}>{contentInReview}</div>
          </div>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Channels</h3>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.id} href={c.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  style={{
                    background: 'var(--fill-quaternary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'transform 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${c.color}1a`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} />
                    </div>
                    <ArrowUpRight size={14} style={{ color: 'var(--label-tertiary)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--label-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>{c.statLabel}</div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: c.color }}>{c.stat}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
