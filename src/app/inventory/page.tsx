'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../ClientWrapper';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingDown,
  CheckCircle,
  Smartphone,
  BarChart2,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Layers,
  Tag,
  Search,
  Zap,
  Archive,
  X
} from 'lucide-react';

// ─── Utility ──────────────────────────────────────────────────────────────────

function calcTotalStock(p: any) {
  return p.warehouse + p.amazon + p.blinkit + p.myntra + p.flipkart + p.instamart + p.nykaa + p.shopify;
}

function calcDaysRemaining(p: any) {
  const total = calcTotalStock(p);
  return p.avgMonthlySales > 0 ? Math.round((total / p.avgMonthlySales) * 30) : 999;
}

function getABCClass(p: any) {
  const revenue = p.avgMonthlySales * p.price;
  if (revenue >= 150000) return 'A';
  if (revenue >= 50000) return 'B';
  return 'C';
}

function getStockStatus(days: number, total: number) {
  if (total === 0) return { label: 'Out of Stock', badge: 'badge-red' };
  if (days <= 10) return { label: 'Critical', badge: 'badge-red' };
  if (days <= 25) return { label: 'Low Stock', badge: 'badge-orange' };
  if (days > 90) return { label: 'Overstock', badge: 'badge-blue' };
  return { label: 'Healthy', badge: 'badge-green' };
}

const CATEGORY_MAP: Record<string, string> = {
  'SH-NGEL': 'Nail Care',
  'SH-VITC': 'Skincare',
  'SH-PEACH': 'Lip & Color',
  'SH-ROSE': 'Skincare',
  'SH-LAV': 'Body Care',
  'SH-BROW': 'Eye & Brow',
  'SH-FOUN': 'Face',
  'SH-BLUSH': 'Face',
  'SH-MASK': 'Skincare',
  'SH-SCRUB': 'Body Care',
};

function getCategory(sku: string) {
  const prefix = Object.keys(CATEGORY_MAP).find(k => sku.startsWith(k));
  return prefix ? CATEGORY_MAP[prefix] : 'Other';
}

// ─── Extended Mock Data for 300-product scale demo ───────────────────────────

const EXTRA_PRODUCTS = [
  { id: 'inv-6', name: 'Matte Brown Eyebrow Pencil', sku: 'SH-BROW-01', warehouse: 320, amazon: 90, blinkit: 30, myntra: 45, flipkart: 40, instamart: 15, nykaa: 55, shopify: 70, avgMonthlySales: 190, cost: 65, price: 349, leadTime: 30 },
  { id: 'inv-7', name: 'Dewy Finish Foundation SPF30', sku: 'SH-FOUN-30', warehouse: 60, amazon: 110, blinkit: 18, myntra: 95, flipkart: 35, instamart: 8, nykaa: 70, shopify: 40, avgMonthlySales: 420, cost: 210, price: 1099, leadTime: 45 },
  { id: 'inv-8', name: 'Rose Gold Blush Compact', sku: 'SH-BLUSH-RG', warehouse: 5, amazon: 12, blinkit: 2, myntra: 0, flipkart: 8, instamart: 0, nykaa: 3, shopify: 7, avgMonthlySales: 280, cost: 130, price: 749, leadTime: 45 },
  { id: 'inv-9', name: 'Charcoal Deep Cleanse Mask 75ml', sku: 'SH-MASK-CC', warehouse: 680, amazon: 200, blinkit: 55, myntra: 120, flipkart: 90, instamart: 40, nykaa: 150, shopify: 110, avgMonthlySales: 95, cost: 88, price: 499, leadTime: 30 },
  { id: 'inv-10', name: 'Coffee Body Scrub 200g', sku: 'SH-SCRUB-CB', warehouse: 480, amazon: 130, blinkit: 40, myntra: 80, flipkart: 55, instamart: 20, nykaa: 90, shopify: 85, avgMonthlySales: 145, cost: 95, price: 599, leadTime: 30 },
];

const ALL_CHANNELS = ['warehouse', 'amazon', 'blinkit', 'myntra', 'flipkart', 'instamart', 'nykaa', 'shopify'];
const CHANNEL_LABELS: Record<string, string> = { warehouse: 'Warehouse', amazon: 'Amazon', blinkit: 'Blinkit', myntra: 'Myntra', flipkart: 'Flipkart', instamart: 'Instamart', nykaa: 'Nykaa', shopify: 'Shopify' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { inventory: baseInventory, setInventory: setBaseInventory, showToast } = useAppContext();

  // Merge extra demo products for richer view
  const [localExtra] = useState(EXTRA_PRODUCTS);
  const inventory = useMemo(() => [...baseInventory, ...localExtra], [baseInventory, localExtra]);

  // ── Page State ──────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [abcFilter, setAbcFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'stock' | 'sales' | 'days' | 'value'>('days');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [chinaLeadTime, setChinaLeadTime] = useState(30);
  const [poQtyInput, setPoQtyInput] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'table' | 'abc' | 'channels' | 'bundles'>('table');
  const [reallocationModal, setReallocationModal] = useState<null | typeof inventory[0]>(null);
  const [reallocationFrom, setReallocationFrom] = useState('warehouse');
  const [reallocationTo, setReallocationTo] = useState('blinkit');
  const [reallocationQty, setReallocationQty] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // ── Derived Stats ───────────────────────────────────────────────────────────
  const totalItems = useMemo(() => inventory.reduce((a, p) => a + calcTotalStock(p), 0), [inventory]);
  const totalValue = useMemo(() => inventory.reduce((a, p) => a + calcTotalStock(p) * p.cost, 0), [inventory]);
  const criticalItems = useMemo(() => inventory.filter(p => calcDaysRemaining(p) <= 10 && calcTotalStock(p) > 0), [inventory]);
  const deadStockItems = useMemo(() => inventory.filter(p => calcTotalStock(p) > 0 && p.avgMonthlySales < 20), [inventory]);
  const overstockItems = useMemo(() => inventory.filter(p => calcDaysRemaining(p) > 90), [inventory]);
  const fastMovingItems = useMemo(() => inventory.filter(p => p.avgMonthlySales > 200), [inventory]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(inventory.map(p => getCategory(p.sku))))], [inventory]);

  // ── Filtered & Sorted List ──────────────────────────────────────────────────
  const filteredList = useMemo(() => {
    let list = inventory.filter(p => {
      const total = calcTotalStock(p);
      const days = calcDaysRemaining(p);
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'all' || getCategory(p.sku) === categoryFilter;
      const matchAbc = abcFilter === 'all' || getABCClass(p) === abcFilter;
      let matchStatus = true;
      if (statusFilter === 'critical') matchStatus = days <= 10 && total > 0;
      else if (statusFilter === 'low') matchStatus = days > 10 && days <= 25;
      else if (statusFilter === 'out') matchStatus = total === 0;
      else if (statusFilter === 'dead') matchStatus = p.avgMonthlySales < 20 && total > 0;
      else if (statusFilter === 'over') matchStatus = days > 90;
      else if (statusFilter === 'healthy') matchStatus = days > 25 && days <= 90 && p.avgMonthlySales >= 20;
      return matchSearch && matchCat && matchAbc && matchStatus;
    });

    list = [...list].sort((a, b) => {
      let va: number, vb: number;
      if (sortField === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (sortField === 'stock') { va = calcTotalStock(a); vb = calcTotalStock(b); }
      else if (sortField === 'sales') { va = a.avgMonthlySales; vb = b.avgMonthlySales; }
      else if (sortField === 'days') { va = calcDaysRemaining(a); vb = calcDaysRemaining(b); }
      else { va = calcTotalStock(a) * a.cost; vb = calcTotalStock(b) * b.cost; }
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    return list;
  }, [inventory, searchTerm, statusFilter, categoryFilter, abcFilter, sortField, sortDir]);

  // ── ABC Analysis ────────────────────────────────────────────────────────────
  const abcGroups = useMemo(() => {
    const A = inventory.filter(p => getABCClass(p) === 'A');
    const B = inventory.filter(p => getABCClass(p) === 'B');
    const C = inventory.filter(p => getABCClass(p) === 'C');
    const totalRev = inventory.reduce((s, p) => s + p.avgMonthlySales * p.price, 0);
    return { A, B, C, totalRev };
  }, [inventory]);

  // ── Channel Distribution ─────────────────────────────────────────────────────
  const channelTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    ALL_CHANNELS.forEach(ch => {
      totals[ch] = inventory.reduce((s, p) => s + (p as any)[ch], 0);
    });
    return totals;
  }, [inventory]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handlePurchaseOrder = (sku: string, suggestedQty: number) => {
    const qty = parseInt(poQtyInput[sku] || String(suggestedQty));
    if (!qty || qty <= 0) return;
    setBaseInventory(prev => prev.map(p => {
      if (p.sku === sku) {
        showToast(`PO-CHN-${sku} for ${qty} units submitted to supplier. ETA ${chinaLeadTime} days.`, 'success');
        return { ...p, warehouse: p.warehouse + qty };
      }
      return p;
    }));
  };

  const handleReallocation = () => {
    const qty = parseInt(reallocationQty);
    if (!reallocationModal || !qty || qty <= 0) return;
    const p = reallocationModal;
    const fromStock = (p as any)[reallocationFrom];
    if (qty > fromStock) { showToast('Insufficient stock in source channel.', 'error'); return; }
    setBaseInventory(prev => prev.map(prod => {
      if (prod.sku === p.sku) {
        return { ...prod, [reallocationFrom]: (prod as any)[reallocationFrom] - qty, [reallocationTo]: (prod as any)[reallocationTo] + qty };
      }
      return prod;
    }));
    showToast(`${qty} units of ${p.name} reallocated from ${CHANNEL_LABELS[reallocationFrom]} → ${CHANNEL_LABELS[reallocationTo]}.`, 'success');
    setReallocationModal(null);
    setReallocationQty('');
  };

  const triggerAlert = (type: string) => {
    const msgs: Record<string, string> = {
      low: '⚠️ Critical Stock: Rosewater Mist (8 units, 0.7 days). Order immediately.',
      dead: '📦 Dead Stock: Charcoal Mask has 244 days runway. Recommend bundle promo.',
      over: '📈 Overstock: Lavender Gel exceeds 90-day runway. Consider reallocation to Blinkit.',
      fast: '🚀 Fast Mover: Vitamin C Serum +38% WoW. Raise reorder threshold.'
    };
    showToast(`WhatsApp → Founder: ${msgs[type]}`, 'success');
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Inventory Intelligence Centre</h2>
            <span style={{ fontSize: '10px', background: 'rgba(0,122,255,0.08)', color: 'var(--blue)', border: '1px solid rgba(0,122,255,0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>300 SKU Scale</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Multi-channel stock intelligence • ABC classification • Channel reallocation • Smart PO engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => showToast('Pulled latest stock from Shopify, Nykaa, Blinkit & Amazon APIs.', 'success')}>
            <RefreshCw size={14} /> Force Sync
          </button>
          <button className="btn-secondary" onClick={() => showToast('Exporting full inventory sheet to Excel...', 'info')}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Total Stock Units</span>
          <span className="value">{totalItems.toLocaleString('en-IN')}</span>
          <span className="trend up"><CheckCircle size={12} /> {inventory.length} Active SKUs</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--teal)' } as React.CSSProperties}>
          <span className="label">Capital Locked (Cost)</span>
          <span className="value">₹{(totalValue / 100000).toFixed(2)}L</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><DollarSign size={12} /> Inventory Valuation</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Critical / Out of Stock</span>
          <span className="value">{criticalItems.length} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>SKUs</span></span>
          <span className="trend down" style={{ color: 'var(--red)' }}><AlertTriangle size={12} /> Needs Immediate PO</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Overstock Risk</span>
          <span className="value">{overstockItems.length} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>SKUs</span></span>
          <span className="trend down" style={{ color: 'var(--orange)' }}><Archive size={12} /> Capital Trapped</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Fast-Moving SKUs</span>
          <span className="value">{fastMovingItems.length}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><TrendingUp size={12} /> &gt;200 units/mo</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Dead Stock SKUs</span>
          <span className="value">{deadStockItems.length}</span>
          <span className="trend down" style={{ color: 'var(--label-tertiary)' }}><TrendingDown size={12} /> &lt;20 units/mo</span>
        </div>
      </div>

      {/* Lead Time + Alert Controls */}
      <div className="liquid-card mb-24" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--blue)', padding: '10px', borderRadius: '10px', color: 'white' }}><Sliders size={20} /></div>
          <div style={{ flexGrow: 1 }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Procurement Controls</h4>
            <p style={{ fontSize: '12px', color: 'var(--label-secondary)', margin: '2px 0 0' }}>Adjust lead time to recalculate all reorder windows across the full 300-SKU catalogue.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>China Transit:</span>
            <input type="range" min="15" max="60" value={chinaLeadTime} onChange={e => { setChinaLeadTime(+e.target.value); showToast(`Lead time set to ${e.target.value} days. All forecasts updated.`, 'info'); }} style={{ accentColor: 'var(--blue)', width: '150px' }} />
            <span className="badge badge-blue" style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '6px' }}>{chinaLeadTime} Days</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[['low', 'Low Stock'], ['dead', 'Dead Stock'], ['over', 'Overstock'], ['fast', 'Fast Mover']].map(([k, label]) => (
              <button key={k} className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => triggerAlert(k)}>
                <Smartphone size={12} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--fill-tertiary)', padding: '3px', borderRadius: '10px', width: 'fit-content' }}>
        {[['table', 'SKU Table', Package], ['abc', 'ABC Analysis', BarChart2], ['channels', 'Channel View', ArrowRightLeft], ['bundles', 'Bundle Kits', Layers]].map(([key, label, Icon]: any) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: '700', background: activeTab === key ? 'var(--bg-layer1)' : 'transparent', color: activeTab === key ? 'var(--blue)' : 'var(--label-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ── TAB: SKU TABLE ──────────────────────────────────────────────────────── */}
      {activeTab === 'table' && (
        <div className="inv-sku-layout" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
          <div className="liquid-card" style={{ padding: '20px' }}>
            {/* Filters Row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flexGrow: 1, minWidth: '160px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
                <input type="text" placeholder="Search SKU or name..." className="input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '30px', fontSize: '12px', width: '100%' }} />
              </div>
              <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: '12px', padding: '7px 8px' }}>
                <option value="all">All Status</option>
                <option value="critical">Critical (&le;10 days)</option>
                <option value="low">Low Stock (11-25 days)</option>
                <option value="out">Out of Stock</option>
                <option value="dead">Dead Stock</option>
                <option value="over">Overstock (&gt;90 days)</option>
                <option value="healthy">Healthy</option>
              </select>
              <select className="input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ fontSize: '12px', padding: '7px 8px' }}>
                {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
              </select>
              <select className="input" value={abcFilter} onChange={e => setAbcFilter(e.target.value)} style={{ fontSize: '12px', padding: '7px 8px' }}>
                <option value="all">All ABC</option>
                <option value="A">A Class (High Value)</option>
                <option value="B">B Class (Mid Value)</option>
                <option value="C">C Class (Low Value)</option>
              </select>
              <span style={{ fontSize: '12px', color: 'var(--label-secondary)', whiteSpace: 'nowrap' }}>{filteredList.length} SKUs</span>
            </div>

            <div className="tbl-scroll" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--separator)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('name')}>SKU & Product <SortIcon field="name" /></th>
                    <th style={{ padding: '10px 8px' }}>Cat / ABC</th>
                    <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => handleSort('stock')}>Total Stock <SortIcon field="stock" /></th>
                    <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => handleSort('sales')}>Avg/Mo <SortIcon field="sales" /></th>
                    <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => handleSort('days')}>Days Left <SortIcon field="days" /></th>
                    <th style={{ padding: '10px 8px' }}>Order Window</th>
                    <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => handleSort('value')}>Stock Value <SortIcon field="value" /></th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map(p => {
                    const total = calcTotalStock(p);
                    const days = calcDaysRemaining(p);
                    const status = getStockStatus(days, total);
                    const abc = getABCClass(p);
                    const daysUntilOrder = days - chinaLeadTime;
                    const suggestedQty = Math.max(p.avgMonthlySales * 3, 1);
                    const stockVal = total * p.cost;
                    const isExpanded = expandedRow === p.id;

                    return (
                      <React.Fragment key={p.id}>
                        <tr
                          style={{ borderBottom: '1px solid var(--separator)', cursor: 'pointer', background: isExpanded ? 'var(--fill-quaternary)' : 'transparent' }}
                          onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                        >
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ fontWeight: '700', display: 'block' }}>{p.name}</span>
                            <span style={{ fontSize: '10px', color: 'var(--label-tertiary)' }}>SKU: {p.sku} · ₹{p.cost} cost · ₹{p.price} MRP</span>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ fontSize: '10px', display: 'block', color: 'var(--label-secondary)' }}>{getCategory(p.sku)}</span>
                            <span className={`badge badge-${abc === 'A' ? 'green' : abc === 'B' ? 'orange' : 'grey'}`} style={{ fontSize: '9px', marginTop: '2px' }}>Class {abc}</span>
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: '700' }}>
                            {total.toLocaleString('en-IN')}
                            <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 'normal' }}>WH:{p.warehouse} | AMZ:{p.amazon}</div>
                          </td>
                          <td style={{ padding: '10px 8px' }}>{p.avgMonthlySales}/mo</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span className={`badge ${status.badge}`}>{days >= 999 ? '∞' : days === 0 ? 'Stockout' : `${days}d`}</span>
                            <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', marginTop: '2px' }}>{status.label}</div>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span className={`badge ${daysUntilOrder <= 0 ? 'badge-red' : daysUntilOrder <= 7 ? 'badge-orange' : 'badge-green'}`} style={{ fontSize: '10px' }}>
                              {daysUntilOrder <= 0 ? 'ORDER NOW' : `In ${daysUntilOrder}d`}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: '600' }}>
                            ₹{(stockVal / 1000).toFixed(1)}K
                            <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 'normal' }}>GM: {Math.round(((p.price - p.cost) / p.price) * 100)}%</div>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button className="btn-secondary" style={{ padding: '3px 7px', fontSize: '10px' }} onClick={e => { e.stopPropagation(); setReallocationModal(p); }}>
                                <ArrowRightLeft size={11} /> Move
                              </button>
                              <div style={{ display: 'flex', gap: '3px' }} onClick={e => e.stopPropagation()}>
                                <input type="number" className="input" placeholder={String(suggestedQty)} value={poQtyInput[p.sku] || ''} onChange={e => setPoQtyInput(prev => ({ ...prev, [p.sku]: e.target.value }))} style={{ width: '55px', padding: '3px', fontSize: '11px', textAlign: 'center' }} />
                                <button className="btn-primary" style={{ padding: '3px 7px', fontSize: '10px' }} onClick={() => handlePurchaseOrder(p.sku, suggestedQty)}>PO</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} style={{ padding: '0 8px 12px', background: 'var(--fill-quaternary)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', padding: '12px 0', fontSize: '11px' }}>
                                {ALL_CHANNELS.map(ch => (
                                  <div key={ch} style={{ background: 'var(--bg-layer1)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--label-tertiary)', marginBottom: '4px' }}>{CHANNEL_LABELS[ch]}</div>
                                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{(p as any)[ch]}</div>
                                    <div style={{ fontSize: '9px', color: 'var(--label-tertiary)', marginTop: '2px' }}>
                                      {total > 0 ? `${Math.round(((p as any)[ch] / total) * 100)}%` : '—'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--label-secondary)', flexWrap: 'wrap', paddingTop: '4px' }}>
                                <span>Reorder Qty Suggested: <strong>{Math.max(p.avgMonthlySales * 3, 1)} units (3mo supply)</strong></span>
                                <span>Reorder Cost: <strong>₹{((Math.max(p.avgMonthlySales * 3, 1) * p.cost) / 100000).toFixed(2)}L</strong></span>
                                <span>Monthly Revenue Potential: <strong>₹{((p.avgMonthlySales * p.price) / 1000).toFixed(1)}K</strong></span>
                                <span>Lead Time: <strong>{chinaLeadTime} days</strong></span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '240px' }}>
            <div className="liquid-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} style={{ color: 'var(--red)' }} /> Critical SKUs
              </h4>
              {criticalItems.length === 0 ? <p style={{ fontSize: '12px', color: 'var(--label-tertiary)' }}>All clear.</p> : criticalItems.map(p => (
                <div key={p.id} style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,59,48,0.06)', borderRadius: '8px', borderLeft: '3px solid var(--red)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700' }}>{p.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--label-tertiary)' }}>{calcDaysRemaining(p)}d left · {calcTotalStock(p)} units</div>
                </div>
              ))}
            </div>

            <div className="liquid-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} style={{ color: 'var(--orange)' }} /> WhatsApp Alerts
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--label-secondary)', marginBottom: '10px' }}>Simulate alerts to founder's WhatsApp.</p>
              {[['low', 'Low Stock', 'badge-red'], ['dead', 'Dead Stock', 'badge-orange'], ['over', 'Overstock', 'badge-blue'], ['fast', 'Fast Mover', 'badge-green']].map(([k, label, badge]) => (
                <button key={k} className="btn-secondary" style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }} onClick={() => triggerAlert(k)}>
                  <span>{label}</span>
                  <span className={`badge ${badge}`} style={{ fontSize: '9px' }}>TEST</span>
                </button>
              ))}
            </div>

            <div className="liquid-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>Connected Channels</h4>
              {[['Delhi Warehouse (WH)', 'Active'], ['Amazon FBA (AMZ)', 'Connected'], ['Blinkit Dark Stores', 'Active (120 pods)'], ['Swiggy Instamart', 'Active (90 pods)'], ['Myntra FC', 'Synced'], ['Nykaa Warehouse', 'Synced'], ['Shopify Storefront', 'Live']].map(([name, status]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', paddingBottom: '5px', marginBottom: '5px', borderBottom: '1px solid var(--separator)' }}>
                  <span style={{ color: 'var(--label-secondary)' }}>{name}</span>
                  <span style={{ fontWeight: '600', color: status === 'Live' ? 'var(--green)' : 'var(--label-primary)' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ABC ANALYSIS ───────────────────────────────────────────────────── */}
      {activeTab === 'abc' && (
        <div className="abc-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {(['A', 'B', 'C'] as const).map(cls => {
            const group = abcGroups[cls];
            const groupRev = group.reduce((s: number, p: any) => s + p.avgMonthlySales * p.price, 0);
            const pct = abcGroups.totalRev > 0 ? ((groupRev / abcGroups.totalRev) * 100).toFixed(1) : '0';
            const colors: Record<string, string> = { A: 'var(--green)', B: 'var(--orange)', C: 'var(--label-tertiary)' };
            const descs: Record<string, string> = {
              A: 'High-value SKUs driving ~70% of revenue. Prioritize stock availability and daily monitoring.',
              B: 'Mid-tier SKUs. Monitor weekly, maintain 45-day safety stock.',
              C: 'Low-value or slow-moving SKUs. Minimize overstock. Bundle or promo to liquidate.'
            };
            return (
              <div key={cls} className="liquid-card" style={{ padding: '20px', borderTop: `3px solid ${colors[cls]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: colors[cls] }}>Class {cls}</div>
                    <div style={{ fontSize: '12px', color: 'var(--label-secondary)', marginTop: '2px' }}>{group.length} SKUs · {pct}% of Revenue</div>
                  </div>
                  <span className={`badge badge-${cls === 'A' ? 'green' : cls === 'B' ? 'orange' : 'grey'}`} style={{ fontSize: '10px', padding: '4px 8px' }}>
                    ₹{(groupRev / 1000).toFixed(0)}K/mo
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--label-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>{descs[cls]}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                  {group.map((p: any) => {
                    const days = calcDaysRemaining(p);
                    return (
                      <div key={p.id} style={{ background: 'var(--fill-quaternary)', padding: '8px 10px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ fontWeight: '600' }}>{p.name}</span>
                          <span className={`badge ${getStockStatus(days, calcTotalStock(p)).badge}`} style={{ fontSize: '9px' }}>{days >= 999 ? '∞d' : `${days}d`}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--label-tertiary)', marginTop: '2px' }}>
                          {p.avgMonthlySales}/mo · ₹{((p.avgMonthlySales * p.price) / 1000).toFixed(0)}K rev · {calcTotalStock(p)} units
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: CHANNEL VIEW ───────────────────────────────────────────────────── */}
      {activeTab === 'channels' && (
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Multi-Channel Distribution Overview</h3>
          <p style={{ fontSize: '12px', color: 'var(--label-secondary)', marginBottom: '20px' }}>Total stock distribution across all 8 channels. Use the reallocation tool (Move button in SKU table) to shift stock.</p>
          <div className="channel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {ALL_CHANNELS.map(ch => {
              const pct = totalItems > 0 ? ((channelTotals[ch] / totalItems) * 100).toFixed(1) : '0';
              return (
                <div key={ch} style={{ background: 'var(--fill-quaternary)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>{CHANNEL_LABELS[ch]}</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--label-primary)' }}>{channelTotals[ch].toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '2px' }}>{pct}% of total</div>
                  <div style={{ marginTop: '8px', height: '4px', background: 'var(--fill-primary)', borderRadius: '2px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue)', borderRadius: '2px', transition: 'width 600ms ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--separator)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                  {ALL_CHANNELS.map(ch => <th key={ch} style={{ padding: '8px', textAlign: 'right' }}>{CHANNEL_LABELS[ch]}</th>)}
                  <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '8px', fontWeight: '600' }}>{p.name.substring(0, 28)}{p.name.length > 28 ? '...' : ''}</td>
                    {ALL_CHANNELS.map(ch => (
                      <td key={ch} style={{ padding: '8px', textAlign: 'right', color: (p as any)[ch] === 0 ? 'var(--label-tertiary)' : 'var(--label-primary)' }}>
                        {(p as any)[ch]}
                      </td>
                    ))}
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>{calcTotalStock(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: BUNDLE KITS ────────────────────────────────────────────────────── */}
      {activeTab === 'bundles' && (
        <div className="liquid-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Bundle Kit Liquidation Engine</h3>
              <p style={{ fontSize: '12px', color: 'var(--label-secondary)', marginTop: '4px' }}>Bundle dead/slow stock with fast-movers to clear inventory and drive AOV.</p>
            </div>
            <button className="btn-primary" style={{ fontSize: '12px' }} onClick={() => showToast('Bundle kit "Glow Starter Pack" created and listed on Shopify & Nykaa!', 'success')}>
              <Plus size={13} /> Create Bundle Kit
            </button>
          </div>
          <div className="bundle-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { name: 'Salon Pro Nail Kit', skus: ['Nail Gel Set #12', 'Matte Peach Lipstick'], mrp: 1499, bundle: 999, stock: 45, reason: 'Pairs fast-mover nail gel with slow lipstick to clear dead stock.' },
              { name: 'Glow & Go Skincare Set', skus: ['Vitamin C Serum 30ml', 'Rosewater Face Mist 100ml'], mrp: 1298, bundle: 849, stock: 62, reason: 'High-demand serum bundled with low-stock mist — accelerates mist turnover.' },
              { name: 'Daily Ritual Duo', skus: ['Lavender Gel 100g', 'Coffee Body Scrub 200g'], mrp: 1148, bundle: 749, stock: 80, reason: 'Overstock clearance bundle for slow-moving body care SKUs.' },
            ].map(b => (
              <div key={b.name} style={{ background: 'var(--fill-quaternary)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', margin: 0 }}>{b.name}</h4>
                  <span className="badge badge-green" style={{ fontSize: '9px' }}>Active</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--label-secondary)', marginBottom: '8px' }}>
                  {b.skus.map(s => <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}><Tag size={10} />{s}</div>)}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginBottom: '8px' }}>
                  <div><div style={{ color: 'var(--label-tertiary)' }}>MRP Sum</div><div style={{ fontWeight: '700' }}>₹{b.mrp}</div></div>
                  <div><div style={{ color: 'var(--label-tertiary)' }}>Bundle Price</div><div style={{ fontWeight: '700', color: 'var(--green)' }}>₹{b.bundle}</div></div>
                  <div><div style={{ color: 'var(--label-tertiary)' }}>Discount</div><div style={{ fontWeight: '700', color: 'var(--orange)' }}>{Math.round((1 - b.bundle / b.mrp) * 100)}%</div></div>
                  <div><div style={{ color: 'var(--label-tertiary)' }}>Available</div><div style={{ fontWeight: '700' }}>{b.stock} kits</div></div>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--label-tertiary)', margin: '0 0 10px', lineHeight: '1.4' }}>{b.reason}</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-primary" style={{ fontSize: '11px', padding: '4px 10px', flexGrow: 1 }} onClick={() => showToast(`Bundle "${b.name}" pushed live to Shopify!`, 'success')}>Push Live</button>
                  <button className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => showToast(`WhatsApp promo sent for "${b.name}"!`, 'success')}>WA Promo</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REALLOCATION MODAL ──────────────────────────────────────────────────── */}
      {reallocationModal && (
        <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={() => setReallocationModal(null)}>
          <div className="spotlight-panel" style={{ maxWidth: '440px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--separator)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={16} style={{ color: 'var(--blue)' }} />
                <span style={{ fontWeight: '700', fontSize: '14px' }}>Channel Reallocation</span>
              </div>
              <button className="btn-icon" onClick={() => setReallocationModal(null)}><X size={14} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--fill-quaternary)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                <span style={{ fontWeight: '700' }}>{reallocationModal.name}</span>
                <span style={{ color: 'var(--label-tertiary)', marginLeft: '8px' }}>{reallocationModal.sku}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>From Channel</label>
                  <select className="input" value={reallocationFrom} onChange={e => setReallocationFrom(e.target.value)} style={{ width: '100%', fontSize: '12px' }}>
                    {ALL_CHANNELS.map(ch => <option key={ch} value={ch}>{CHANNEL_LABELS[ch]} ({(reallocationModal as any)[ch]} units)</option>)}
                  </select>
                </div>
                <ArrowRightLeft size={16} style={{ color: 'var(--blue)', marginTop: '16px' }} />
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>To Channel</label>
                  <select className="input" value={reallocationTo} onChange={e => setReallocationTo(e.target.value)} style={{ width: '100%', fontSize: '12px' }}>
                    {ALL_CHANNELS.filter(ch => ch !== reallocationFrom).map(ch => <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '4px' }}>Quantity to Move</label>
                <input type="number" className="input" style={{ width: '100%', fontSize: '13px' }} placeholder={`Max: ${(reallocationModal as any)[reallocationFrom]}`} value={reallocationQty} onChange={e => setReallocationQty(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ flexGrow: 1 }} onClick={() => setReallocationModal(null)}>Cancel</button>
                <button className="btn-primary" style={{ flexGrow: 1 }} onClick={handleReallocation}>Confirm Transfer</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
