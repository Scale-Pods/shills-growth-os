'use client';

import React, { useState } from 'react';
import { useAppContext } from '../ClientWrapper';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Send,
  Plus,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingDown,
  Clock,
  CheckCircle,
  Smartphone
} from 'lucide-react';

export default function InventoryPage() {
  const {
    inventory,
    setInventory,
    whatsappAlerts,
    setWhatsappAlerts,
    showToast
  } = useAppContext();

  // State local to page
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chinaLeadTime, setChinaLeadTime] = useState(30); // Lead time in days
  const [poQtyInput, setPoQtyInput] = useState<Record<string, string>>({});

  // Trigger simulated WhatsApp Alert
  const triggerTestAlert = (alertType: string) => {
    let msg = '';
    if (alertType === 'low') {
      msg = '⚠️ Low Stock Alert: Rosewater Mist is at 37 units (2 days left). Pls reorder.';
    } else if (alertType === 'dead') {
      msg = '📦 Dead Stock Alert: Matte Peach Lipstick has had zero sales in Myntra for 30 days.';
    } else if (alertType === 'over') {
      msg = '📈 Overstock Alert: Hydrating Lavender Gel in Main Warehouse exceeds 90 days run-rate.';
    } else {
      msg = '🚀 Fast-Moving SKU Alert: Nail Gel Set #12 sales increased by 45% today!';
    }
    
    showToast(`WhatsApp ping sent to +91 99*** ***01: "${msg}"`, 'success');
  };

  // Submit PO Restock Action
  const handlePurchaseOrder = (sku: string, suggestedQty: number) => {
    const qtyInput = poQtyInput[sku];
    const qty = qtyInput ? parseInt(qtyInput) : suggestedQty;
    if (qty <= 0) return;

    setInventory(prev => prev.map(p => {
      if (p.sku === sku) {
        const newWarehouse = p.warehouse + qty;
        showToast(`Purchase order PO-CHN-${sku} for ${qty} units sent to China supplier. Stock updated!`, 'success');
        return {
          ...p,
          warehouse: newWarehouse
        };
      }
      return p;
    }));
  };

  const handleQtyChange = (sku: string, val: string) => {
    setPoQtyInput(prev => ({
      ...prev,
      [sku]: val
    }));
  };

  // Calculate totals
  const totalItems = inventory.reduce((acc, curr) => {
    const sum = curr.warehouse + curr.amazon + curr.blinkit + curr.myntra + curr.flipkart + curr.instamart + curr.nykaa + curr.shopify;
    return acc + sum;
  }, 0);

  const totalValue = inventory.reduce((acc, curr) => {
    const sum = curr.warehouse + curr.amazon + curr.blinkit + curr.myntra + curr.flipkart + curr.instamart + curr.nykaa + curr.shopify;
    return acc + (sum * curr.cost);
  }, 0);

  const deadStockItems = inventory.filter(p => {
    const total = p.warehouse + p.amazon + p.blinkit + p.myntra + p.flipkart + p.instamart + p.nykaa + p.shopify;
    return total > 0 && p.avgMonthlySales < 20;
  });

  const fastMovingItems = inventory.filter(p => p.avgMonthlySales > 200);

  // Filter list
  const filteredInventoryList = inventory.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const total = p.warehouse + p.amazon + p.blinkit + p.myntra + p.flipkart + p.instamart + p.nykaa + p.shopify;
    const daysRemaining = p.avgMonthlySales > 0 ? Math.round((total / p.avgMonthlySales) * 30) : 999;

    let matchesStatus = true;
    if (statusFilter === 'low') matchesStatus = daysRemaining <= 15;
    else if (statusFilter === 'out') matchesStatus = total === 0;
    else if (statusFilter === 'dead') matchesStatus = p.avgMonthlySales < 20;
    else if (statusFilter === 'healthy') matchesStatus = daysRemaining > 15 && p.avgMonthlySales >= 20;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      
      {/* Top Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Inventory Intelligence & Forecasting</h2>
            <span style={{ fontSize: '10px', background: 'rgba(0, 122, 255, 0.08)', color: 'var(--blue)', border: '1px solid rgba(0, 122, 255, 0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Powered by ScalePods</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>Track multi-channel stock levels and calculate reorder recommendations based on lead times.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => showToast('Pulled latest stock levels from Shopify, Nykaa, and Dark Store APIs.', 'success')}>
            <RefreshCw size={14} /> Force Live Sync
          </button>
        </div>
      </div>

      {/* Stats Summary cards */}
      <div className="metrics-grid mb-24">
        
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Aggregate Stock Count</span>
          <span className="value">{totalItems.toLocaleString('en-IN')} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Units</span></span>
          <span className="trend up"><CheckCircle size={12} /> Sync Active</span>
        </div>

        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--teal)' } as React.CSSProperties}>
          <span className="label">Total Capital Locked</span>
          <span className="value">₹{(totalValue / 100000).toFixed(2)}L</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><DollarSign size={12} /> Asset Valuation</span>
        </div>

        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Dead Stock Accumulation</span>
          <span className="value">{deadStockItems.length} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>SKUs</span></span>
          <span className="trend down" style={{ color: 'var(--red)' }}><TrendingDown size={12} /> Slow Turnover</span>
        </div>

        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Fast-Moving SKUs</span>
          <span className="value">{fastMovingItems.length} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>SKUs</span></span>
          <span className="trend up" style={{ color: 'var(--green)' }}><TrendingUp size={12} /> High Demand</span>
        </div>

      </div>

      {/* Adjust Lead Time Parameter Control */}
      <div className="liquid-card mb-24" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--blue)', padding: '10px', borderRadius: '10px', color: 'white' }}>
            <Sliders size={20} />
          </div>
          <div style={{ flexGrow: 1 }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--label-primary)' }}>Procurement & Logistic Settings</h4>
            <p style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>Configure global lead time to automatically shift safety stock alerts and reorder dates.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>China Transit Lead Time:</span>
            <input 
              type="range" 
              min="15" 
              max="60" 
              value={chinaLeadTime} 
              onChange={(e) => {
                setChinaLeadTime(parseInt(e.target.value));
                showToast(`Global lead time set to ${e.target.value} days. Recalculated forecast thresholds.`, 'info');
              }}
              style={{ accentColor: 'var(--blue)', width: '150px' }}
            />
            <span className="badge badge-blue" style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '6px' }}>
              {chinaLeadTime} Days
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Forecast Engine & Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Table & SKU List */}
        <div className="liquid-card" style={{ padding: '24px' }}>
          <div className="table-header-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Channel Inventory & Forecast Engine</h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Search SKU or Product..." 
                className="input" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px', width: '180px' }}
              />
              <select 
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px', fontSize: '13px' }}
              >
                <option value="all">All Status</option>
                <option value="low">Stockout Risk (&le; 15 days)</option>
                <option value="out">Out of stock</option>
                <option value="dead">Dead Stock (&lt; 20 sales/mo)</option>
                <option value="healthy">Healthy Stock</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                  <th style={{ padding: '12px 8px' }}>SKU & Description</th>
                  <th style={{ padding: '12px 8px' }}>Total Stock</th>
                  <th style={{ padding: '12px 8px' }}>Monthly Sales</th>
                  <th style={{ padding: '12px 8px' }}>Stockout Risk</th>
                  <th style={{ padding: '12px 8px' }}>Suggested Order Date</th>
                  <th style={{ padding: '12px 8px' }}>Recommended Reorder</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>PO Trigger</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventoryList.map(p => {
                  const totalStock = p.warehouse + p.amazon + p.blinkit + p.myntra + p.flipkart + p.instamart + p.nykaa + p.shopify;
                  const daysRemaining = p.avgMonthlySales > 0 ? Math.round((totalStock / p.avgMonthlySales) * 30) : 999;
                  
                  // Days until we MUST place the order to avoid stockout
                  const daysUntilOrder = daysRemaining - chinaLeadTime;
                  let suggestedDateText = '';
                  let statusBadge = '';
                  
                  if (daysRemaining === 0) {
                    suggestedDateText = 'CRITICAL OVERDUE';
                    statusBadge = 'badge-red';
                  } else if (daysUntilOrder <= 0) {
                    suggestedDateText = 'ORDER IMMEDIATELY';
                    statusBadge = 'badge-red';
                  } else if (daysUntilOrder <= 7) {
                    suggestedDateText = `In ${daysUntilOrder} Days`;
                    statusBadge = 'badge-orange';
                  } else {
                    suggestedDateText = `In ${daysUntilOrder} Days`;
                    statusBadge = 'badge-green';
                  }

                  // suggested order qty (3 months of inventory)
                  const suggestedOrderQty = p.avgMonthlySales * 3;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--separator)', verticalAlign: 'middle' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontWeight: '700', display: 'block' }}>{p.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>SKU: {p.sku} • Cost: ₹{p.cost}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '600' }}>
                        {totalStock}
                        <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 'normal' }}>
                          WH:{p.warehouse} | AMZ:{p.amazon} | Q-COM:{p.blinkit + p.instamart}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{p.avgMonthlySales} /mo</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${daysRemaining <= 15 ? 'badge-red' : daysRemaining <= 30 ? 'badge-orange' : 'badge-green'}`}>
                          {daysRemaining === 0 ? 'Stockout' : `${daysRemaining} Days`}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${statusBadge}`} style={{ fontSize: '11px' }}>
                          {suggestedDateText}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '700' }}>
                        {suggestedOrderQty} units
                        <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 'normal' }}>
                          Est Val: ₹{((suggestedOrderQty * p.cost) / 100000).toFixed(1)}L
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <input 
                            type="number" 
                            className="input" 
                            placeholder={String(suggestedOrderQty)}
                            value={poQtyInput[p.sku] || ''}
                            onChange={(e) => handleQtyChange(p.sku, e.target.value)}
                            style={{ width: '60px', padding: '4px', fontSize: '12px', textAlign: 'center' }}
                          />
                          <button 
                            className="btn-primary" 
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => handlePurchaseOrder(p.sku, suggestedOrderQty)}
                          >
                            Send PO
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* WhatsApp Alerts Simulator */}
          <div className="liquid-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={16} style={{ color: 'var(--green)' }} /> WhatsApp Alert Hub
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--label-secondary)', marginBottom: '16px' }}>
              Simulate and test real-time alerts dispatched to the founders and operations teams when inventory anomalies occur.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => triggerTestAlert('low')}>
                <span>Low Stock Warning</span>
                <span className="badge badge-red" style={{ fontSize: '10px' }}>TEST</span>
              </button>
              
              <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => triggerTestAlert('dead')}>
                <span>Dead Stock Notice</span>
                <span className="badge badge-orange" style={{ fontSize: '10px' }}>TEST</span>
              </button>

              <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => triggerTestAlert('over')}>
                <span>Overstock Alert</span>
                <span className="badge badge-blue" style={{ fontSize: '10px' }}>TEST</span>
              </button>

              <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => triggerTestAlert('fast')}>
                <span>Fast-Moving SKU Spike</span>
                <span className="badge badge-green" style={{ fontSize: '10px' }}>TEST</span>
              </button>
            </div>
          </div>

          {/* Connected Inventory Warehouses */}
          <div className="liquid-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Inventory Sources</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--separator)' }}>
                <span style={{ color: 'var(--label-secondary)' }}>Delhi Central Warehouse</span>
                <span style={{ fontWeight: '700' }}>Active (WH)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--separator)' }}>
                <span style={{ color: 'var(--label-secondary)' }}>Amazon FBA Hub (Gurgaon)</span>
                <span style={{ fontWeight: '700' }}>Connected</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--separator)' }}>
                <span style={{ color: 'var(--label-secondary)' }}>Blinkit Dark Stores (120 pods)</span>
                <span style={{ fontWeight: '700' }}>Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--separator)' }}>
                <span style={{ color: 'var(--label-secondary)' }}>Swiggy Instamart (90 pods)</span>
                <span style={{ fontWeight: '700' }}>Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--label-secondary)' }}>Shopify Storefront Sync</span>
                <span style={{ fontWeight: '700', color: 'var(--green)' }}>Live</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
