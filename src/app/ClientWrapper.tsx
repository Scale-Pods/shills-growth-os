'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Bot,
  DollarSign,
  Users,
  Sparkles,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Bell,
  CheckCircle,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  UserCheck,
  Activity
} from 'lucide-react';

// Interfaces for our state elements to ensure type safety
interface Invoice {
  invNo: string;
  amount: number;
  date: string;
}

interface Receivable {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  outstanding: number;
  overdueDays: number;
  lastReminder: string;
  stage: string;
  invoices: Invoice[];
}

interface Product {
  id: string;
  name: string;
  sku: string;
  warehouse: number;
  amazon: number;
  blinkit: number;
  myntra: number;
  flipkart: number;
  instamart: number;
  nykaa: number;
  shopify: number;
  avgMonthlySales: number;
  cost: number;
  price: number;
  leadTime: number;
}

interface SupportThread {
  sender: string;
  msg: string;
  time: string;
}

interface SupportCase {
  id: string;
  customer: string;
  channel: string;
  msg: string;
  status: string;
  escalation: string;
  time: string;
  thread: SupportThread[];
}

interface Review {
  id: string;
  customer: string;
  rating: number;
  platform: string;
  text: string;
  date: string;
  sentiment: string;
  reply: string | null;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  website: string;
  stage: string;
  notes: string;
}

interface ContentDraft {
  id: string;
  title: string;
  type: string;
  platform: string;
  product: string;
  status: string;
  scriptText: string;
}

interface WhatsappAlert {
  id: string;
  type: string;
  message: string;
  time: string;
  active: boolean;
}

interface Toast {
  id: number;
  message: string;
  type: string;
}

interface AppContextProps {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  toasts: Toast[];
  showToast: (message: string, type?: string) => void;
  spotlightOpen: boolean;
  setSpotlightOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inspectorOpen: boolean;
  setInspectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inspectorType: string;
  setInspectorType: React.Dispatch<React.SetStateAction<string>>;
  inspectorData: any;
  setInspectorData: React.Dispatch<React.SetStateAction<any>>;
  inventory: Product[];
  setInventory: React.Dispatch<React.SetStateAction<Product[]>>;
  supportCases: SupportCase[];
  setSupportCases: React.Dispatch<React.SetStateAction<SupportCase[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  receivables: Receivable[];
  setReceivables: React.Dispatch<React.SetStateAction<Receivable[]>>;
  salonLeads: Lead[];
  setSalonLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  contentDrafts: ContentDraft[];
  setContentDrafts: React.Dispatch<React.SetStateAction<ContentDraft[]>>;
  whatsappAlerts: WhatsappAlert[];
  setWhatsappAlerts: React.Dispatch<React.SetStateAction<WhatsappAlert[]>>;
}

// Create Global Context with default undefined state
const AppContext = createContext<AppContextProps | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Initial Mock Databases
const INITIAL_INVENTORY: Product[] = [
  { id: 'inv-1', name: 'Nail Gel Set #12 (Classic Nudes)', sku: 'SH-NGEL-12', warehouse: 250, amazon: 80, blinkit: 25, myntra: 15, flipkart: 30, instamart: 10, nykaa: 40, shopify: 50, avgMonthlySales: 180, cost: 350, price: 999, leadTime: 30 },
  { id: 'inv-2', name: 'Vitamin C Face Serum 30ml', sku: 'SH-VITC-30', warehouse: 850, amazon: 340, blinkit: 45, myntra: 110, flipkart: 80, instamart: 30, nykaa: 120, shopify: 150, avgMonthlySales: 620, cost: 162, price: 799, leadTime: 45 },
  { id: 'inv-3', name: 'Matte Peach Lipstick (Glow Edition)', sku: 'SH-PEACH-LP', warehouse: 12, amazon: 45, blinkit: 12, myntra: 0, flipkart: 25, instamart: 8, nykaa: 10, shopify: 30, avgMonthlySales: 240, cost: 98, price: 649, leadTime: 45 },
  { id: 'inv-4', name: 'Rosewater Face Mist 100ml', sku: 'SH-ROSE-100', warehouse: 8, amazon: 14, blinkit: 2, myntra: 12, flipkart: 5, instamart: 1, nykaa: 4, shopify: 18, avgMonthlySales: 310, cost: 72, price: 499, leadTime: 30 },
  { id: 'inv-5', name: 'Hydrating Lavender Gel 100g', sku: 'SH-LAV-100', warehouse: 420, amazon: 115, blinkit: 45, myntra: 85, flipkart: 50, instamart: 25, nykaa: 60, shopify: 90, avgMonthlySales: 280, cost: 110, price: 549, leadTime: 30 }
];

const INITIAL_SUPPORT_CASES: SupportCase[] = [
  { id: 'case-1', customer: 'Meera Sen', channel: 'shopify', msg: 'My order #SH-9840 was marked delivered, but I did not receive it. Blinkit package rider was unreachable.', status: 'Open', escalation: 'Refund Requested', time: '10m ago', thread: [
    { sender: 'customer', msg: 'My order #SH-9840 was marked delivered, but I did not receive it. Blinkit package rider was unreachable.', time: '16:42' },
    { sender: 'ai', msg: 'I apologize for the inconvenience, Meera. I am tracking your order #SH-9840. Our records show it was completed by the Blinkit partner. I am initiating an escalation to our operations team to get a refund or dispatch another unit. Please wait while I connect you.', time: '16:43' }
  ]},
  { id: 'case-2', customer: 'Rohan Sharma', channel: 'whatsapp', msg: 'Received lip tint, but shade "Midnight Cherry" is completely different from pictures. Need exchange.', status: 'Open', escalation: 'Exchange Request', time: '1h ago', thread: [
    { sender: 'customer', msg: 'Received lip tint, but shade "Midnight Cherry" is completely different from pictures. Need exchange.', time: '15:30' },
    { sender: 'ai', msg: 'Hello Rohan! I can certainly help you exchange your Matte Peach Lipstick. I have logged your request. Would you like a pickup scheduled, or a credit coupon code instead?', time: '15:32' }
  ]},
  { id: 'case-3', customer: 'Nitin Gupta', channel: 'website', msg: 'Can I cancel my order #SH-9822? It is still processing.', status: 'Resolved', escalation: 'None', time: '4h ago', thread: [
    { sender: 'customer', msg: 'Can I cancel my order #SH-9822? It is still processing.', time: '12:15' },
    { sender: 'ai', msg: 'Your order #SH-9822 has been successfully cancelled. The refund will reflect in your GPay account in 2-3 business days.', time: '12:17' }
  ]}
];

const INITIAL_REVIEWS: Review[] = [
  { id: 'rev-1', customer: 'Priya Shah', rating: 5, platform: 'Google', text: 'Absolutely love the Nail Gel Set! The classic nudes are highly pigmented and hold up for weeks without chipping. Worth every rupee.', date: '2026-06-18', sentiment: 'positive', reply: 'Thank you Priya! We are thrilled to hear our gel polish holds up beautifully!' },
  { id: 'rev-2', customer: 'Amit K.', rating: 2, platform: 'Amazon', text: 'Product itself is fine but the Rosewater bottle arrived leaking. The Amazon bag was completely damp.', date: '2026-06-16', sentiment: 'negative', reply: 'Hi Amit, we apologize for the leaking mist bottle. We are sending a replacement right away!' },
  { id: 'rev-3', customer: 'Neha Sharma', rating: 4, platform: 'Nykaa', text: 'Very nice hydration from the Lavender Gel. Non-sticky formula. Will buy again.', date: '2026-06-16', sentiment: 'positive', reply: null },
  { id: 'rev-4', customer: 'Shreya Roy', rating: 1, platform: 'Nykaa', text: 'Ordered peach lipstick but received wrong shade Midnight Cherry. Disappointed.', date: '2026-06-15', sentiment: 'negative', reply: 'We are sorry for the mixup Shreya. Our AI Support is issuing an exchange code for you.' }
];

const INITIAL_RECEIVABLES: Receivable[] = [
  { id: 'rec-1', name: 'Bella Shine Nail Spa', owner: 'Ritu Kapoor', email: 'ritu@bellashine.com', phone: '+91 98765 43210', outstanding: 120000, overdueDays: 37, lastReminder: '2026-06-12', stage: 'Reminder #3', invoices: [{ invNo: 'INV-2026-092', amount: 80000, date: '2026-05-12' }, { invNo: 'INV-2026-104', amount: 40000, date: '2026-05-25' }] },
  { id: 'rec-2', name: 'Gloss & Glow Salons', owner: 'Vikram Grover', email: 'billing@glossnglow.com', phone: '+91 99112 23344', outstanding: 450000, overdueDays: 24, lastReminder: '2026-06-15', stage: 'Reminder #2', invoices: [{ invNo: 'INV-2026-110', amount: 450000, date: '2026-05-26' }] },
  { id: 'rec-3', name: 'Luxe Nail Studio Academy', owner: 'Neha Dhupia', email: 'neha.academy@gmail.com', phone: '+91 98100 98100', outstanding: 95000, overdueDays: 8, lastReminder: '2026-06-18', stage: 'Reminder #1', invoices: [{ invNo: 'INV-2026-124', amount: 95000, date: '2026-06-11' }] },
  { id: 'rec-4', name: 'Style & Scissors Academy', owner: 'Sanjay Dutt', email: 'finance@stylescissors.in', phone: '+91 92123 45678', outstanding: 280000, overdueDays: 45, lastReminder: '2026-06-08', stage: 'Escalation', invoices: [{ invNo: 'INV-2026-084', amount: 280000, date: '2026-05-05' }] },
  { id: 'rec-5', name: 'Elite Makeup Studio', owner: 'Priya Anand', email: 'priya@elitemakeup.com', phone: '+91 95600 12345', outstanding: 45000, overdueDays: 0, lastReminder: 'None', stage: 'Invoice Issued', invoices: [{ invNo: 'INV-2026-135', amount: 45000, date: '2026-06-19' }] }
];

const INITIAL_SALON_LEADS: Lead[] = [
  { id: 'lead-1', name: 'Blush & Brush Nail Studio', phone: '+91 98711 22334', email: 'contact@blushnbrush.com', location: 'Greater Kailash, Delhi', website: 'blushnbrush.in', stage: 'Interested', notes: 'Interested in Nail Gel Kit bulk samples.' },
  { id: 'lead-2', name: 'Royal Polish & Nail Academy', phone: '+91 99990 88880', email: 'info@royalpolish.com', location: 'Indiranagar, Bangalore', website: 'royalpolishacademy.com', stage: 'Sample Sent', notes: 'Sent Nail Gel Set #12 sample kit on June 15.' },
  { id: 'lead-3', name: 'Chrome Tips Nail Salon', phone: '+91 98123 45690', email: 'bookings@chrometips.in', location: 'Bandra West, Mumbai', website: 'chrometips.in', stage: 'Lead', notes: 'Scraped from Maps. Active Nail studio.' },
  { id: 'lead-4', name: 'Shimmer & Sparkle Beauty Academy', phone: '+91 95555 44444', email: 'admin@shimmersparkle.com', location: 'Sector 15, Noida', website: 'shimmersparkleacademy.com', stage: 'Negotiation', notes: 'Negotiating pricing for 100 sets order.' },
  { id: 'lead-5', name: 'Divine Touch Salon & Academy', phone: '+91 98888 77777', email: 'divinetouch@yahoo.com', location: 'Salt Lake, Kolkata', website: 'divinetouchsalon.com', stage: 'Won', notes: 'Closed deal for ₹1.2L starter kit bulk orders.' }
];

const INITIAL_CONTENT_DRAFTS: ContentDraft[] = [
  { id: 'c-1', title: 'Viral Nail Gel Set #12 Hook', type: 'UGC Script', platform: 'Instagram Reels', product: 'Nail Gel Set #12', status: 'draft', scriptText: 'Hook: "If you are still going to the salon for nudes, stop scrolling."\nShot 1: Close-up of Nail Gel Set #12 peeling off beautifully.\nShot 2: Quick application of the nude shade showing self-leveling gel base.\nCTA: "Get your salon-grade kit on Blinkit in 10 minutes!"' },
  { id: 'c-2', title: 'Rosewater Mist Refresh routine', type: 'Product Demo', platform: 'TikTok', product: 'Rosewater Face Mist 100ml', status: 'review', scriptText: 'Hook: "My 3 PM makeup hydration hack that costs under ₹500."\nShot 1: Model spraying mist over matte makeup.\nShot 2: Show dewiness and moisture meter reading 94%.\nCTA: "Click below to secure yours with free shipping today!"' },
  { id: 'c-3', title: 'Vitamin C Glow broadcast copy', type: 'Ad Campaign', platform: 'Facebook Ads', product: 'Vitamin C Face Serum 30ml', status: 'approved', scriptText: 'Ad Copy: "Tired of dull skin by midday? Our Vitamin C Serum is packed with 15% L-Ascorbic Acid for 24hr brightness. Clinically proven. Cruelty-free.\nShop Now to get 15% off your first subscription!"' }
];

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // App Global States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('isLoggedIn');
    if (saved === 'true') {
      setIsLoggedIn(true);
    }
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem('isLoggedIn', String(isLoggedIn));
    }
  }, [isLoggedIn, hasMounted]);

  const [loginEmail, setLoginEmail] = useState('apoorv@shillsbeauty.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [theme, setTheme] = useState('dark'); 
  const [dateFilter, setDateFilter] = useState('30d');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Spotlight Finder States
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightInput, setSpotlightInput] = useState('');
  const [spotlightSelectedIndex, setSpotlightSelectedIndex] = useState(0);

  // Inspector States
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorType, setInspectorType] = useState('order');
  const [inspectorData, setInspectorData] = useState<any>({});

  // Shared Global Databases
  const [inventory, setInventory] = useState<Product[]>(INITIAL_INVENTORY);
  const [supportCases, setSupportCases] = useState<SupportCase[]>(INITIAL_SUPPORT_CASES);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [receivables, setReceivables] = useState<Receivable[]>(INITIAL_RECEIVABLES);
  const [salonLeads, setSalonLeads] = useState<Lead[]>(INITIAL_SALON_LEADS);
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>(INITIAL_CONTENT_DRAFTS);
  const [whatsappAlerts, setWhatsappAlerts] = useState<WhatsappAlert[]>([
    { id: 'wa-1', type: 'Low Stock', message: 'Rosewater Face Mist 100ml is critical (8 units left).', time: '10m ago', active: true },
    { id: 'wa-2', type: 'Dead Stock', message: 'Hydrating Lavender Gel has 120 days of dead stock in Delhi Hub.', time: '2h ago', active: true }
  ]);

  // Dynamic Navigation History (Simulated)
  const [historyStack, setHistoryStack] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Push path to custom history stack when pathname changes
  useEffect(() => {
    if (pathname && historyStack[historyIndex] !== pathname) {
      const newStack = historyStack.slice(0, historyIndex + 1);
      newStack.push(pathname);
      setHistoryStack(newStack);
      setHistoryIndex(newStack.length - 1);
    }
  }, [pathname]);

  // Go Back in Custom History
  const goBack = () => {
    if (historyIndex > 0) {
      const target = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      router.push(target);
    }
  };

  // Go Forward in Custom History
  const goForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const target = historyStack[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      router.push(target);
    }
  };

  // Toast System
  const showToast = (message: string, type = 'info') => {
    const newToast = { id: Date.now(), message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3200);
  };

  // Apply Theme Attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listen for Global Cmd+K
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightInput('');
        setSpotlightSelectedIndex(0);
        setSpotlightOpen(true);
      }
      if (e.key === 'Escape') {
        setSpotlightOpen(false);
        setInspectorOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const spotlightOptions = [
    { text: 'Go to Executive Dashboard', type: 'navigation', target: '/dashboard', shortcut: '⌘1' },
    { text: 'Go to Inventory Intelligence', type: 'navigation', target: '/inventory', shortcut: '⌘2' },
    { text: 'Go to Customer Care & Reviews', type: 'navigation', target: '/customer-care', shortcut: '⌘3' },
    { text: 'Go to Accounts Receivable', type: 'navigation', target: '/accounts-receivable', shortcut: '⌘4' },
    { text: 'Go to B2B Salon Sales CRM', type: 'navigation', target: '/salon-sales', shortcut: '⌘5' },
    { text: 'Go to Marketing Content OS', type: 'navigation', target: '/marketing', shortcut: '⌘6' },
  ];

  const filteredSpotlightOptions = spotlightOptions.filter((item) =>
    item.text.toLowerCase().includes(spotlightInput.toLowerCase())
  );

  const selectSpotlightItem = (item: typeof spotlightOptions[0]) => {
    setSpotlightOpen(false);
    router.push(item.target);
    showToast(`Navigated to ${item.text}`, 'success');
  };

  if (!hasMounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0c', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Loading Shills OS...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        theme,
        setTheme,
        dateFilter,
        setDateFilter,
        toasts,
        showToast,
        spotlightOpen,
        setSpotlightOpen,
        inspectorOpen,
        setInspectorOpen,
        inspectorType,
        setInspectorType,
        inspectorData,
        setInspectorData,
        inventory,
        setInventory,
        supportCases,
        setSupportCases,
        reviews,
        setReviews,
        receivables,
        setReceivables,
        salonLeads,
        setSalonLeads,
        contentDrafts,
        setContentDrafts,
        whatsappAlerts,
        setWhatsappAlerts
      }}
    >
      <div className="app-container">
        {/* Apple Glass Glows */}
        <div className="ambient-glow bg-glow-1"></div>
        <div className="ambient-glow bg-glow-2"></div>
        <div className="ambient-glow bg-glow-3"></div>

        {/* Global Toast Alerts */}
        <div
          id="toast-container"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 99999,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast-notif liquid-card-sm`}
              style={{
                boxShadow: 'var(--glass-shadow)',
                backdropFilter: 'blur(20px)',
                background: 'var(--glass-fill)',
                outline: '1.5px solid var(--glass-border)',
                color: 'var(--label-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '12px',
                animation: 'fadeIn 300ms ease',
              }}
            >
              {t.type === 'success' && <CheckCircle2 size={16} className="status-success-icon" style={{ color: 'var(--green)' }} />}
              {t.type === 'error' && <AlertTriangle size={16} style={{ color: 'var(--red)' }} />}
              {t.type === 'info' && <Info size={16} style={{ color: 'var(--blue)' }} />}
              <span style={{ fontSize: '13px', fontWeight: '500' }}>{t.message}</span>
            </div>
          ))}
        </div>

        {isLoggedIn ? (
          <>
            {mobileSidebarOpen && (
              <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
            )}
            
            {/* macOS Frosted Sidebar Rail */}
            <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
              <div
                className="sidebar-header"
                style={{
                  height: '96px',
                  padding: '16px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid var(--separator)',
                }}
              >
                <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src="/icon.png" alt="Shills OS Logo" style={{ width: '60px', height: '60px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
                  <div className="brand-details">
                    <span className="brand-name" style={{ fontWeight: '800', fontSize: '18px', color: '#fff', lineHeight: '1.2' }}>Shills OS</span>
                    <span className="brand-version" style={{ display: 'block', fontSize: '11px', color: 'var(--label-tertiary)' }}>v1.2 Enterprise</span>
                    <span style={{ display: 'block', fontSize: '9px', color: 'var(--blue)', fontWeight: '700', marginTop: '2px' }}>Powered by ScalePods</span>
                  </div>
                </div>
              </div>

              <nav className="sidebar-nav">
                <div className="nav-section-label">Founder Core</div>
                
                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <div className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}>
                    <LayoutDashboard size={16} />
                    <span>Executive Board</span>
                  </div>
                </Link>

                <div className="nav-section-label">Operations</div>

                <Link href="/inventory" style={{ textDecoration: 'none' }}>
                  <div className={`nav-item ${pathname === '/inventory' ? 'active' : ''}`}>
                    <Package size={16} />
                    <span>Inventory Intel</span>
                  </div>
                </Link>

                <Link href="/customer-care" style={{ textDecoration: 'none' }}>
                  <div className={`nav-item ${pathname === '/customer-care' ? 'active' : ''}`}>
                    <Bot size={16} />
                    <span>Customer Care</span>
                  </div>
                </Link>

                <div className="nav-section-label">Finance & Sales</div>

                <Link href="/accounts-receivable" style={{ textDecoration: 'none' }}>
                  <div className={`nav-item ${pathname === '/accounts-receivable' ? 'active' : ''}`}>
                    <DollarSign size={16} />
                    <span>Receivables OS</span>
                  </div>
                </Link>

                <Link href="/salon-sales" style={{ textDecoration: 'none' }}>
                  <div className={`nav-item ${pathname === '/salon-sales' ? 'active' : ''}`}>
                    <Users size={16} />
                    <span>Salon CRM</span>
                  </div>
                </Link>

                <div className="nav-section-label">Marketing</div>

                <Link href="/marketing" style={{ textDecoration: 'none' }}>
                  <div className={`nav-item ${pathname === '/marketing' ? 'active' : ''}`}>
                    <Sparkles size={16} />
                    <span>Content OS</span>
                  </div>
                </Link>
              </nav>

              <div className="sidebar-footer">
                <div className="theme-switcher">
                  <button
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme('light')}
                    title="Light Theme"
                  >
                    <Sun size={14} />
                  </button>
                  <button
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme('dark')}
                    title="Dark Theme"
                  >
                    <Moon size={14} />
                  </button>
                </div>

                <div className="user-profile">
                  <div className="avatar">
                    <span>AM</span>
                    <div className="status-indicator online"></div>
                  </div>
                  <div className="user-details">
                    <span className="user-name">Apoorv Mehta</span>
                    <span className="user-role">Founder View</span>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setIsLoggedIn(false);
                      router.push('/');
                      showToast('Logged out of Shills Growth OS.', 'info');
                    }}
                    title="System Logout"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--label-secondary)' }}
                  >
                    <LogOut size={14} />
                  </button>
                </div>

                <div
                  className="scalepods-footer"
                  style={{
                    textAlign: 'center',
                    fontSize: '9.5px',
                    color: 'var(--label-tertiary)',
                    padding: '12px 0 4px',
                    borderTop: '1px solid var(--separator)',
                    marginTop: '12px',
                    letterSpacing: '0.05em',
                  }}
                >
                  Powered by <span style={{ fontWeight: '700', color: 'var(--blue)' }}>ScalePods</span>
                </div>
              </div>
            </aside>

            {/* Main Workspace */}
            <div className="main-workspace">
              <header className="app-header">
                <div className="header-left">
                  <button
                    className="menu-toggle-btn"
                    onClick={() => setMobileSidebarOpen((prev) => !prev)}
                    title="Toggle Navigation"
                    style={{ background: 'transparent', border: 'none', color: 'var(--label-primary)', cursor: 'pointer' }}
                  >
                    <Menu size={18} />
                  </button>
                  <div className="navigation-controls" style={{ display: 'flex', gap: '6px' }}>
                    <button className="nav-ctrl-btn" onClick={goBack} title="Back" style={{ border: 'none', background: 'transparent', color: 'var(--label-secondary)' }}><ChevronLeft size={16} /></button>
                    <button className="nav-ctrl-btn" onClick={goForward} title="Forward" style={{ border: 'none', background: 'transparent', color: 'var(--label-secondary)' }}><ChevronRight size={16} /></button>
                  </div>
                  <div className="breadcrumb" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="breadcrumb-parent">Shills OS</span>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-active" style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                      {pathname === '/' ? 'Dashboard' : pathname ? pathname.replace('/', '').replace('-', ' ') : 'Dashboard'}
                    </span>
                    <span style={{ fontSize: '10px', background: 'rgba(0, 122, 255, 0.08)', color: 'var(--blue)', border: '1px solid rgba(0, 122, 255, 0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', marginLeft: '8px' }}>
                      Powered by ScalePods
                    </span>
                  </div>
                </div>

                <div className="header-center">
                  <div
                    className="search-spotlight-trigger"
                    onClick={() => setSpotlightOpen(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Search size={14} />
                    <span>Search modules... (⌘K)</span>
                  </div>
                </div>

                <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--label-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 122, 255, 0.08)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
                    Powered by <span style={{ color: 'var(--blue)', fontWeight: '700' }}>ScalePods</span>
                  </div>
                  <div className="badge badge-live"><span>Live API Sync</span></div>
                  
                  <div className="date-selector-wrapper">
                    <Calendar size={14} />
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="header-select"
                    >
                      <option value="today">Today</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="ytd">Year to Date</option>
                    </select>
                  </div>

                  <button
                    className="btn-icon header-btn"
                    onClick={() => showToast('Syncing all modules with Shopify, Amazon, Blinkit, and Myntra API gateways...', 'info')}
                    title="Notifications"
                    style={{ background: 'transparent', border: 'none', color: 'var(--label-secondary)', cursor: 'pointer', position: 'relative' }}
                  >
                    <Bell size={14} />
                    <span className="notification-indicator"></span>
                  </button>

                  <div className="system-status-indicator" title="All storefront channels active">
                    <CheckCircle size={18} className="status-success-icon" style={{ color: 'var(--green)' }} />
                  </div>
                </div>
              </header>

              <main className="content-body" style={{ position: 'relative', overflowY: 'auto' }}>
                {children}
              </main>
            </div>
          </>
        ) : (
          /* Premium B2B SaaS Redesigned Landing Page */
          <div className="landing-container" style={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0c', overflowY: 'auto', position: 'relative' }}>
            {/* Curated Aesthetic Glowing Orbs */}
            <div className="landing-glow-1" style={{ position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }}></div>
            <div className="landing-glow-2" style={{ position: 'absolute', bottom: '20%', right: '5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(175, 82, 222, 0.15) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 45, 85, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }}></div>

            {/* Navigation Header */}
            <header className="landing-navbar" style={{ position: 'sticky', left: 0, transform: 'none', width: '100%', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(10, 10, 12, 0.8)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <div className="landing-nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src="/icon.png" alt="Shills OS Logo" style={{ width: '64px', height: '64px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} />
                  <div>
                    <span className="landing-nav-logo-txt" style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.05em', color: '#fff', display: 'block', lineHeight: '1.1' }}>SHILLS GROWTH OS</span>
                    <span style={{ fontSize: '10px', color: 'var(--label-secondary)', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                      Powered by <span style={{ color: 'var(--blue)', fontWeight: '700' }}>ScalePods</span>
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }} className="landing-nav-links-desktop">
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', cursor: 'default' }}>Live Syncing: Shopify • Blinkit • Nykaa • Myntra</span>
                  </div>
                  <button
                    className="btn-nav-signup"
                    onClick={() => {
                      setIsLoggedIn(true);
                      if (pathname === '/') {
                        router.push('/dashboard');
                      }
                    }}
                    style={{ cursor: 'pointer', background: 'linear-gradient(135deg, var(--blue), var(--purple))', padding: '8px 20px', borderRadius: '20px', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '600', transition: 'all 200ms ease', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)' }}
                  >
                    Quick Sign In
                  </button>
                </div>
              </div>
            </header>

            {/* Split Grid Body */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '60px 24px', position: 'relative', zIndex: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '60px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>
                
                {/* Left Side Info Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 122, 255, 0.1)', border: '1px solid rgba(0, 122, 255, 0.2)', padding: '6px 16px', borderRadius: '30px', width: 'fit-content' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue)', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                    <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--blue)' }}>COMMAND CENTER v1.2 ACTIVE • Powered by ScalePods</span>
                  </div>

                  <h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>
                    The Intelligent OS for <br />
                    <span style={{ background: 'linear-gradient(135deg, #fff 20%, var(--purple) 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Modern Beauty Brands</span>
                  </h1>

                  <p style={{ fontSize: '16px', color: 'var(--label-secondary)', lineHeight: '1.6', margin: 0 }}>
                    Unify warehouse logs, automate post-delivery review solicitation, orchestrate accounts receivable recoveries, and scale wholesale salon sales from one command board.
                  </p>

                  {/* Core Value Props List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ background: 'rgba(52, 199, 89, 0.1)', color: 'var(--green)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={16} /></div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: '#fff' }}>Automated Review Interception</strong>
                        <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>Filters Day 3 check-in ratings; intercepts 1-3★ issues into private support tickets.</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ background: 'rgba(0, 122, 255, 0.1)', color: 'var(--blue)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} /></div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: '#fff' }}>Multi-Channel Stock Forecasting</strong>
                        <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>Calculates safety thresholds and restock dates incorporating China transit lead times.</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ background: 'rgba(175, 82, 222, 0.1)', color: 'var(--purple)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={16} /></div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: '#fff' }}>21-Day AI Receivables Recovery</strong>
                        <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>Dials automated SMS, emails, and voice call dialers to recover retail accounts receivable.</span>
                      </div>
                    </div>
                  </div>

                  {/* Marketplace Integration Ribbons */}
                  <div style={{ marginTop: '20px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>CONNECTED PLATFORM GATEWAYS</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(150, 191, 72, 0.1)', border: '1px solid rgba(150, 191, 72, 0.2)', color: '#96BF48', fontWeight: '600' }}>Shopify</span>
                      <span style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(255, 153, 0, 0.1)', border: '1px solid rgba(255, 153, 0, 0.2)', color: '#FF9900', fontWeight: '600' }}>Amazon</span>
                      <span style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(250, 214, 5, 0.1)', border: '1px solid rgba(250, 214, 5, 0.2)', color: '#FAD605', fontWeight: '600' }}>Blinkit</span>
                      <span style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(255, 63, 108, 0.1)', border: '1px solid rgba(255, 63, 108, 0.2)', color: '#FF3F6C', fontWeight: '600' }}>Myntra</span>
                      <span style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(224, 0, 76, 0.1)', border: '1px solid rgba(224, 0, 76, 0.2)', color: '#E0004C', fontWeight: '600' }}>Nykaa</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Glassmorphic Login Console */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div 
                    style={{ 
                      width: '100%', 
                      maxWidth: '400px', 
                      background: 'rgba(20, 20, 25, 0.6)', 
                      backdropFilter: 'blur(30px) saturate(180%)', 
                      border: '1px solid rgba(255, 255, 255, 0.08)', 
                      borderRadius: '24px', 
                      padding: '32px', 
                      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                  >
                    {/* Header profile */}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <div style={{ width: '120px', height: '120px', borderRadius: '28px', background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255, 255, 255, 0.1)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <img src="/icon.png" alt="Shills Profile Logo" style={{ width: '96px', height: '96px', objectFit: 'contain' }} />
                      </div>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>Authorize Access</h2>
                      <p style={{ fontSize: '12.5px', color: 'var(--label-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
                        Enter secure credentials to log into Shills OS. <br />
                        <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: '700', display: 'block', marginTop: '4px' }}>Powered by ScalePods</span>
                      </p>
                    </div>

                    {/* Form Console */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setIsLoggedIn(true);
                        if (pathname === '/') {
                          router.push('/dashboard');
                        }
                        setTheme('dark');
                        showToast('Identity authorized. Initializing Shills Growth OS...', 'success');
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Login Email</label>
                        <input
                          type="email"
                          placeholder="apoorv@shillsbeauty.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', fontSize: '13.5px', background: 'rgba(0,0,0,0.2)', color: '#fff', transition: 'border-color 200ms ease' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure Password Token</label>
                        <input
                          type="password"
                          placeholder="Security Token"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', fontSize: '13.5px', background: 'rgba(0,0,0,0.2)', color: '#fff', transition: 'border-color 200ms ease' }}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        style={{ padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', marginTop: '10px', boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)', transition: 'all 200ms ease' }}
                      >
                        Authenticate OS Gateway
                      </button>
                    </form>

                    {/* Developer Note */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 149, 0, 0.05)', border: '1px solid rgba(255, 149, 0, 0.1)', padding: '10px', borderRadius: '10px' }}>
                        <AlertTriangle size={14} style={{ color: 'var(--orange)', flexShrink: 0 }} />
                        <span style={{ fontSize: '10.5px', color: 'var(--orange)', lineHeight: '1.3' }}>Note: Admin credentials are pre-filled. Click authenticate to enter.</span>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '10.5px', color: 'var(--label-tertiary)', marginTop: '4px' }}>
                        Secured Gateway • Powered by <span style={{ color: 'var(--blue)', fontWeight: '600' }}>ScalePods</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Redesigned Features / Module Board Grid */}
              <div style={{ marginTop: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>OS MODULE ARCHITECTURE</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '6px' }}>Enterprise Sub-systems & Core Engines</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  {/* Module 1 */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(0, 122, 255, 0.1)', color: 'var(--blue)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={18} /></div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Inventory Intelligence & Forecasting</h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--label-secondary)', lineHeight: '1.4', margin: 0 }}>Predict stockout dates, monitor multi-channel logs (warehouse, quick-commerce), and optimize purchase orders based on lead-time variables.</p>
                  </div>
                  {/* Module 2 */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(52, 199, 89, 0.1)', color: 'var(--green)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={18} /></div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Customer Care & Review Engine</h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--label-secondary)', lineHeight: '1.4', margin: 0 }}>Track post-purchase journeys, intercept low ratings privately, and auto-route 5-star reviews to public marketplaces (Amazon, Google, Nykaa).</p>
                  </div>
                  {/* Module 3 */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(175, 82, 222, 0.1)', color: 'var(--purple)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={18} /></div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Accounts Receivable Recovery</h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--label-secondary)', lineHeight: '1.4', margin: 0 }}>Monitor outstanding ageing buckets, track structured 21-day timeline reminders, and dispatch voice calls, emails, and SMS alerts.</p>
                  </div>
                  {/* Module 4 */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(255, 149, 0, 0.1)', color: 'var(--orange)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} /></div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>B2B Salon Sales Engine</h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--label-secondary)', lineHeight: '1.4', margin: 0 }}>Scrape beauty academies and nail studios off Google Maps, organize active pipeline stages, and send template outreach campaigns.</p>
                  </div>
                  {/* Module 5 */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(255, 45, 85, 0.1)', color: 'var(--pink)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={18} /></div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Marketing Content OS</h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--label-secondary)', lineHeight: '1.4', margin: 0 }}>Plan calendar schedules, generate UGC ad scripts, and manage Maker-Checker content review pipelines from one station.</p>
                  </div>
                  {/* Core Platform integration */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(90, 200, 250, 0.1)', color: 'var(--teal)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={18} /></div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Real-Time Live API Sync</h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--label-secondary)', lineHeight: '1.4', margin: 0 }}>Continuously syncs data streams across POS endpoints, dark store locations, and multi-channel marketing campaigns.</p>
                  </div>
                </div>
              </div>

            </main>

            {/* Footer Credits */}
            <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', padding: '30px 24px', marginTop: 'auto', background: '#070709' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '12.5px', color: 'var(--label-tertiary)' }}>
                <span>© 2026 Shills Beauty Professional. All Rights Reserved.</span>
                <span>Powered by <span style={{ fontWeight: '700', color: 'var(--blue)' }}>ScalePods</span> Growth Framework</span>
              </div>
            </footer>
          </div>
        )}

        {/* Global Search Spotlight Modal */}
        {spotlightOpen && (
          <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={() => setSpotlightOpen(false)}>
            <div className="spotlight-panel" onClick={(e) => e.stopPropagation()}>
              <div className="spotlight-header">
                <Search size={18} />
                <input
                  type="text"
                  className="spotlight-input"
                  value={spotlightInput}
                  onChange={(e) => setSpotlightInput(e.target.value)}
                  placeholder="Type navigations (e.g. inventory, care, salon)..."
                  autoFocus
                />
              </div>
              <div className="spotlight-results">
                {filteredSpotlightOptions.length === 0 ? (
                  <div style={{ padding: '16px', fontSize: '13px', color: 'var(--label-tertiary)' }}>No matching modules found.</div>
                ) : (
                  filteredSpotlightOptions.map((item, index) => (
                    <div
                      key={index}
                      className={`spotlight-item ${index === spotlightSelectedIndex ? 'selected' : ''}`}
                      onClick={() => selectSpotlightItem(item)}
                    >
                      <div className="spotlight-item-left">
                        <LayoutDashboard size={14} />
                        <span>{item.text}</span>
                      </div>
                      <span className="spotlight-shortcut">{item.shortcut}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="spotlight-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Use <kbd>ESC</kbd> to close, <kbd>Click</kbd> to select option</span>
                <span style={{ fontSize: '9.5px', color: 'var(--label-tertiary)' }}>Powered by <span style={{ color: 'var(--blue)', fontWeight: '700' }}>ScalePods</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
