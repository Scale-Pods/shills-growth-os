'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Chart from 'chart.js/auto';
import { useAppContext } from '../ClientWrapper';
import {
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  DollarSign,
  Package,
  Users,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const {
    inventory,
    supportCases,
    reviews,
    receivables,
    salonLeads,
    contentDrafts,
    dateFilter,
    showToast
  } = useAppContext();

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Compute stats for overview
  const totalOutstanding = receivables.reduce((acc, curr) => acc + curr.outstanding, 0);
  const overdueCount = receivables.filter(r => r.overdueDays > 0).length;
  const overdueValue = receivables.filter(r => r.overdueDays > 0).reduce((acc, curr) => acc + curr.outstanding, 0);

  // Inventory Stats
  const lowStockProducts = inventory.filter(p => {
    const totalStock = p.warehouse + p.amazon + p.blinkit + p.myntra + p.flipkart + p.instamart + p.nykaa + p.shopify;
    const daysLeft = p.avgMonthlySales > 0 ? Math.round((totalStock / p.avgMonthlySales) * 30) : 100;
    return daysLeft <= 15;
  });
  
  const totalInventoryValue = inventory.reduce((acc, p) => {
    const totalStock = p.warehouse + p.amazon + p.blinkit + p.myntra + p.flipkart + p.instamart + p.nykaa + p.shopify;
    return acc + (totalStock * p.cost);
  }, 0);

  // Customer Care Stats
  const activeCases = supportCases.filter(c => c.status === 'Open').length;
  const avgCsat = 4.82;
  const negativeReviewsIntercepted = reviews.filter(r => r.rating <= 3).length;

  // Salon CRM Stats
  const totalLeadsCount = salonLeads.length;
  const samplesSentCount = salonLeads.filter(l => l.stage === 'Sample Sent').length;
  const pipelineValue = salonLeads.filter(l => l.stage !== 'Lost' && l.stage !== 'Won').length * 45000 + 120000;

  // Marketing Stats
  const postsPublishedThisMonth = 24;
  const totalMarketingReach = '148.5K';
  const averageEngagement = '6.4%';

  // Render Charts
  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
              {
                label: 'Gross Revenue (₹)',
                data: [1850000, 2100000, 2350000, 2780000],
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
              },
              {
                label: 'B2B Collections (₹)',
                data: [350000, 480000, 520000, 620000],
                borderColor: '#AF52DE',
                backgroundColor: 'rgba(175, 82, 222, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                borderDash: [5, 5]
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: 'rgba(255,255,255,0.7)',
                  font: {
                    family: '-apple-system, system-ui, sans-serif',
                    weight: 500
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false }
              },
              y: {
                grid: {
                  color: 'rgba(255, 255, 255, 0.08)'
                },
                ticks: {
                  callback: (value) => '₹' + (Number(value) / 100000) + 'L'
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      
      {/* Metrics Row */}
      <div className="metrics-grid select-none" style={{ marginBottom: '24px' }}>
        
        {/* Module 3 Widget */}
        <Link href="/accounts-receivable" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)', cursor: 'pointer' } as React.CSSProperties}>
            <span className="label">Receivables Outstanding</span>
            <span className="value">₹{(totalOutstanding / 100000).toFixed(1)}L</span>
            <span className="trend down" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {overdueCount} Invoices Overdue
            </span>
          </div>
        </Link>

        {/* Module 1 Widget */}
        <Link href="/inventory" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)', cursor: 'pointer' } as React.CSSProperties}>
            <span className="label">Inventory Value</span>
            <span className="value">₹{(totalInventoryValue / 100000).toFixed(1)}L</span>
            <span className="trend down" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> {lowStockProducts.length} low stock SKUs
            </span>
          </div>
        </Link>

        {/* Module 2 Widget */}
        <Link href="/customer-care" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)', cursor: 'pointer' } as React.CSSProperties}>
            <span className="label">CSAT / Support cases</span>
            <span className="value">{avgCsat}<span className="metric-sub">/5</span></span>
            <span className="trend up" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> {activeCases} Active tickets
            </span>
          </div>
        </Link>

        {/* Module 4 Widget */}
        <Link href="/salon-sales" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)', cursor: 'pointer' } as React.CSSProperties}>
            <span className="label">Salon pipeline</span>
            <span className="value">₹{(pipelineValue / 100000).toFixed(1)}L</span>
            <span className="trend up" style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={12} /> {totalLeadsCount} active leads
            </span>
          </div>
        </Link>

      </div>

      {/* Founder Intelligence Briefing */}
      <div className="ai-insights-strip liquid-card" style={{ marginBottom: '24px' }}>
        <div className="ai-header">
          <div className="ai-logo"><Sparkles size={16} /></div>
          <div className="ai-title-details">
            <span className="ai-title" style={{ fontWeight: '700', fontSize: '15px' }}>Founder Intelligence Briefing</span>
            <span className="ai-subtitle" style={{ fontSize: '11px', opacity: 0.6 }}>AI updates sync: Just now</span>
          </div>
        </div>
        <div className="insights-scroll-container" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="insight-pill" style={{ background: 'rgba(255, 149, 0, 0.1)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span className="badge badge-orange" style={{ padding: '2px 6px', background: 'var(--orange)', color: 'white', borderRadius: '4px', fontWeight: '700' }}>RECEIVABLES</span>
            <span className="insight-text" style={{ fontWeight: '500' }}>₹{(overdueValue / 100000).toFixed(1)}L is currently overdue. Auto 21-day WhatsApp recovery triggered.</span>
          </div>
          <div className="insight-pill" style={{ background: 'rgba(255, 59, 48, 0.1)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span className="badge badge-red" style={{ padding: '2px 6px', background: 'var(--red)', color: 'white', borderRadius: '4px', fontWeight: '700' }}>OUT OF STOCK</span>
            <span className="insight-text" style={{ fontWeight: '500' }}>Rosewater Face Mist is critical (8 units remaining). China lead time: 30 days. Restock suggested: 1200 units.</span>
          </div>
        </div>
      </div>

      {/* Executive Board Dashboard Layout */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Hand: Gross revenue and collections chart */}
        <div className="dashboard-left" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="liquid-card" style={{ padding: '24px' }}>
            <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="card-title-group">
                <h3 className="card-title" style={{ fontSize: '16px', fontWeight: '700' }}>Revenue Trend & Collections Tracking</h3>
                <span className="card-subtitle" style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>Comparing direct revenue and B2B outstanding recovery results</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                L30D PERIOD
              </span>
            </div>
            
            <div className="chart-wrapper" style={{ height: '320px', position: 'relative' }}>
              <canvas ref={chartRef}></canvas>
            </div>
          </div>

          {/* Module 5: Marketing OS Summary */}
          <div className="liquid-card" style={{ padding: '24px' }}>
            <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="card-title-group">
                <h3 className="card-title" style={{ fontSize: '16px', fontWeight: '700' }}>Marketing Content OS Calendar Overview</h3>
                <span className="card-subtitle" style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>Active draft generation & auto posting status</span>
              </div>
              <Link href="/marketing" style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: '600', textDecoration: 'none' }}>
                Go to Content OS →
              </Link>
            </div>
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Reach This Month</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--blue)', marginTop: '4px' }}>{totalMarketingReach}</div>
              </div>
              <div style={{ background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Avg Engagement</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--purple)', marginTop: '4px' }}>{averageEngagement}</div>
              </div>
              <div style={{ background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Posts Published</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--green)', marginTop: '4px' }}>{postsPublishedThisMonth}</div>
              </div>
            </div>
            <div style={{ background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '12px', fontSize: '13px' }}>
              <div style={{ fontWeight: '700', marginBottom: '6px', color: 'var(--label-primary)' }}>Next Pending UGC Script for Review:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--label-secondary)' }}>"Rosewater Mist Refresh Routine" (TikTok Draft)</span>
                <span className="badge badge-orange" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--orange)', color: 'white' }}>IN REVIEW</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Hand: Actionable warnings & logs */}
        <div className="dashboard-right" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Low Stock Warners */}
          <div className="liquid-card" style={{ padding: '20px' }}>
            <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="card-title-group">
                <h3 className="card-title" style={{ fontSize: '14px', fontWeight: '700' }}>Module 1: Critical Restocks</h3>
                <span className="card-subtitle" style={{ fontSize: '11px', color: 'var(--label-secondary)' }}>Low stock alerts & demand forecasting</span>
              </div>
              <Link href="/inventory" style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: '600', textDecoration: 'none' }}>
                Forecast Engine
              </Link>
            </div>
            <div className="stock-alerts-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lowStockProducts.map(p => {
                const totalStock = p.warehouse + p.amazon + p.blinkit + p.myntra + p.flipkart + p.instamart + p.nykaa + p.shopify;
                const daysRemaining = p.avgMonthlySales > 0 ? Math.round((totalStock / p.avgMonthlySales) * 30) : 0;
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: `3px solid ${daysRemaining <= 5 ? 'var(--red)' : 'var(--orange)'}` }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>SKU: {p.sku} • Stock: {totalStock}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: daysRemaining <= 5 ? 'var(--red)' : 'var(--orange)' }}>{daysRemaining} Days Left</div>
                      <div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Rec PO: {p.avgMonthlySales * 3} units</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module 2: CSAT Review Engine Intercepts */}
          <div className="liquid-card" style={{ padding: '20px' }}>
            <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="card-title-group">
                <h3 className="card-title" style={{ fontSize: '14px', fontWeight: '700' }}>Module 2: Customer Care Review</h3>
                <span className="card-subtitle" style={{ fontSize: '11px', color: 'var(--label-secondary)' }}>Feedback intercept & review push</span>
              </div>
              <Link href="/customer-care" style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: '600', textDecoration: 'none' }}>
                Care Center
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--separator)' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--green)' }}>{avgCsat}/5</div>
                  <div style={{ fontSize: '10px', color: 'var(--label-tertiary)' }}>CSAT</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid var(--separator)', borderRight: '1px solid var(--separator)' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--blue)' }}>{reviews.length}</div>
                  <div style={{ fontSize: '10px', color: 'var(--label-tertiary)' }}>Reviews Gen</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--orange)' }}>{negativeReviewsIntercepted}</div>
                  <div style={{ fontSize: '10px', color: 'var(--label-tertiary)' }}>Neg Intercept</div>
                </div>
              </div>
              
              <div style={{ fontSize: '11px', color: 'var(--label-secondary)', fontWeight: '600' }}>Recent Low Review Alert Intercepted:</div>
              <div style={{ background: 'rgba(255, 59, 48, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 59, 48, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '700', fontSize: '11px' }}>Amit K. (2 Stars) - Amazon</span>
                  <span style={{ fontSize: '10px', color: 'var(--red)', fontWeight: '600' }}>TICKET CREATED</span>
                </div>
                <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--label-secondary)' }}>
                  "Product itself is fine but the Rosewater bottle arrived leaking..."
                </p>
              </div>
            </div>
          </div>

          {/* Module 4: Salon Lead Generator pipeline */}
          <div className="liquid-card" style={{ padding: '20px' }}>
            <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="card-title-group">
                <h3 className="card-title" style={{ fontSize: '14px', fontWeight: '700' }}>Module 4: Salon B2B Pipeline</h3>
                <span className="card-subtitle" style={{ fontSize: '11px', color: 'var(--label-secondary)' }}>Maps scraper lead list generation</span>
              </div>
              <Link href="/salon-sales" style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: '600', textDecoration: 'none' }}>
                Sales CRM
              </Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--label-secondary)' }}>Samples Sent:</span>
                <span style={{ fontWeight: '700', color: 'var(--orange)' }}>{samplesSentCount} Salons</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--label-secondary)' }}>Deals Won this Month:</span>
                <span style={{ fontWeight: '700', color: 'var(--green)' }}>₹1.2L (Divine Touch)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--label-secondary)' }}>Google Maps Leads Generated:</span>
                <span style={{ fontWeight: '700', color: 'var(--blue)' }}>342 leads</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
