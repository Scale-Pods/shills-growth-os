'use client';

import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import {
  LayoutDashboard,
  LineChart,
  ShoppingBag,
  PieChart,
  ShoppingCart,
  Package,
  MessageSquare,
  Star,
  Sparkles,
  Users,
  Bot,
  UserCheck,
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
  TrendingUp,
  AlertTriangle,
  Smile,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Check,
  Smartphone,
  Send,
  Plus,
  RefreshCw,
  Power,
  FileText,
  X,
  DollarSign,
  Lightbulb,
  Sheet,
  Copy
} from "lucide-react";

// ==========================================================================
// Mock Database Constants
// ==========================================================================
const INITIAL_PRODUCTS = [
  { id: 'prod-1', name: 'Vitamin C Face Serum 30ml', sku: 'SH-VITC-30', category: 'Skincare', price: 799, cost: 162, marketingCost: 240 },
  { id: 'prod-2', name: 'Matte Peach Lipstick (Glow Edition)', sku: 'SH-PEACH-LP', category: 'Cosmetics', price: 649, cost: 98, marketingCost: 180 },
  { id: 'prod-3', name: 'Hydrating Lavender Gel 100g', sku: 'SH-LAV-100', category: 'Skincare', price: 549, cost: 110, marketingCost: 190 },
  { id: 'prod-4', name: 'Rosewater Face Mist 100ml', sku: 'SH-ROSE-100', category: 'Skincare', price: 499, cost: 72, marketingCost: 150 },
  { id: 'prod-5', name: 'Charcoal Clay Face Mask 50g', sku: 'SH-CHAR-50', category: 'Skincare', price: 599, cost: 125, marketingCost: 200 }
];

const INITIAL_ORDERS = [
  { id: 'SH-9840', datetime: '2026-06-17 16:42', channel: 'shopify', customer: 'Meera Sen', email: 'meera.sen@gmail.com', value: 2247, fulfillment: 'unfulfilled', cod: 'Prepaid', shipping: 'processing', issue: 'issue', msg: 'My order #SH-9840 was marked delivered, but I did not receive it. Blinkit package rider was unreachable.' },
  { id: 'SH-9839', datetime: '2026-06-17 16:15', channel: 'blinkit', customer: 'Aditi Rao', email: 'aditi.rao@hotmail.com', value: 1298, fulfillment: 'fulfilled', cod: 'Prepaid', shipping: 'delivered', issue: 'normal' },
  { id: 'SH-9838', datetime: '2026-06-17 15:58', channel: 'amazon', customer: 'Kabir Dev', email: 'kabir.dev@yahoo.com', value: 3196, fulfillment: 'fulfilled', cod: 'COD', shipping: 'shipped', issue: 'normal' },
  { id: 'SH-9837', datetime: '2026-06-17 15:20', channel: 'myntra', customer: 'Pooja Hegde', email: 'pooja.hegde@gmail.com', value: 1947, fulfillment: 'unfulfilled', cod: 'Prepaid', shipping: 'processing', issue: 'issue', msg: 'Myntra shipment delayed at Gurgaon sorting hub for 3 days.' },
  { id: 'SH-9836', datetime: '2026-06-17 14:10', channel: 'instamart', customer: 'Rahul Dravid', email: 'rahul.d@cricket.in', value: 799, fulfillment: 'fulfilled', cod: 'Prepaid', shipping: 'delivered', issue: 'normal' },
  { id: 'SH-9835', datetime: '2026-06-17 13:45', channel: 'flipkart', customer: 'Tanya Sen', email: 'tanya.sen@gmail.com', value: 1448, fulfillment: 'unfulfilled', cod: 'COD', shipping: 'processing', issue: 'normal' },
  { id: 'SH-9834', datetime: '2026-06-17 12:30', channel: 'shopify', customer: 'Vikram Seth', email: 'vikram.seth@outlook.com', value: 4594, fulfillment: 'fulfilled', cod: 'Prepaid', shipping: 'shipped', issue: 'normal' },
  { id: 'SH-9833', datetime: '2026-06-17 11:12', channel: 'amazon', customer: 'Zoya Akhtar', email: 'zoya@excel.in', value: 1298, fulfillment: 'fulfilled', cod: 'Prepaid', shipping: 'delivered', issue: 'normal' }
];

const INITIAL_CUSTOMERS = [
  { id: 'CUST-801', name: 'Meera Sen', email: 'meera.sen@gmail.com', ltv: 12450, orders: 8, lastOrder: '2026-06-17', repeatProb: 94, segment: 'vip', summary: 'Loyal high-value shopper. Purchases Vitamin C Serum every 45 days. High affinity for hydration skincare products.', communications: [{ date: '2026-06-17', title: 'Support Escalation', desc: 'Blinkit rider unreachable case filed.' }] },
  { id: 'CUST-802', name: 'Rohan Sharma', email: 'rohan.sharma@yahoo.com', ltv: 4500, orders: 3, lastOrder: '2026-06-16', repeatProb: 72, segment: 'repeat', summary: 'Regular buyer of lip tints. Reacts strongly to discount notifications. Prefers COD.', communications: [{ date: '2026-06-16', title: 'WhatsApp Query', desc: 'Requested exchange for Midnight Cherry shade.' }] },
  { id: 'CUST-803', name: 'Aditi Rao', email: 'aditi.rao@hotmail.com', ltv: 9800, orders: 6, lastOrder: '2026-06-17', repeatProb: 88, segment: 'vip', summary: 'High AOV customer. Skincare enthusiast. Always responds to WhatsApp winback offers.', communications: [] },
  { id: 'CUST-804', name: 'Kabir Dev', email: 'kabir.dev@yahoo.com', ltv: 3196, orders: 1, lastOrder: '2026-06-17', repeatProb: 14, segment: 'one-time', summary: 'Acquired through Meta lookalike campaign. High cart abandonment history before buying.', communications: [] },
  { id: 'CUST-805', name: 'Pooja Hegde', email: 'pooja.hegde@gmail.com', ltv: 5600, orders: 4, lastOrder: '2026-06-17', repeatProb: 81, segment: 'repeat', summary: 'Prefers Myntra storefront. High engagement on cosmetics items.', communications: [] }
];

const INITIAL_CAMPAIGNS = [
  { id: 'camp-1', name: 'Festival Glow Broadcast', type: 'Festival Campaign', revenue: '₹2,48,500', open: '94.2%', response: '41.2%', conv: '8.4%', status: 'Active' },
  { id: 'camp-2', name: 'Abandoned Cart Recovery Auto-Trigger', type: 'Abandoned Cart', revenue: '₹1,24,600', open: '91.8%', response: '35.6%', conv: '9.2%', status: 'Active' },
  { id: 'camp-3', name: 'Vitamin C Serum Reorder Loop', type: 'Reorder Campaigns', revenue: '₹1,10,400', open: '95.1%', response: '44.8%', conv: '6.8%', status: 'Active' },
  { id: 'camp-4', name: 'Winback Inactive Customer blast', type: 'Winback Campaigns', revenue: '₹59,300', open: '88.5%', response: '32.1%', conv: '4.2%', status: 'Inactive' }
];

const INITIAL_SUPPORT_CASES = [
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

const INITIAL_REVIEWS = [
  { id: 'rev-1', customer: 'Priyah Shah', rating: 5, platform: 'shopify', text: 'Absolutely love the Vitamin C Serum! My skin feels incredibly brightened and dewy. Highly recommended!', date: '2026-06-17', sentiment: 'positive', reply: 'Thank you Priya! We are thrilled to hear the Vitamin C serum is working wonders for your skin glow!' },
  { id: 'rev-2', customer: 'Amit K.', rating: 2, platform: 'blinkit', text: 'Product is good, but the Rosewater bottle arrived leaking. The Blinkit bag was damp.', date: '2026-06-16', sentiment: 'negative', reply: 'Hi Amit, we apologize for the leak. We are sending a replacement right away!' },
  { id: 'rev-3', customer: 'Neha Sharma', rating: 4, platform: 'amazon', text: 'Very nice hydration from the Lavender Gel. Non-sticky formula. Will buy again.', date: '2026-06-16', sentiment: 'positive', reply: 'Glad you loved the non-sticky texture, Neha!' },
  { id: 'rev-4', customer: 'Shreya Roy', rating: 1, platform: 'google', text: 'Ordered peach lipstick but received wrong shade Midnight Cherry. Disappointed.', date: '2026-06-15', sentiment: 'negative', reply: 'We are sorry for the mixup Shreya. Our AI Support is issuing an exchange code for you.' }
];

const INITIAL_INVENTORY = [
  { id: 'inv-1', name: 'Vitamin C Face Serum 30ml', sku: 'SH-VITC-30', warehouse: 850, amazon: 340, blinkit: 45, myntra: 110, instamart: 30, forecast30: 1200, daysLeft: 34, reorderQty: 1000 },
  { id: 'inv-2', name: 'Matte Peach Lipstick (Glow Edition)', sku: 'SH-PEACH-LP', warehouse: 120, amazon: 45, blinkit: 12, myntra: 0, instamart: 8, forecast30: 950, daysLeft: 5, reorderQty: 800 },
  { id: 'inv-3', name: 'Hydrating Lavender Gel 100g', sku: 'SH-LAV-100', warehouse: 420, amazon: 115, blinkit: 45, myntra: 85, instamart: 25, forecast30: 600, daysLeft: 32, reorderQty: 500 },
  { id: 'inv-4', name: 'Rosewater Face Mist 100ml', sku: 'SH-ROSE-100', warehouse: 8, amazon: 14, blinkit: 2, myntra: 12, instamart: 1, forecast30: 800, daysLeft: 1, reorderQty: 1200 },
  { id: 'inv-5', name: 'Charcoal Clay Face Mask 50g', sku: 'SH-CHAR-50', warehouse: 310, amazon: 95, blinkit: 25, myntra: 40, instamart: 15, forecast30: 450, daysLeft: 31, reorderQty: 400 }
];

const METRICS_BY_DATE = {
  today: {
    revenueToday: '₹2,48,920',
    revenueMonthly: '₹84,20,500',
    ordersToday: '1,420',
    aov: '₹1,752',
    repeatPurchase: '34.2%',
    cartRecovery: '₹1,24,600',
    csat: '4.85',
    inventoryHealth: '94.2%',
    trends: {
      revenueToday: '+12.4% vs yesterday',
      revenueMonthly: '+18.2% vs last month',
      ordersToday: '+8.6%',
      aov: '-1.2%',
      repeatPurchase: '+2.1%',
      cartRecovery: '+15.3%',
      csat: '+0.03',
      inventoryHealth: '+0.5%'
    }
  },
  '7d': {
    revenueToday: '₹18,42,100',
    revenueMonthly: '₹84,20,500',
    ordersToday: '9,830',
    aov: '₹1,873',
    repeatPurchase: '35.6%',
    cartRecovery: '₹8,42,100',
    csat: '4.88',
    inventoryHealth: '93.8%',
    trends: {
      revenueToday: '+14.1% vs prev 7d',
      revenueMonthly: '+18.2% vs last month',
      ordersToday: '+10.2%',
      aov: '+1.5%',
      repeatPurchase: '+1.8%',
      cartRecovery: '+12.1%',
      csat: '+0.05',
      inventoryHealth: '-0.4%'
    }
  },
  '30d': {
    revenueToday: '₹84,20,500',
    revenueMonthly: '₹84,20,500',
    ordersToday: '44,980',
    aov: '₹1,872',
    repeatPurchase: '36.8%',
    cartRecovery: '₹34,18,900',
    csat: '4.91',
    inventoryHealth: '94.5%',
    trends: {
      revenueToday: '+18.2% vs prev 30d',
      revenueMonthly: '+18.2% vs last month',
      ordersToday: '+14.5%',
      aov: '+2.1%',
      repeatPurchase: '+3.4%',
      cartRecovery: '+18.7%',
      csat: '+0.08',
      inventoryHealth: '+0.3%'
    }
  },
  ytd: {
    revenueToday: '₹5,12,40,600',
    revenueMonthly: '₹84,20,500',
    ordersToday: '2,73,920',
    aov: '₹1,870',
    repeatPurchase: '38.4%',
    cartRecovery: '₹1,84,20,500',
    csat: '4.92',
    inventoryHealth: '95.1%',
    trends: {
      revenueToday: '+24.6% vs last year',
      revenueMonthly: '+18.2% vs last month',
      ordersToday: '+22.1%',
      aov: '+1.8%',
      repeatPurchase: '+4.2%',
      cartRecovery: '+21.5%',
      csat: '+0.10',
      inventoryHealth: '+0.8%'
    }
  }
};

export default function Home() {
  // ==========================================================================
  // React State Initializers
  // ==========================================================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('apoorv@shillsbeauty.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [dateFilter, setDateFilter] = useState('7d');
  
  // Landing Page Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [signUpForm, setSignUpForm] = useState({
    brandName: '',
    fullName: '',
    email: '',
    storefront: 'shopify'
  });
  
  // Mobile Navigation State
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  
  // Database State (allows reactivity in component tree)
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
  const [supportCases, setSupportCases] = useState(INITIAL_SUPPORT_CASES);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [products] = useState(INITIAL_PRODUCTS);

  // Active sub-item selections
  const [selectedSalesChannel, setSelectedSalesChannel] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST-801');
  const [supportActiveCaseId, setSupportActiveCaseId] = useState('case-1');
  const [supportReplyInput, setSupportReplyInput] = useState('');

  // Filters & Searches
  const [ordersSearch, setOrdersSearch] = useState('');
  const [orderChannelFilter, setOrderChannelFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState('all');

  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsPlatformFilter, setReviewsPlatformFilter] = useState('all');
  const [reviewsSentimentFilter, setReviewsSentimentFilter] = useState('all');

  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryLocationFilter, setInventoryLocationFilter] = useState('all');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');

  // WhatsApp Campaign Builder
  const [broadcastForm, setBroadcastForm] = useState({
    name: 'Glow Festival Special',
    segment: 'all',
    text: 'Hey {{customer_name}}! ✨ Get ready to glow this weekend. Buy any 2 Shills Beauty items and get a free Rosewater Face Mist (100ml)! Use checkout code: FESTIVALGLOW at shillsbeauty.com. Tap here to auto-apply checkout: {{cart_link}}'
  });

  // Content Studio
  const [contentType, setContentType] = useState('instagram-caption');
  const [contentProduct, setContentProduct] = useState('rosewater-mist');
  const [contentTone, setContentTone] = useState('Aesthetic, clean, organic, glow-focused, dewy skin');
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentOutputVisible, setContentOutputVisible] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  
  // Kanban Stack State
  const [kanbanStack, setKanbanStack] = useState({
    draft: [
      { id: 'k-1', title: 'Vitamin C Tiktok script', type: 'Video' },
      { id: 'k-2', title: 'Lavender Gel IG Caption', type: 'Social' }
    ],
    review: [
      { id: 'k-3', title: 'Rosewater Mist Ad Copy v2', type: 'Ad Campaign' }
    ],
    approved: [
      { id: 'k-4', title: 'Pre-order lipstick blast', type: 'WhatsApp' }
    ]
  });

  // Founder Assistant Chat Console
  const [founderInput, setFounderInput] = useState('');
  const [founderMessages, setFounderMessages] = useState([
    {
      sender: 'system',
      msg: 'Welcome, Apoorv. I have direct access to your Shopify, Amazon, Flipkart, Myntra, Blinkit, and Instamart databases. Ask me anything about revenue, stock levels, marketing campaigns, or customer issues.',
      time: '17:02'
    }
  ]);

  // Spotlight Finder
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightInput, setSpotlightInput] = useState('');
  const [spotlightSelectedIndex, setSpotlightSelectedIndex] = useState(0);

  // Side Inspector Sheet
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorType, setInspectorType] = useState('order');
  const [inspectorData, setInspectorData] = useState({});

  // Toast System State
  const [toasts, setToasts] = useState([]);

  // Navigation History Queue
  const [tabHistory, setTabHistory] = useState(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // ==========================================================================
  // References for Chart canvases
  // ==========================================================================
  const dashCanvasRef = useRef(null);
  const salesCanvasRef = useRef(null);
  const donutCanvasRef = useRef(null);
  const forecastCanvasRef = useRef(null);
  const chartsInstanceRef = useRef({ dash: null, sales: null, donut: null, forecast: null });

  // ==========================================================================
  // Helper Toast Dispatcher
  // ==========================================================================
  const showToast = (message, type = 'info') => {
    const newToast = { id: Date.now(), message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 3200);
  };

  // ==========================================================================
  // Dynamic Tab Switch with Navigation History
  // ==========================================================================
  const handleSwitchTab = (tabId, pushToHistory = true) => {
    setActiveTab(tabId);
    if (pushToHistory) {
      const updatedHistory = tabHistory.slice(0, historyIndex + 1);
      updatedHistory.push(tabId);
      setTabHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);
    }
  };

  const handleHistoryBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      handleSwitchTab(tabHistory[prevIndex], false);
    }
  };

  const handleHistoryForward = () => {
    if (historyIndex < tabHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      handleSwitchTab(tabHistory[nextIndex], false);
    }
  };

  // ==========================================================================
  // Effect Hook: Theme attribute toggle
  // ==========================================================================
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ==========================================================================
  // Effect Hook: Global Spotlight keys listener
  // ==========================================================================
  useEffect(() => {
    const handleGlobalKeys = (e) => {
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

  // ==========================================================================
  // Effect Hook: Render & Update Chart.js Graphic canvases
  // ==========================================================================
  useEffect(() => {
    const isDark = theme === 'dark';
    const textCol = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(60,60,67,0.6)';
    const gridCol = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    
    // Apple Palette Colors
    const colors = {
      blue: '#007AFF',
      purple: '#AF52DE',
      orange: '#FF9500',
      green: '#34C759',
      pink: '#FF2D55',
      teal: '#5AC8FA'
    };

    Chart.defaults.color = textCol;
    Chart.defaults.font.family = '-apple-system, "Plus Jakarta Sans", system-ui, sans-serif';
    Chart.defaults.font.weight = 500;

    // 1. Dashboard Revenue Line Chart
    if (activeTab === 'dashboard' && dashCanvasRef.current) {
      if (chartsInstanceRef.current.dash) chartsInstanceRef.current.dash.destroy();
      const ctx = dashCanvasRef.current.getContext('2d');
      
      const gradBlue = ctx.createLinearGradient(0, 0, 0, 200);
      gradBlue.addColorStop(0, 'rgba(0, 122, 255, 0.25)');
      gradBlue.addColorStop(1, 'rgba(0, 122, 255, 0)');
      
      const gradPurple = ctx.createLinearGradient(0, 0, 0, 200);
      gradPurple.addColorStop(0, 'rgba(175, 82, 222, 0.15)');
      gradPurple.addColorStop(1, 'rgba(175, 82, 222, 0)');

      // Dynamically load chart configurations based on date filter
      let chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let revenueData = [180000, 210000, 195000, 240000, 220000, 280000, 248920];
      let projectionData = [null, null, null, null, null, 280000, 250000, 270000, 290000];
      let yCallback = value => '₹' + (value / 1000) + 'k';

      if (dateFilter === 'today') {
        chartLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
        revenueData = [15000, 32000, 78000, 145000, 198000, 235000, 248920];
        projectionData = [null, null, null, null, 198000, 240000, 260000];
      } else if (dateFilter === '7d') {
        chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        revenueData = [180000, 210000, 195000, 240000, 220000, 280000, 248920];
        projectionData = [null, null, null, null, null, 280000, 290000];
      } else if (dateFilter === '30d') {
        chartLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        revenueData = [1950000, 2100000, 2050000, 2320500];
        projectionData = [null, null, 2050000, 2400000];
        yCallback = value => '₹' + (value / 100000) + 'L';
      } else if (dateFilter === 'ytd') {
        chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        revenueData = [5200000, 5800000, 6400000, 7100000, 7800000, 8420500];
        projectionData = [null, null, null, null, 7800000, 8800000];
        yCallback = value => '₹' + (value / 100000) + 'L';
      }

      chartsInstanceRef.current.dash = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [
            {
              label: 'Revenue',
              data: revenueData,
              borderColor: colors.blue,
              backgroundColor: gradBlue,
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 6
            },
            {
              label: 'AI Projection',
              data: projectionData,
              borderColor: colors.purple,
              backgroundColor: gradPurple,
              fill: true,
              tension: 0.4,
              borderDash: [5, 5],
              borderWidth: 1.5,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: {
              grid: { color: gridCol, drawBorder: false },
              ticks: { callback: yCallback }
            }
          }
        }
      });
    }

    // 2. Sales Analytics Line & Bar Hybrid
    if (activeTab === 'sales' && salesCanvasRef.current) {
      if (chartsInstanceRef.current.sales) chartsInstanceRef.current.sales.destroy();
      const ctx = salesCanvasRef.current.getContext('2d');
      
      // Dynamic data scaling based on date filter
      let scaleFactor = 1.0;
      if (dateFilter === 'today') scaleFactor = 0.03;
      else if (dateFilter === '7d') scaleFactor = 0.22;
      else if (dateFilter === '30d') scaleFactor = 1.0;
      else if (dateFilter === 'ytd') scaleFactor = 6.0;

      const baseSalesChannelDataMap = {
        all: [3536610, 2357740, 1010460, 673640, 505230, 336820],
        shopify: [3536610, 0, 0, 0, 0, 0],
        amazon: [0, 2357740, 0, 0, 0, 0],
        myntra: [0, 0, 1010460, 0, 0, 0],
        blinkit: [0, 0, 0, 673640, 0, 0],
        instamart: [0, 0, 0, 0, 505230, 0],
        flipkart: [0, 0, 0, 0, 0, 336820]
      };

      const salesChannelDataMap = {};
      Object.keys(baseSalesChannelDataMap).forEach(key => {
        salesChannelDataMap[key] = baseSalesChannelDataMap[key].map(val => val * scaleFactor);
      });

      chartsInstanceRef.current.sales = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Shopify', 'Amazon', 'Myntra', 'Blinkit', 'Instamart', 'Flipkart'],
          datasets: [
            {
              label: 'Revenue (₹)',
              type: 'bar',
              data: salesChannelDataMap[selectedSalesChannel] || salesChannelDataMap.all,
              backgroundColor: [colors.blue, colors.orange, colors.pink, colors.yellow, colors.teal, colors.green],
              borderRadius: 8,
              barThickness: 32
            },
            {
              label: 'Conversion Rate %',
              type: 'line',
              data: [4.2, 3.8, 2.9, 8.4, 7.8, 2.1],
              borderColor: colors.purple,
              borderWidth: 2,
              pointBackgroundColor: colors.purple,
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: {
              position: 'left',
              grid: { color: gridCol, drawBorder: false },
              ticks: { callback: value => '₹' + (value >= 100000 ? (value / 100000).toFixed(1) + 'L' : (value / 1000).toFixed(0) + 'k') }
            },
            y1: {
              position: 'right',
              grid: { display: false },
              ticks: { callback: value => value + '%' }
            }
          }
        }
      });
    }

    // 3. Sales Share Donut Chart
    if (activeTab === 'sales' && donutCanvasRef.current) {
      if (chartsInstanceRef.current.donut) chartsInstanceRef.current.donut.destroy();
      const ctx = donutCanvasRef.current.getContext('2d');
      
      // Dynamic slices based on date selection
      let donutData = [42, 28, 12, 8, 6, 4];
      if (dateFilter === 'today') donutData = [25, 30, 15, 10, 12, 8];
      else if (dateFilter === '7d') donutData = [38, 25, 14, 11, 7, 5];
      else if (dateFilter === '30d') donutData = [42, 28, 12, 8, 6, 4];
      else if (dateFilter === 'ytd') donutData = [45, 26, 11, 7, 6, 5];

      chartsInstanceRef.current.donut = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Shopify', 'Amazon', 'Myntra', 'Blinkit', 'Instamart', 'Flipkart'],
          datasets: [{
            data: donutData,
            backgroundColor: [colors.blue, colors.orange, colors.pink, colors.yellow, colors.teal, colors.green],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 8, padding: 12 }
            }
          }
        }
      });
    }

    // 4. Analytics Predictive Forecast
    if (activeTab === 'analytics' && forecastCanvasRef.current) {
      if (chartsInstanceRef.current.forecast) chartsInstanceRef.current.forecast.destroy();
      const ctx = forecastCanvasRef.current.getContext('2d');
      const gradBlue = ctx.createLinearGradient(0, 0, 0, 200);
      gradBlue.addColorStop(0, 'rgba(0, 122, 255, 0.25)');
      gradBlue.addColorStop(1, 'rgba(0, 122, 255, 0)');

      // Dynamic scales for analytics forecast
      let actualData = [5200000, 5800000, 6400000, 7100000, 7800000, 8420500, null, null, null];
      let projectionData = [null, null, null, null, null, 8420500, 9100000, 9800000, 10500000];
      let conservativeData = [null, null, null, null, null, 8420500, 8600000, 8900000, 9200000];
      let yForecastCallback = value => '₹' + (value / 100000) + 'L';

      if (dateFilter === 'today') {
        actualData = [180000, 200000, 210000, 220000, 230000, 248920, null, null, null];
        projectionData = [null, null, null, null, null, 248920, 270000, 290000, 310000];
        conservativeData = [null, null, null, null, null, 248920, 255000, 260000, 270000];
        yForecastCallback = value => '₹' + (value / 1000) + 'k';
      } else if (dateFilter === '7d') {
        actualData = [1200000, 1350000, 1480000, 1610000, 1720000, 1842100, null, null, null];
        projectionData = [null, null, null, null, null, 1842100, 2050000, 2200000, 2400000];
        conservativeData = [null, null, null, null, null, 1842100, 1900000, 1950000, 2000000];
        yForecastCallback = value => '₹' + (value / 100000) + 'L';
      } else if (dateFilter === '30d') {
        actualData = [5200000, 5800000, 6400000, 7100000, 7800000, 8420500, null, null, null];
        projectionData = [null, null, null, null, null, 8420500, 9100000, 9800000, 10500000];
        conservativeData = [null, null, null, null, null, 8420500, 8600000, 8900000, 9200000];
        yForecastCallback = value => '₹' + (value / 100000) + 'L';
      } else if (dateFilter === 'ytd') {
        actualData = [31000000, 35000000, 39000000, 43000000, 47000000, 51240600, null, null, null];
        projectionData = [null, null, null, null, null, 51240600, 55000000, 60000000, 65000000];
        conservativeData = [null, null, null, null, null, 51240600, 52500000, 54000000, 56000000];
        yForecastCallback = value => '₹' + (value / 10000000).toFixed(1) + 'Cr';
      }

      chartsInstanceRef.current.forecast = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun (Current)', 'Jul (AI)', 'Aug (AI)', 'Sep (AI)'],
          datasets: [
            {
              label: 'Actual Revenue',
              data: actualData,
              borderColor: colors.blue,
              backgroundColor: gradBlue,
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4
            },
            {
              label: 'AI Best Case Projection',
              data: projectionData,
              borderColor: colors.green,
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              pointRadius: 0
            },
            {
              label: 'AI Conservative Case',
              data: conservativeData,
              borderColor: colors.orange,
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false } },
            y: {
              grid: { color: gridCol, drawBorder: false },
              ticks: { callback: yForecastCallback }
            }
          }
        }
      });
    }

  }, [activeTab, theme, selectedSalesChannel, dateFilter]);

  // ==========================================================================
  // Search Spotlight Options Configuration
  // ==========================================================================
  const spotlightOptions = [
    { text: 'Go to Dashboard', type: 'navigation', target: 'dashboard', shortcut: '⌘1' },
    { text: 'Go to Sales Analytics', type: 'navigation', target: 'sales', shortcut: '⌘2' },
    { text: 'Go to Unified Orders', type: 'navigation', target: 'orders', shortcut: '⌘3' },
    { text: 'Go to Marketplace Hub', type: 'navigation', target: 'marketplace', shortcut: '⌘4' },
    { text: 'Go to Customers Hub', type: 'navigation', target: 'customers', shortcut: '⌘5' },
    { text: 'Go to WhatsApp Campaigns', type: 'navigation', target: 'whatsapp', shortcut: '⌘6' },
    { text: 'Go to AI Support Agent', type: 'navigation', target: 'support', shortcut: '⌘7' },
    { text: 'Go to Reviews feed', type: 'navigation', target: 'reviews', shortcut: '⌘8' },
    { text: 'Go to Inventory & Stock', type: 'navigation', target: 'inventory', shortcut: '⌘9' },
    { text: 'Go to Content Studio', type: 'navigation', target: 'content', shortcut: '⌘C' },
    { text: 'Go to Founder AI Assistant', type: 'navigation', target: 'founder', shortcut: '⌘F' },
    { text: 'Go to OS Settings', type: 'navigation', target: 'settings', shortcut: '⌘S' },
    
    { text: 'Vitamin C Serum (Stock: 1,375)', type: 'product', target: 'inventory', shortcut: 'SKU' },
    { text: 'Rosewater Face Mist (Low Stock: 37)', type: 'product', target: 'inventory', shortcut: 'SKU' },
    { text: 'Matte Peach Lipstick (Low Stock: 185)', type: 'product', target: 'inventory', shortcut: 'SKU' },
    
    { text: 'Meera Sen (VIP Profile)', type: 'customer', target: 'customers', shortcut: 'LTV: 12.4k' },
    { text: 'Rohan Sharma (Exchange query)', type: 'customer', target: 'customers', shortcut: 'LTV: 4.5k' }
  ];

  const filteredSpotlightOptions = spotlightOptions.filter(item => 
    item.text.toLowerCase().includes(spotlightInput.toLowerCase())
  );

  const selectSpotlightItem = (item) => {
    setSpotlightOpen(false);
    if (item.type === 'navigation' || item.type === 'product') {
      handleSwitchTab(item.target);
    } else if (item.type === 'customer') {
      handleSwitchTab('customers');
      const matched = customers.find(c => item.text.includes(c.name));
      if (matched) setSelectedCustomerId(matched.id);
    }
  };

  // ==========================================================================
  // Unified Table Actions & Dynamic State handlers
  // ==========================================================================
  
  // Orders Module
  const handleInspectOrder = (order) => {
    setInspectorType('order');
    setInspectorData(order);
    setInspectorOpen(true);
  };

  const handleApproveRefund = (orderId) => {
    showToast(`Refund of order ${orderId} initiated successfully via Gateway API.`, 'success');
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, issue: 'normal', fulfillment: 'fulfilled', shipping: 'delivered' } : o));
    setInspectorOpen(false);
  };

  const filteredOrders = orders.filter(ord => {
    const matchesSearch = ord.id.toLowerCase().includes(ordersSearch.toLowerCase()) ||
                          ord.customer.toLowerCase().includes(ordersSearch.toLowerCase()) ||
                          ord.email.toLowerCase().includes(ordersSearch.toLowerCase());
    
    const matchesChannel = orderChannelFilter === 'all' || ord.channel === orderChannelFilter;
    
    let matchesStatus = true;
    if (orderStatusFilter === 'issue') matchesStatus = ord.issue === 'issue';
    else if (orderStatusFilter === 'unfulfilled') matchesStatus = ord.fulfillment === 'unfulfilled';
    else if (orderStatusFilter === 'shipped') matchesStatus = ord.shipping === 'shipped';
    else if (orderStatusFilter === 'delivered') matchesStatus = ord.shipping === 'delivered';

    return matchesSearch && matchesChannel && matchesStatus;
  });

  // Customer Hub Module
  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const filteredCustomersList = customers.filter(cust => {
    const matchesSearch = cust.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          cust.email.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesSegment = customerSegmentFilter === 'all' || cust.segment === customerSegmentFilter;
    return matchesSearch && matchesSegment;
  });

  // WhatsApp Campaigns Module
  const handleLaunchBroadcast = () => {
    if (!broadcastForm.name.trim()) return;
    showToast(`WhatsApp Broadcast campaign "${broadcastForm.name}" successfully launched.`, 'success');
    
    const newCamp = {
      id: `camp-${campaigns.length + 1}`,
      name: broadcastForm.name,
      type: 'Festival Campaigns',
      revenue: '₹0',
      open: '98.2%',
      response: '--',
      conv: '0.0%',
      status: 'Active'
    };

    setCampaigns(prev => [newCamp, ...prev]);
  };

  // AI Support Agent Console Module
  const activeSupportCase = supportCases.find(c => c.id === supportActiveCaseId) || supportCases[0];

  const handleSupportHumanOverride = (caseId) => {
    if (!supportReplyInput.trim()) return;
    
    setSupportCases(prev => prev.map(cs => {
      if (cs.id === caseId) {
        return {
          ...cs,
          thread: [
            ...cs.thread,
            { sender: 'founder-user', msg: `[Human Override] ${supportReplyInput.trim()}`, time: '17:02' }
          ]
        };
      }
      return cs;
    }));

    setSupportReplyInput('');
  };

  const handleEscalateCase = (caseId) => {
    setSupportCases(prev => prev.map(cs => cs.id === caseId ? { ...cs, escalation: 'Human Support Needed' } : cs));
    showToast(`Case ${caseId} successfully handed over to live customer manager queue.`, 'success');
  };

  const handleResolveCase = (caseId) => {
    setSupportCases(prev => prev.map(cs => {
      if (cs.id === caseId) {
        const isCurrentlyOpen = cs.status === 'Open';
        showToast(isCurrentlyOpen ? `Case ${caseId} marked resolved.` : `Case ${caseId} reopened.`, 'success');
        return {
          ...cs,
          status: isCurrentlyOpen ? 'Resolved' : 'Open',
          escalation: isCurrentlyOpen ? 'None' : cs.escalation
        };
      }
      return cs;
    }));
  };

  // Reviews Feed Module
  const filteredReviewsList = reviews.filter(rev => {
    const matchesSearch = rev.customer.toLowerCase().includes(reviewsSearch.toLowerCase()) ||
                          rev.text.toLowerCase().includes(reviewsSearch.toLowerCase());
    const matchesPlatform = reviewsPlatformFilter === 'all' || rev.platform === reviewsPlatformFilter;
    
    let matchesSentiment = true;
    if (reviewsSentimentFilter === 'positive') matchesSentiment = rev.rating >= 4;
    else if (reviewsSentimentFilter === 'neutral') matchesSentiment = rev.rating === 3;
    else if (reviewsSentimentFilter === 'negative') matchesSentiment = rev.rating <= 2;

    return matchesSearch && matchesPlatform && matchesSentiment;
  });

  const handleApproveReviewReply = (revId) => {
    showToast(`Auto-Reply approved and dispatched to review platform API.`, 'success');
    setReviews(prev => prev.map(r => r.id === revId ? { ...r, reply: null } : r));
  };

  // Inventory Stock Module
  const filteredInventoryList = inventory.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          inv.sku.toLowerCase().includes(inventorySearch.toLowerCase());
    
    let matchesLocation = true;
    if (inventoryLocationFilter === 'warehouse') matchesLocation = inv.warehouse > 0;
    else if (inventoryLocationFilter === 'amazon') matchesLocation = inv.amazon > 0;
    else if (inventoryLocationFilter === 'myntra') matchesLocation = inv.myntra > 0;
    else if (inventoryLocationFilter === 'blinkit') matchesLocation = inv.blinkit > 0;
    else if (inventoryLocationFilter === 'instamart') matchesLocation = inv.instamart > 0;

    let matchesStatus = true;
    if (inventoryStatusFilter === 'low') matchesStatus = inv.daysLeft <= 15 && inv.daysLeft > 0;
    else if (inventoryStatusFilter === 'out') matchesStatus = inv.daysLeft === 0;
    else if (inventoryStatusFilter === 'healthy') matchesStatus = inv.daysLeft > 15;

    return matchesSearch && matchesLocation && matchesStatus;
  });

  const handleInventorySubmitPO = (sku, qty) => {
    showToast(`Purchase order PO-2026-${sku} submitted successfully for ${qty} units.`, 'success');
    setInventory(prev => prev.map(i => i.sku === sku ? { ...i, warehouse: i.warehouse + qty, daysLeft: 45 } : i));
  };

  // Content Studio Generator Module
  const handleGenerateContent = () => {
    setGeneratingContent(true);
    setTimeout(() => {
      setGeneratingContent(false);
      setContentOutputVisible(true);
      
      const samples = {
        'instagram-caption': `✨ Dewy, glazed, and completely hydrated. 💦 Meet the Shills Rosewater Face Mist—your skin's new favorite morning cocktail. 🌹 Formulated with organic Damask rose oil and botanical hydrators to lock in skin moisture for 24 hours.
Tap shop link in bio to secure yours. ✨ #CleanBeauty #SkinCareAesthetics #GlowWater #ShillsBeauty`,
        'reels-script': `[VISUAL OPEN: Dewy rosewater spraying in slow motion. Cut to clean skin glow close-up]
Narrator: "Want that clean, dewy glass skin without the heavy layers? Watch this."
[VISUAL: Model holds up Shills Rosewater Mist. Light spray on face]
Narrator: "One spray. That's it. It is organic rose extract infused with skin active hyaluronic base. 🌹"
[VISUAL: Side by side comparison of dry vs hydrated skin]
Narrator: "Get 48% instant moisture boost. Pick it up on Blinkit or our website today."`,
        'ad-copy': `🔥 SCROLL STOPPER: Tired of dry cakey skin by midday?
Our Vitamin C Serum has entered the room. 🌟 Formulated at 15% active L-Ascorbic Acid for maximum brightness and zero stickiness. 
👉 Click 'Shop Now' to get 15% off your first subscription. Free delivery on orders over ₹999.`,
        'product-description': `Elevate your cosmetic ritual with the Matte Peach Lipstick (Glow Edition). 💄
This ultra-luxurious lip styling product blends botanical oils with pure color pigments, providing a rich velvety matte finish that never dehydrates lips. Featuring micro-glimmers for a soft dewy glow.
• Clean & Vegan formulation
• Parabens & cruelty-free
• Long-lasting 12-hour wear`
      };

      setGeneratedContent(samples[contentType] || samples['instagram-caption']);
      showToast("Creative draft generated by Shills AI.", 'success');
    }, 900);
  };

  const handleSendToKanban = () => {
    const newCard = {
      id: `k-${Date.now()}`,
      title: `${contentType.replace('-', ' ').toUpperCase()} Draft`,
      type: 'AI Content'
    };
    setKanbanStack(prev => ({
      ...prev,
      draft: [...prev.draft, newCard]
    }));
    showToast("Draft sent to team approval Kanban queue.", 'success');
  };

  // Founder Assistant Module
  const handleFounderChatSubmit = (queryText = founderInput) => {
    if (!queryText.trim()) return;

    // Add User Message
    const userMsg = { sender: 'founder-user', msg: queryText, time: '17:02' };
    setFounderMessages(prev => [...prev, userMsg]);
    setFounderInput('');

    // AI Response Mocks
    setTimeout(() => {
      let aiResponse = '';
      if (queryText.toLowerCase().includes('drop yesterday')) {
        aiResponse = `📊 <b>Yesterday's Sales Drop Analysis:</b><br/>Yesterday (June 16), aggregate revenue was ₹2.12L, down 14% compared to the daily average of ₹2.48L. <br/><br/>This drop was primarily due to:<br/>1. <b>Amazon Seller Sync Delay:</b> API connection lag delayed ₹38k of sales entries (these synced at 4 AM today).<br/>2. <b>Myntra Stock-out:</b> Our top listing "Matte Peach Lipstick" ran out of stock at Gurgaon dark stores.`;
      } else if (queryText.toLowerCase().includes('profit') || queryText.toLowerCase().includes('profitable')) {
        aiResponse = `💰 <b>Channel Profitability Comparison (L7d):</b><br/>Here is the margin breakdown across storefronts:<br/><br/>Shopify: ₹35.3L gross • 4.2x ROAS • <b>58% Net Margin</b><br/>Amazon: ₹23.5L gross • 5.1x ROAS • <b>52% Net Margin</b><br/>Blinkit: ₹6.7L gross • -- ROAS • <b>48% Net Margin</b>`;
      } else if (queryText.toLowerCase().includes('restock') || queryText.toLowerCase().includes('stock')) {
        aiResponse = `⚠️ <b>Urgent Stock Shortages detected:</b><br/>• <b>Rosewater Face Mist 100ml:</b> 1 day remaining (Only 8 units in Delhi Warehouse). Reorder recommended: 1,200 units.<br/>• <b>Matte Peach Lipstick:</b> 5 days remaining (Myntra stock-out). Reorder recommended: 800 units.`;
      } else if (queryText.toLowerCase().includes('sentiment') || queryText.toLowerCase().includes('customer')) {
        aiResponse = `✨ <b>Customer Sentiment Summary:</b><br/>• <b>Positive feedback:</b> 88%. Strong customer praise for Vitamin C Serum brightening efficacy and Lavender Gel.<br/>• <b>Negative feedback:</b> 4%. High density of reviews complain about package leaking in Instamart/Blinkit quick commerce deliveries. Tamper-evident seals recommended.`;
      } else {
        aiResponse = `🤖 Shills Growth OS scanned your active databases. <br/>No anomalies detected for query: "${queryText}". Aggregate run rate remains healthy at ₹84.2L/month. Can I pull specific order timelines for you?`;
      }

      setFounderMessages(prev => [...prev, { sender: 'ai', msg: aiResponse, time: '17:02' }]);
    }, 850);
  };

  // ==========================================================================
  // React Markup Render
  // ==========================================================================
  const currentMetrics = METRICS_BY_DATE[dateFilter] || METRICS_BY_DATE['7d'];

  const getSalesChannelMetrics = (channel) => {
    const rawRev = parseFloat(currentMetrics.revenueToday.replace(/₹|,/g, '')) || 0;
    const rawOrders = parseFloat(currentMetrics.ordersToday.replace(/,/g, '')) || 0;
    
    const channelPercentages = {
      all: 100,
      shopify: 42,
      amazon: 28,
      myntra: 12,
      blinkit: 8,
      instamart: 6,
      flipkart: 4
    };

    const percent = channelPercentages[channel] || 100;
    const revenue = Math.round(rawRev * (percent / 100));
    const orders = Math.round(rawOrders * (percent / 100));
    const aov = orders > 0 ? Math.round(revenue / orders) : 0;

    const conversionRates = {
      all: '3.45%', shopify: '4.20%', amazon: '3.80%', myntra: '2.90%', blinkit: '8.40%', instamart: '7.80%', flipkart: '2.10%'
    };
    const roas = {
      all: '4.2x', shopify: '4.2x', amazon: '5.1x', myntra: '3.2x', blinkit: '3.8x', instamart: '3.5x', flipkart: '2.8x'
    };
    const returns = {
      all: '4.8%', shopify: '2.5%', amazon: '5.6%', myntra: '14.8%', blinkit: '0.8%', instamart: '1.2%', flipkart: '8.4%'
    };
    const repeat = {
      all: '34.2%', shopify: '38.5%', amazon: '25.4%', myntra: '28.1%', blinkit: '45.2%', instamart: '42.1%', flipkart: '18.6%'
    };

    return {
      revenue: '₹' + revenue.toLocaleString('en-IN'),
      orders: orders.toLocaleString('en-IN'),
      aov: '₹' + aov.toLocaleString('en-IN'),
      conversion: conversionRates[channel],
      roas: roas[channel],
      returns: returns[channel],
      repeat: repeat[channel]
    };
  };

  const getChannelRevenue = (channel, percent) => {
    const rawValStr = currentMetrics.revenueToday.replace(/₹|,/g, '');
    const rawVal = parseFloat(rawValStr) || 0;
    const channelVal = Math.round(rawVal * (percent / 100));
    return '₹' + channelVal.toLocaleString('en-IN');
  };

  const getPeriodLabel = (titleType) => {
    if (titleType === 'revenue') {
      switch (dateFilter) {
        case 'today': return "Today's Revenue";
        case '7d': return "7D Revenue";
        case '30d': return "30D Revenue";
        case 'ytd': return "YTD Revenue";
        default: return "Revenue";
      }
    } else if (titleType === 'orders') {
      switch (dateFilter) {
        case 'today': return "Orders Today";
        case '7d': return "Orders (7D)";
        case '30d': return "Orders (30D)";
        case 'ytd': return "Orders (YTD)";
        default: return "Orders";
      }
    }
    return '';
  };

  const getPeriodLabelSimple = () => {
    switch (dateFilter) {
      case 'today': return 'Today';
      case '7d': return 'L7D';
      case '30d': return 'L30D';
      case 'ytd': return 'YTD';
      default: return 'Period';
    }
  };
  const channelMetrics = getSalesChannelMetrics(selectedSalesChannel);
  const amazonMetrics = getSalesChannelMetrics('amazon');
  const myntraMetrics = getSalesChannelMetrics('myntra');
  const blinkitMetrics = getSalesChannelMetrics('blinkit');
  const flipkartMetrics = getSalesChannelMetrics('flipkart');
  const instamartMetrics = getSalesChannelMetrics('instamart');
  
  return (
    <div className="app-container">
      
      {/* Background Layer (Apple Fluid Glass Glows) */}
      <div className="ambient-glow bg-glow-1"></div>
      <div className="ambient-glow bg-glow-2"></div>
      <div className="ambient-glow bg-glow-3"></div>

      {/* Global Toast Render */}
      <div id="toast-container" style={{ position: 'fixed', top: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: '9999' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast-notif liquid-card-sm badge-${t.type === 'error' ? 'red' : t.type === 'success' ? 'green' : 'blue'}`} style={{ boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(20px)', background: 'var(--glass-fill)', outline: '1px solid var(--glass-border)', color: 'var(--label-primary)' }}>
            {t.type === 'success' ? <CheckCircle size={14} /> : t.type === 'error' ? <AlertTriangle size={14} /> : <Smile size={14} />}
            <span>{t.message}</span>
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
            <div className="sidebar-header" style={{ 
              height: '80px', 
              padding: '16px', 
              boxSizing: 'border-box', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderBottom: '1px solid var(--separator)'
            }}>
              <div className="brand-logo" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%',
                height: '100%'
              }}>
                <div className="logo-orb-collapsed">
                  <div className="logo-orb"><div className="logo-inner">S</div></div>
                </div>
                <div className="brand-logo-expanded" style={{
                  width: '100%',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <img 
                    src="/logo.png" 
                    alt="Shills Professional" 
                    style={{ 
                      height: '44px', 
                      width: 'auto', 
                      display: 'block', 
                      filter: theme === 'light' ? 'invert(1)' : 'none',
                      mixBlendMode: theme === 'light' ? 'multiply' : 'screen'
                    }} 
                  />
                </div>
              </div>
            </div>

            <nav className="sidebar-nav">
              <div className="nav-section-label">Core</div>
              <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleSwitchTab('dashboard')}>
                <LayoutDashboard size={16} /><span>Dashboard</span>
              </div>
              <div className={`nav-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => handleSwitchTab('sales')}>
                <LineChart size={16} /><span>Sales & Revenue</span>
              </div>
              <div className={`nav-item ${activeTab === 'marketplace' ? 'active' : ''}`} onClick={() => handleSwitchTab('marketplace')}>
                <ShoppingBag size={16} /><span>Marketplace Hub</span>
              </div>
              <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => handleSwitchTab('analytics')}>
                <PieChart size={16} /><span>Analytics</span>
              </div>

              <div className="nav-section-label">Operations</div>
              <div className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => handleSwitchTab('orders')}>
                <ShoppingCart size={16} /><span>Orders</span>
                <span className="badge badge-orange badge-live count-badge">3</span>
              </div>
              <div className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => handleSwitchTab('inventory')}>
                <Package size={16} /><span>Inventory</span>
                <span className="badge badge-red count-badge">12</span>
              </div>

              <div className="nav-section-label">Marketing</div>
              <div className={`nav-item ${activeTab === 'whatsapp' ? 'active' : ''}`} onClick={() => handleSwitchTab('whatsapp')}>
                <MessageSquare size={16} /><span>WhatsApp Marketing</span>
              </div>
              <div className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => handleSwitchTab('reviews')}>
                <Star size={16} /><span>Reviews & Reputation</span>
              </div>
              <div className={`nav-item ${activeTab === 'content' ? 'active' : ''}`} onClick={() => handleSwitchTab('content')}>
                <Sparkles size={16} /><span>Content Studio</span>
              </div>

              <div className="nav-section-label">Customers & AI</div>
              <div className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => handleSwitchTab('customers')}>
                <Users size={16} /><span>Customers</span>
              </div>
              <div className={`nav-item ${activeTab === 'support' ? 'active' : ''}`} onClick={() => handleSwitchTab('support')}>
                <Bot size={16} /><span>AI Support Agent</span>
                <span className="badge badge-blue count-badge">4</span>
              </div>
              <div className={`nav-item ${activeTab === 'founder' ? 'active' : ''}`} onClick={() => handleSwitchTab('founder')}>
                <UserCheck size={16} /><span>Founder Assistant</span>
              </div>

              <div className="nav-section-label">System</div>
              <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleSwitchTab('settings')}>
                <SettingsIcon size={16} /><span>Settings</span>
              </div>
            </nav>

            <div className="sidebar-footer">
              <div className="theme-switcher">
                <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} title="Light Theme"><Sun size={14} /></button>
                <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} title="Dark Theme"><Moon size={14} /></button>
              </div>
              
              <div className="user-profile">
                <div className="avatar"><span>AM</span><div className="status-indicator online"></div></div>
                <div className="user-details">
                  <span className="user-name">Apoorv Mehta</span>
                  <span className="user-role">Founder</span>
                </div>
                <button className="btn-icon" onClick={() => { setIsLoggedIn(false); showToast('Logged out of Shills Growth OS.', 'info'); }} title="System Logout"><LogOut size={14} /></button>
              </div>

              <div className="scalepods-footer" style={{ textAlign: 'center', fontSize: '9px', color: 'var(--label-tertiary)', padding: '10px 0 4px', borderTop: '1px solid var(--separator)', marginTop: '8px', letterSpacing: '0.05em' }}>
                Powered by <span style={{ fontWeight: '600', color: 'var(--blue)' }}>ScalePods</span>
              </div>
            </div>
          </aside>

      {/* Main Workspace */}
      <div className="main-workspace">
        <header className="app-header">
          <div className="header-left">
            <button className="menu-toggle-btn" onClick={() => setMobileSidebarOpen(prev => !prev)} title="Toggle Navigation">
              <Menu size={18} />
            </button>
            <div className="navigation-controls">
              <button className="nav-ctrl-btn" onClick={handleHistoryBack} title="Back"><ChevronLeft size={16} /></button>
              <button className="nav-ctrl-btn" onClick={handleHistoryForward} title="Forward"><ChevronRight size={16} /></button>
            </div>
            <div className="breadcrumb">
              <span className="breadcrumb-parent">Overview</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-active" style={{ textTransform: 'capitalize' }}>{activeTab}</span>
            </div>
          </div>

          <div className="header-center">
            <div className="search-spotlight-trigger" onClick={() => setSpotlightOpen(true)}>
              <Search size={14} /><span>Search anything... (⌘K)</span>
            </div>
          </div>

          <div className="header-right">
            <div className="badge badge-live"><span>Live Sync</span></div>
            <div className="date-selector-wrapper">
              <Calendar size={14} />
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="header-select">
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>

            <button className="btn-icon header-btn" onClick={() => showToast('No new notifications today.', 'info')} title="Notifications">
              <Bell size={14} /><span className="notification-indicator"></span>
            </button>

            <div className="system-status-indicator" title="All storefront channels active"><CheckCircle size={18} className="status-success-icon" /></div>
          </div>
        </header>

        <main className="content-body">
          
          {/* ============================================== */}
          {/* TAB 1: EXECUTIVE DASHBOARD (HOME) */}
          {/* ============================================== */}
          {activeTab === 'dashboard' && (
            <section className="tab-pane active">
              <div className="metrics-grid select-none">
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' }}>
                  <span className="label">{getPeriodLabel('revenue')}</span>
                  <span className="value">{currentMetrics.revenueToday}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> {currentMetrics.trends.revenueToday}</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' }}>
                  <span className="label">Monthly Revenue</span>
                  <span className="value">{currentMetrics.revenueMonthly}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> {currentMetrics.trends.revenueMonthly}</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' }}>
                  <span className="label">{getPeriodLabel('orders')}</span>
                  <span className="value">{currentMetrics.ordersToday}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> {currentMetrics.trends.ordersToday}</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--teal)' }}>
                  <span className="label">Average Order Value</span>
                  <span className="value">{currentMetrics.aov}</span>
                  <span className={`trend ${currentMetrics.trends.aov.startsWith('-') ? 'down' : 'up'}`}>
                    {currentMetrics.trends.aov.startsWith('-') ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                    {currentMetrics.trends.aov}
                  </span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' }}>
                  <span className="label">Repeat Purchase Rate</span>
                  <span className="value">{currentMetrics.repeatPurchase}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> {currentMetrics.trends.repeatPurchase}</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--pink)' }}>
                  <span className="label">Cart Recovery Revenue</span>
                  <span className="value">{currentMetrics.cartRecovery}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> {currentMetrics.trends.cartRecovery}</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--yellow)' }}>
                  <span className="label">CSAT Score</span>
                  <span className="value">{currentMetrics.csat}<span className="metric-sub">/5</span></span>
                  <span className="trend up"><ArrowUpRight size={12} /> {currentMetrics.trends.csat}</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--indigo)' }}>
                  <span className="label">Inventory Health Score</span>
                  <span className="value">{currentMetrics.inventoryHealth}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> {currentMetrics.trends.inventoryHealth}</span>
                </div>
              </div>

              {/* AI Briefing */}
              <div className="ai-insights-strip liquid-card">
                <div className="ai-header">
                  <div className="ai-logo"><Sparkles size={16} /></div>
                  <div className="ai-title-details">
                    <span className="ai-title">Founder Intelligence Briefing</span>
                    <span className="ai-subtitle">AI Insights generated 4 minutes ago</span>
                  </div>
                </div>
                <div className="insights-scroll-container">
                  <div className="insight-pill">
                    <span className="badge badge-green"><TrendingUp size={12} /> Amazon Up</span>
                    <span className="insight-text">Amazon sales are up 18% this week following Lip Tint TikTok virality.</span>
                  </div>
                  <div className="insight-pill">
                    <span className="badge badge-red"><AlertTriangle size={12} /> Low Stock</span>
                    <span className="insight-text">12 products (incl. Rosewater Mist) will go out of stock within 7 days. RESTOCK NOW.</span>
                  </div>
                  <div className="insight-pill">
                    <span className="badge badge-purple"><MessageSquare size={12} /> Cart Recovery</span>
                    <span className="insight-text">WhatsApp cart recovery generated ₹1.2L this month (+14.2% conversion recovery).</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <div className="liquid-card dashboard-chart-card">
                    <div className="card-header-actions">
                      <div className="card-title-group">
                        <span className="card-title">Revenue Trend & Projection</span>
                        <span className="card-subtitle">Aggregated multi-channel revenue analytics</span>
                      </div>
                    </div>
                    <div className="chart-wrapper">
                      <canvas ref={dashCanvasRef}></canvas>
                    </div>
                  </div>

                  {/* Channel Breakdown */}
                  <div className="liquid-card mt-24">
                    <div className="card-header-actions">
                      <div className="card-title-group">
                        <span className="card-title">Channel Breakdown</span>
                        <span className="card-subtitle">Real-time revenue split across storefronts</span>
                      </div>
                      <button className="btn-secondary btn-sm" onClick={() => handleSwitchTab('sales')}>Channel Details</button>
                    </div>
                    <div className="channel-row-grid">
                      <div className="channel-row-item">
                        <div className="channel-info">
                          <div className="channel-brand-icon shopify-color">S</div>
                          <div className="channel-meta"><span className="channel-name">Shopify Store</span><span className="channel-domain">shillsbeauty.com</span></div>
                        </div>
                        <div className="channel-progress-wrapper">
                          <div className="progress-bar-container"><div className="progress-bar" style={{ width: '42%', background: 'var(--indigo)' }}></div></div>
                          <span className="progress-percent">42%</span>
                        </div>
                        <div className="channel-metrics"><span className="channel-rev">{getChannelRevenue('shopify', 42)}</span><span className="badge badge-green">+24.5%</span></div>
                      </div>

                      <div className="channel-row-item">
                        <div className="channel-info">
                          <div className="channel-brand-icon amazon-color">A</div>
                          <div className="channel-meta"><span className="channel-name">Amazon India</span><span className="channel-domain">Shills Global Store</span></div>
                        </div>
                        <div className="channel-progress-wrapper">
                          <div className="progress-bar-container"><div className="progress-bar" style={{ width: '28%', background: 'var(--orange)' }}></div></div>
                          <span className="progress-percent">28%</span>
                        </div>
                        <div className="channel-metrics"><span className="channel-rev">{getChannelRevenue('amazon', 28)}</span><span className="badge badge-green">+18.2%</span></div>
                      </div>

                      <div className="channel-row-item">
                        <div className="channel-info">
                          <div className="channel-brand-icon myntra-color">M</div>
                          <div className="channel-meta"><span className="channel-name">Myntra Store</span><span className="channel-domain">Shills Beauty</span></div>
                        </div>
                        <div className="channel-progress-wrapper">
                          <div className="progress-bar-container"><div className="progress-bar" style={{ width: '12%', background: 'var(--pink)' }}></div></div>
                          <span className="progress-percent">12%</span>
                        </div>
                        <div className="channel-metrics"><span className="channel-rev">{getChannelRevenue('myntra', 12)}</span><span className="badge badge-red">-2.4%</span></div>
                      </div>

                      <div className="channel-row-item">
                        <div className="channel-info">
                          <div className="channel-brand-icon blinkit-color">B</div>
                          <div className="channel-meta"><span className="channel-name">Blinkit pod</span><span className="channel-domain">Quick Commerce</span></div>
                        </div>
                        <div className="channel-progress-wrapper">
                          <div className="progress-bar-container"><div className="progress-bar" style={{ width: '8%', background: 'var(--yellow)' }}></div></div>
                          <span className="progress-percent">8%</span>
                        </div>
                        <div className="channel-metrics"><span className="channel-rev">{getChannelRevenue('blinkit', 8)}</span><span className="badge badge-green">+34.8%</span></div>
                      </div>

                      <div className="channel-row-item">
                        <div className="channel-info">
                          <div className="channel-brand-icon instamart-color">I</div>
                          <div className="channel-meta"><span className="channel-name">Instamart Pod</span><span className="channel-domain">Swiggy IM</span></div>
                        </div>
                        <div className="channel-progress-wrapper">
                          <div className="progress-bar-container"><div className="progress-bar" style={{ width: '6%', background: 'var(--teal)' }}></div></div>
                          <span className="progress-percent">6%</span>
                        </div>
                        <div className="channel-metrics"><span className="channel-rev">{getChannelRevenue('instamart', 6)}</span><span className="badge badge-green">+28.4%</span></div>
                      </div>

                      <div className="channel-row-item">
                        <div className="channel-info">
                          <div className="channel-brand-icon flipkart-color">F</div>
                          <div className="channel-meta"><span className="channel-name">Flipkart Assured</span><span className="channel-domain">Shills cosmetics</span></div>
                        </div>
                        <div className="channel-progress-wrapper">
                          <div className="progress-bar-container"><div className="progress-bar" style={{ width: '4%', background: 'var(--green)' }}></div></div>
                          <span className="progress-percent">4%</span>
                        </div>
                        <div className="channel-metrics"><span className="channel-rev">{getChannelRevenue('flipkart', 4)}</span><span className="badge badge-green">+5.2%</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dashboard-right">
                  {/* Stock Alerts */}
                  <div className="liquid-card mb-24">
                    <div className="card-header-actions">
                      <div className="card-title-group">
                        <span className="card-title">Low Stock Alerts</span>
                        <span className="card-subtitle">Critical warehouse shortages</span>
                      </div>
                    </div>
                    <div className="stock-alerts-list">
                      <div className="alert-item">
                        <div className="alert-meta"><span className="alert-prod-name">Rosewater Face Mist 100ml</span><span className="alert-location">Blinkit Gurgaon Hub</span></div>
                        <div className="alert-qty-group"><span className="alert-qty badge badge-red">14 left</span><span className="alert-days red-txt">2 days left</span></div>
                      </div>
                      <div className="alert-item">
                        <div className="alert-meta"><span className="alert-prod-name">Vitamin C Serum 30ml</span><span className="alert-location">Main Warehouse</span></div>
                        <div className="alert-qty-group"><span className="alert-qty badge badge-orange">112 left</span><span className="alert-days orange-txt">5 days left</span></div>
                      </div>
                    </div>
                  </div>

                  {/* support alerts */}
                  <div className="liquid-card">
                    <div className="card-header-actions">
                      <div className="card-title-group">
                        <span className="card-title">AI Support Escalations</span>
                        <span className="card-subtitle">Urgent review needed</span>
                      </div>
                    </div>
                    <div className="support-alerts-list">
                      {supportCases.filter(c => c.escalation !== 'None').map(c => (
                        <div key={c.id} className="support-alert-item">
                          <div className="sup-meta"><span className="sup-name">{c.customer}</span><span className="badge badge-blue">{c.channel.toUpperCase()}</span></div>
                          <p className="sup-msg">"{c.msg}"</p>
                          <div className="sup-action">
                            <span className="badge badge-red">{c.escalation}</span>
                            <button className="btn-primary btn-sm" onClick={() => { handleSwitchTab('support'); setSupportActiveCaseId(c.id); }}>Reply Override</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 2: SALES & REVENUE MODULE */}
          {/* ============================================== */}
          {activeTab === 'sales' && (
            <section className="tab-pane active">
              <div className="channel-pill-selector">
                {['all', 'shopify', 'amazon', 'flipkart', 'myntra', 'blinkit', 'instamart'].map(c => (
                  <button key={c} className={`channel-pill ${selectedSalesChannel === c ? 'active' : ''}`} onClick={() => setSelectedSalesChannel(c)}>
                    <span className={`channel-indicator ${c}-color`}></span>{c.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="sales-widgets-grid mt-24">
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' }}>
                  <span className="label">Revenue</span>
                  <span className="value">{channelMetrics.revenue}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> +18.2%</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' }}>
                  <span className="label">Total Orders</span>
                  <span className="value">{channelMetrics.orders}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> +10.5%</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' }}>
                  <span className="label">Conversion Rate</span>
                  <span className="value">{channelMetrics.conversion}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> +0.4%</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--teal)' }}>
                  <span className="label">Average Order Value</span>
                  <span className="value">{channelMetrics.aov}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> +2.4%</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' }}>
                  <span className="label">ROAS</span>
                  <span className="value">{channelMetrics.roas}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> +0.6x</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' }}>
                  <span className="label">Refund & Return Rate</span>
                  <span className="value">{channelMetrics.returns}</span>
                  <span className="trend down"><ArrowDownLeft size={12} /> -0.8%</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--yellow)' }}>
                  <span className="label">Repeat Customer %</span>
                  <span className="value">{channelMetrics.repeat}</span>
                  <span className="trend up"><ArrowUpRight size={12} /> +1.5%</span>
                </div>
              </div>

              <div className="dashboard-grid mt-24">
                <div className="dashboard-left">
                  <div className="liquid-card dashboard-chart-card">
                    <div className="card-header-actions">
                      <span className="card-title">Revenue & Orders comparison ({selectedSalesChannel.toUpperCase()})</span>
                    </div>
                    <div className="chart-wrapper">
                      <canvas ref={salesCanvasRef}></canvas>
                    </div>
                  </div>
                </div>
                <div className="dashboard-right">
                  <div className="liquid-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header-actions">
                      <span className="card-title">Channel share contribution (L7d)</span>
                    </div>
                    <div className="chart-wrapper flex-center" style={{ flexGrow: 1 }}>
                      <canvas ref={donutCanvasRef}></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 3: ORDERS MODULE */}
          {/* ============================================== */}
          {activeTab === 'orders' && (
            <section className="tab-pane active">
              <div className="liquid-card">
                <div className="table-header-controls">
                  <div className="search-box-wrapper">
                    <Search size={14} />
                    <input type="text" className="input table-search" value={ordersSearch} onChange={(e) => setOrdersSearch(e.target.value)} placeholder="Search order ID, customer name..." />
                  </div>
                  <div className="filters-row">
                    <select value={orderChannelFilter} onChange={(e) => setOrderChannelFilter(e.target.value)} className="input input-sm">
                      <option value="all">All Channels</option>
                      <option value="shopify">Shopify</option>
                      <option value="amazon">Amazon</option>
                      <option value="myntra">Myntra</option>
                      <option value="blinkit">Blinkit</option>
                    </select>
                    <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="input input-sm">
                      <option value="all">All Statuses</option>
                      <option value="unfulfilled">Unfulfilled</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="issue">Has Warning</option>
                    </select>
                    <button className="btn-primary" onClick={() => showToast('Exported 420 orders to CSV successfully', 'success')}><Download size={14} /> Export CSV</button>
                  </div>
                </div>

                <div className="table-scroll-container mt-16">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date & Time</th>
                        <th>Channel</th>
                        <th>Customer</th>
                        <th>Order Value</th>
                        <th>Fulfillment</th>
                        <th>COD Status</th>
                        <th>Shipping</th>
                        <th>AI Monitor</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(ord => (
                        <tr key={ord.id}>
                          <td className="font-semibold">{ord.id}</td>
                          <td>{ord.datetime}</td>
                          <td><span className="badge badge-grey">{ord.channel.toUpperCase()}</span></td>
                          <td>{ord.customer}</td>
                          <td className="font-semibold">₹{ord.value.toLocaleString('en-IN')}</td>
                          <td><span className={`badge ${ord.fulfillment === 'fulfilled' ? 'badge-green' : 'badge-orange'}`}>{ord.fulfillment}</span></td>
                          <td><span className={`badge ${ord.cod === 'Prepaid' ? 'badge-blue' : 'badge-grey'}`}>{ord.cod}</span></td>
                          <td><span className={`badge ${ord.shipping === 'delivered' ? 'badge-green' : ord.shipping === 'shipped' ? 'badge-blue' : 'badge-orange'}`}>{ord.shipping}</span></td>
                          <td>
                            {ord.issue === 'issue' ? <span className="badge badge-red"><AlertTriangle size={10} /> Warning</span> : <span className="badge badge-green"><CheckCircle size={10} /> Normal</span>}
                          </td>
                          <td><button className="btn-secondary btn-sm" onClick={() => handleInspectOrder(ord)}>Inspect</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 4: MARKETPLACE HUB */}
          {/* ============================================== */}
          {activeTab === 'marketplace' && (
            <section className="tab-pane active">
              <div className="marketplace-grid">
                {/* Amazon India */}
                <div className="marketplace-card liquid-card">
                  <div className="market-brand-header">
                    <div className="brand-badge amazon-color">A</div>
                    <div className="brand-details">
                      <span className="m-title">Amazon India Store</span>
                      <span className="m-status badge badge-green"><Check size={12} /> Buy Box Secured</span>
                    </div>
                    <span className="radial-score green-txt">9.4/10</span>
                  </div>
                  <div className="market-quick-metrics mt-16">
                    <div className="mq-box"><span className="mq-lbl">Revenue ({getPeriodLabelSimple()})</span><span className="mq-val">{amazonMetrics.revenue}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Orders Placed</span><span className="mq-val">{amazonMetrics.orders}</span></div>
                    <div className="mq-box"><span className="mq-lbl">ROAS Target</span><span className="mq-val green-txt">{amazonMetrics.roas}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Returns %</span><span className="mq-val red-txt">{amazonMetrics.returns}</span></div>
                  </div>
                  <div className="market-meta-details mt-16">
                    <div className="meta-row"><span className="meta-lbl">Top Product:</span><span className="meta-val">Vitamin C Serum</span></div>
                    <div className="meta-row"><span className="meta-lbl">Inventory Health:</span><span className="meta-val badge badge-orange">1 Low SKU</span></div>
                    <div className="meta-row"><span className="meta-lbl">Buy Box Status:</span><span className="meta-val">98% secured</span></div>
                  </div>
                  <div className="market-card-footer mt-16">
                    <button className="btn-secondary btn-sm flex-grow" onClick={() => showToast('Listing auditor started for Amazon Seller Central.')}>Audit Listings</button>
                    <button className="btn-primary btn-sm" onClick={() => showToast('Amazon APIs synced successfully.', 'success')}><RefreshCw size={12} /> Sync</button>
                  </div>
                </div>

                {/* Myntra Store */}
                <div className="marketplace-card liquid-card">
                  <div className="market-brand-header">
                    <div className="brand-badge myntra-color">M</div>
                    <div className="brand-details">
                      <span className="m-title">Myntra Brand Store</span>
                      <span className="m-status badge badge-green"><Check size={12} /> PPMP Storefront Active</span>
                    </div>
                    <span className="radial-score green-txt">9.0/10</span>
                  </div>
                  <div className="market-quick-metrics mt-16">
                    <div className="mq-box"><span className="mq-lbl">Revenue ({getPeriodLabelSimple()})</span><span className="mq-val">{myntraMetrics.revenue}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Orders Placed</span><span className="mq-val">{myntraMetrics.orders}</span></div>
                    <div className="mq-box"><span className="mq-lbl">ROAS Target</span><span className="mq-val green-txt">{myntraMetrics.roas}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Returns %</span><span className="mq-val red-txt">{myntraMetrics.returns}</span></div>
                  </div>
                  <div className="market-meta-details mt-16">
                    <div className="meta-row"><span className="meta-lbl">Top Product:</span><span className="meta-val">Matte Peach Lipstick</span></div>
                    <div className="meta-row"><span className="meta-lbl">Inventory Health:</span><span className="meta-val badge badge-red">2 Stock-outs</span></div>
                  </div>
                  <div className="market-card-footer mt-16">
                    <button className="btn-secondary btn-sm flex-grow" onClick={() => showToast('Listing auditor started for Myntra PPMP portal.')}>Audit Listings</button>
                    <button className="btn-primary btn-sm" onClick={() => showToast('Myntra catalog sync successfully concluded.', 'success')}><RefreshCw size={12} /> Sync</button>
                  </div>
                </div>

                {/* Blinkit */}
                <div className="marketplace-card liquid-card">
                  <div className="market-brand-header">
                    <div className="brand-badge blinkit-color">B</div>
                    <div className="brand-details">
                      <span className="m-title">Blinkit Q-Commerce</span>
                      <span className="m-status badge badge-green"><Check size={12} /> 10-Min Delivery OK</span>
                    </div>
                    <span className="radial-score green-txt">9.8/10</span>
                  </div>
                  <div className="market-quick-metrics mt-16">
                    <div className="mq-box"><span className="mq-lbl">Revenue ({getPeriodLabelSimple()})</span><span className="mq-val">{blinkitMetrics.revenue}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Orders Placed</span><span className="mq-val">{blinkitMetrics.orders}</span></div>
                    <div className="mq-box"><span className="mq-lbl">ROAS Target</span><span className="mq-val green-txt">{blinkitMetrics.roas}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Returns %</span><span className="mq-val green-txt">{blinkitMetrics.returns}</span></div>
                  </div>
                  <div className="market-meta-details mt-16">
                    <div className="meta-row"><span className="meta-lbl">Top Product:</span><span className="meta-val">Rosewater Face Mist</span></div>
                    <div className="meta-row"><span className="meta-lbl">Dark Store Coverage:</span><span className="meta-val">120 active pods</span></div>
                  </div>
                  <div className="market-card-footer mt-16">
                    <button className="btn-secondary btn-sm flex-grow" onClick={() => showToast('Blinkit stock optimization model active.')}>Stock Monitor</button>
                    <button className="btn-primary btn-sm" onClick={() => showToast('Blinkit storefront inventory sync finalized.', 'success')}><RefreshCw size={12} /> Sync</button>
                  </div>
                </div>

                {/* Flipkart Store */}
                <div className="marketplace-card liquid-card">
                  <div className="market-brand-header">
                    <div className="brand-badge flipkart-color">F</div>
                    <div className="brand-details">
                      <span className="m-title">Flipkart Store</span>
                      <span className="m-status badge badge-green"><Check size={12} /> Flipkart Plus Active</span>
                    </div>
                    <span className="radial-score green-txt">8.8/10</span>
                  </div>
                  <div className="market-quick-metrics mt-16">
                    <div className="mq-box"><span className="mq-lbl">Revenue ({getPeriodLabelSimple()})</span><span className="mq-val">{flipkartMetrics.revenue}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Orders Placed</span><span className="mq-val">{flipkartMetrics.orders}</span></div>
                    <div className="mq-box"><span className="mq-lbl">ROAS Target</span><span className="mq-val green-txt">{flipkartMetrics.roas}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Returns %</span><span className="mq-val red-txt">{flipkartMetrics.returns}</span></div>
                  </div>
                  <div className="market-meta-details mt-16">
                    <div className="meta-row"><span className="meta-lbl">Top Product:</span><span className="meta-val">Vitamin C Serum</span></div>
                    <div className="meta-row"><span className="meta-lbl">Seller Tier:</span><span className="meta-val">Gold Seller</span></div>
                  </div>
                  <div className="market-card-footer mt-16">
                    <button className="btn-secondary btn-sm flex-grow" onClick={() => showToast('Listing auditor started for Flipkart Seller hub.')}>Audit Listings</button>
                    <button className="btn-primary btn-sm" onClick={() => showToast('Flipkart sync complete.', 'success')}><RefreshCw size={12} /> Sync</button>
                  </div>
                </div>

                {/* Instamart Store */}
                <div className="marketplace-card liquid-card">
                  <div className="market-brand-header">
                    <div className="brand-badge instamart-color">I</div>
                    <div className="brand-details">
                      <span className="m-title">Swiggy Instamart</span>
                      <span className="m-status badge badge-green"><Check size={12} /> IM Brand Hub OK</span>
                    </div>
                    <span className="radial-score green-txt">9.6/10</span>
                  </div>
                  <div className="market-quick-metrics mt-16">
                    <div className="mq-box"><span className="mq-lbl">Revenue ({getPeriodLabelSimple()})</span><span className="mq-val">{instamartMetrics.revenue}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Orders Placed</span><span className="mq-val">{instamartMetrics.orders}</span></div>
                    <div className="mq-box"><span className="mq-lbl">ROAS Target</span><span className="mq-val green-txt">{instamartMetrics.roas}</span></div>
                    <div className="mq-box"><span className="mq-lbl">Returns %</span><span className="mq-val green-txt">{instamartMetrics.returns}</span></div>
                  </div>
                  <div className="market-meta-details mt-16">
                    <div className="meta-row"><span className="meta-lbl">Top Product:</span><span className="meta-val">Lavender Gel</span></div>
                    <div className="meta-row"><span className="meta-lbl">Dark Store Coverage:</span><span className="meta-val">90 active pods</span></div>
                  </div>
                  <div className="market-card-footer mt-16">
                    <button className="btn-secondary btn-sm flex-grow" onClick={() => showToast('Instamart catalog auditor initiated.')}>Monitor Catalog</button>
                    <button className="btn-primary btn-sm" onClick={() => showToast('Instamart sync complete.', 'success')}><RefreshCw size={12} /> Sync</button>
                  </div>
                </div>
              </div>
            </section>
          )}


          {/* ============================================== */}
          {/* TAB 5: CUSTOMERS HUB */}
          {/* ============================================== */}
          {activeTab === 'customers' && (
            <section className="tab-pane active">
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <div className="liquid-card">
                    <div className="table-header-controls">
                      <div className="search-box-wrapper">
                        <Search size={14} />
                        <input type="text" className="input table-search" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search customer by name or email..." />
                      </div>
                      <select value={customerSegmentFilter} onChange={(e) => setCustomerSegmentFilter(e.target.value)} className="input">
                        <option value="all">All Segments</option>
                        <option value="vip">VIP (LTV &gt; ₹10k)</option>
                        <option value="repeat">Repeat Shoppers</option>
                        <option value="one-time">One-time Buyers</option>
                      </select>
                    </div>

                    <div className="table-scroll-container mt-16">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Customer ID</th>
                            <th>Name</th>
                            <th>LTV</th>
                            <th>Orders</th>
                            <th>Last Order Date</th>
                            <th>Repeat Prob %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCustomersList.map(cust => (
                            <tr key={cust.id} onClick={() => setSelectedCustomerId(cust.id)} style={{ cursor: 'default' }} className={selectedCustomerId === cust.id ? 'active-row-bg' : ''}>
                              <td className="font-semibold">{cust.id}</td>
                              <td className="font-semibold">{cust.name}</td>
                              <td className="font-semibold">₹{cust.ltv.toLocaleString('en-IN')}</td>
                              <td>{cust.orders}</td>
                              <td>{cust.lastOrder}</td>
                              <td><span className={`badge ${cust.repeatProb > 80 ? 'badge-green' : cust.repeatProb > 50 ? 'badge-blue' : 'badge-orange'}`}>{cust.repeatProb}%</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="dashboard-right">
                  <div className="liquid-card customer-profile-panel-wrapper">
                    <div className="card-header-actions">
                      <span className="card-title">360-Degree Profile</span>
                      <span className={`badge ${activeCustomer.segment === 'vip' ? 'badge-purple' : 'badge-blue'}`}>{activeCustomer.segment.toUpperCase()}</span>
                    </div>

                    <div className="customer-profile-box">
                      <div className="profile-main-card">
                        <div className="profile-avatar">
                          <span>{activeCustomer.name.split(' ').map(n=>n[0]).join('')}</span>
                        </div>
                        <span className="profile-name">{activeCustomer.name}</span>
                        <span className="profile-meta-line">{activeCustomer.email}</span>
                        
                        <div className="profile-ltv-row">
                          <div className="mq-box select-none">
                            <span className="mq-lbl">Lifetime Value</span>
                            <span className="mq-val blue-txt">₹{activeCustomer.ltv.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="mq-box select-none">
                            <span className="mq-lbl">Orders Placed</span>
                            <span className="mq-val font-semibold">{activeCustomer.orders}</span>
                          </div>
                        </div>
                      </div>

                      <div className="profile-summary-box">
                        <span className="profile-sect-title">AI Customer Summary</span>
                        <p className="summary-p">"{activeCustomer.summary}"</p>
                      </div>

                      <div className="profile-section">
                        <span className="profile-sect-title">Communication Logs</span>
                        <div className="profile-timeline">
                          {activeCustomer.communications.length === 0 ? (
                            <span className="timeline-desc grey-txt">No logs recorded.</span>
                          ) : (
                            activeCustomer.communications.map((c, i) => (
                              <div key={i} className="timeline-event">
                                <div className="timeline-dot orange-dot"></div>
                                <div className="timeline-content">
                                  <span className="timeline-title">{c.title}</span>
                                  <span className="timeline-date">{c.date}</span>
                                  <span className="timeline-desc">"{c.desc}"</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 6: WHATSAPP MARKETING */}
          {/* ============================================== */}
          {activeTab === 'whatsapp' && (
            <section className="tab-pane active">
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <div className="liquid-card">
                    <div className="card-header-actions">
                      <span className="card-title">Active WhatsApp Automations</span>
                    </div>
                    <div className="campaigns-list mt-16">
                      {campaigns.map(camp => (
                        <div key={camp.id} className="campaign-card">
                          <div className="campaign-meta-info">
                            <span className="camp-title">{camp.name}</span>
                            <span className="camp-type">{camp.type} • <span className={`badge ${camp.status === 'Active' ? 'badge-green' : 'badge-grey'}`}>{camp.status}</span></span>
                          </div>
                          <div className="camp-stats-summary">
                            <div className="camp-stat-box"><span className="camp-stat-val text-green">{camp.revenue}</span><span className="camp-stat-lbl">Revenue</span></div>
                            <div className="camp-stat-box"><span className="camp-stat-val">{camp.open}</span><span className="camp-stat-lbl">Open Rate</span></div>
                            <div className="camp-stat-box"><span className="camp-stat-val">{camp.conv}</span><span className="camp-stat-lbl">Conversion</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="dashboard-right">
                  <div className="liquid-card mb-24">
                    <span className="card-title">WhatsApp Hub Performance</span>
                    <div className="metrics-grid mt-16" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div className="mq-box"><span className="mq-lbl">WhatsApp Revenue</span><span className="mq-val blue-txt">₹5,42,800</span></div>
                      <div className="mq-box"><span className="mq-lbl">Avg Open Rate</span><span className="mq-val green-txt">92.4%</span></div>
                      <div className="mq-box"><span className="mq-lbl">Response Rate</span><span className="mq-val purple-txt">38.5%</span></div>
                      <div className="mq-box"><span className="mq-lbl">Avg Conversion</span><span className="mq-val orange-txt">7.8%</span></div>
                    </div>
                  </div>

                  <div className="liquid-card">
                    <span className="card-title">Quick Broadcast Manager</span>
                    <div className="form-container mt-16">
                      <div className="form-group">
                        <label className="form-label">Campaign Title</label>
                        <input type="text" className="input" value={broadcastForm.name} onChange={(e) => setBroadcastForm({ ...broadcastForm, name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Audience Segment</label>
                        <select className="input" value={broadcastForm.segment} onChange={(e) => setBroadcastForm({ ...broadcastForm, segment: e.target.value })}>
                          <option value="all">All Subscribers (14,200)</option>
                          <option value="vip">VIP Cohort (2,450)</option>
                          <option value="abandon">Cart Abandoners (1,230)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">WhatsApp Template Body</label>
                        <textarea className="input" rows="4" value={broadcastForm.text} onChange={(e) => setBroadcastForm({ ...broadcastForm, text: e.target.value })} style={{ resize: 'none' }}></textarea>
                      </div>
                      <div className="form-actions mt-12">
                        <button className="btn-secondary" onClick={() => showToast('Test broadcast sent to founder profile.', 'success')}><Smartphone size={14} /> Send Test</button>
                        <button className="btn-primary" onClick={handleLaunchBroadcast}><Send size={14} /> Launch Broadcast</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 7: AI SUPPORT AGENT */}
          {/* ============================================== */}
          {activeTab === 'support' && (
            <section className="tab-pane active">
              <div className="metrics-grid select-none mb-24">
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' }}>
                  <span className="label">AI Containment Rate</span>
                  <span className="value">78.4%</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' }}>
                  <span className="label">Avg Resolution Time</span>
                  <span className="value">1.2m</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--yellow)' }}>
                  <span className="label">AI Case CSAT</span>
                  <span className="value">4.62<span className="metric-sub">/5</span></span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' }}>
                  <span className="label">Escalations Pending</span>
                  <span className="value">4 cases</span>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <div className="liquid-card" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
                    <span className="card-title">Live AI Streams</span>
                    <div className="conversation-feed-list mt-16">
                      {supportCases.map(cs => (
                        <div key={cs.id} className={`convo-item ${supportActiveCaseId === cs.id ? 'active' : ''}`} onClick={() => setSupportActiveCaseId(cs.id)}>
                          <div className="convo-left">
                            <span className="convo-cust-name font-semibold">{cs.customer}</span>
                            <span className="convo-last-msg">{cs.msg}</span>
                          </div>
                          <div className="convo-right">
                            <span className="convo-time">{cs.time}</span>
                            {cs.escalation !== 'None' ? <span className="badge badge-red">{cs.escalation}</span> : <span className="badge badge-grey">{cs.status}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="dashboard-right">
                  <div className="liquid-card" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
                    <div className="chat-header-details">
                      <div className="chat-cust-info">
                        <span className="chat-cust-name-title">{activeSupportCase.customer}</span>
                        <span className="chat-cust-details-sub">{activeSupportCase.channel.toUpperCase()} Integration</span>
                      </div>
                      <div className="chat-actions">
                        {activeSupportCase.status === 'Open' && <button className="btn-destructive btn-sm" onClick={() => handleEscalateCase(activeSupportCase.id)}>Escalate Human</button>}
                        <button className="btn-primary btn-sm" onClick={() => handleResolveCase(activeSupportCase.id)}>{activeSupportCase.status === 'Open' ? 'Resolve case' : 'Reopen case'}</button>
                      </div>
                    </div>

                    <div className="chat-messages-container" style={{ flexGrow: 1 }}>
                      {activeSupportCase.thread.map((msg, idx) => (
                        <div key={idx} className={`message-bubble ${msg.sender === 'customer' ? 'customer' : 'founder-user'}`}>
                          <p>{msg.msg}</p>
                          <span className="msg-time">{msg.time}</span>
                        </div>
                      ))}
                    </div>

                    <div className="chat-footer-controls">
                      <input type="text" className="input flex-grow" value={supportReplyInput} onChange={(e) => setSupportReplyInput(e.target.value)} placeholder="Type manual override message..." onKeyDown={(e) => { if (e.key === 'Enter') handleSupportHumanOverride(activeSupportCase.id); }} />
                      <button className="btn-primary" onClick={() => handleSupportHumanOverride(activeSupportCase.id)}><Send size={14} /> Send</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 8: REVIEWS & REPUTATION */}
          {/* ============================================== */}
          {activeTab === 'reviews' && (
            <section className="tab-pane active">
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <div className="liquid-card">
                    <div className="table-header-controls">
                      <div className="search-box-wrapper">
                        <Search size={14} />
                        <input type="text" className="input table-search" value={reviewsSearch} onChange={(e) => setReviewsSearch(e.target.value)} placeholder="Search customer reviews..." />
                      </div>
                      <div className="filters-row">
                        <select value={reviewsPlatformFilter} onChange={(e) => setReviewsPlatformFilter(e.target.value)} className="input input-sm">
                          <option value="all">All Sources</option>
                          <option value="shopify">Shopify</option>
                          <option value="amazon">Amazon</option>
                          <option value="google">Google</option>
                        </select>
                        <select value={reviewsSentimentFilter} onChange={(e) => setReviewsSentimentFilter(e.target.value)} className="input input-sm">
                          <option value="all">All Sentiments</option>
                          <option value="positive">Positive (4-5★)</option>
                          <option value="neutral">Neutral (3★)</option>
                          <option value="negative">Negative (1-2★)</option>
                        </select>
                      </div>
                    </div>

                    <div className="reviews-feed-container mt-16">
                      {filteredReviewsList.map(rev => (
                        <div key={rev.id} className="review-feed-item">
                          <div className="rev-header">
                            <div className="rev-cust-block">
                              <span className="rev-name font-semibold">{rev.customer}</span>
                              <span className={`badge ${rev.rating >= 4 ? 'badge-green' : 'badge-red'}`}>{rev.sentiment.toUpperCase()}</span>
                              <span className="badge badge-grey">{rev.platform.toUpperCase()}</span>
                            </div>
                            <div className="rev-stars-row">
                              {Array(5).fill(0).map((_, i) => (
                                <Star key={i} size={12} className={i < rev.rating ? 'fill-gold' : ''} />
                              ))}
                            </div>
                          </div>
                          <p className="rev-content">"{rev.text}"</p>
                          {rev.reply && (
                            <div className="rev-reply-block mt-8">
                              <span className="reply-badge badge badge-blue">AI Auto-Reply template</span>
                              <p className="reply-p font-semibold">"{rev.reply}"</p>
                              <div className="rev-reply-actions mt-8">
                                <button className="btn-primary btn-sm" onClick={() => handleApproveReviewReply(rev.id)}>Approve Response</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="dashboard-right">
                  <div className="liquid-card mb-24">
                    <span className="card-title text-red">🚨 Critical Review Alerts</span>
                    <div className="stock-alerts-list mt-16">
                      {reviews.filter(r => r.rating <= 2).map(r => (
                        <div key={r.id} className="alert-item">
                          <div className="alert-meta"><span className="alert-prod-name text-red">{r.customer} ({r.rating}★)</span><span className="alert-location">"{r.text}"</span></div>
                          <button className="btn-primary btn-sm" onClick={() => openCustomerProfile('CUST-802')}>Resolve</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="liquid-card">
                    <span className="card-title">Automation Configurations</span>
                    <div className="form-container mt-16">
                      <div className="form-group-switch">
                        <div className="switch-meta"><span className="switch-title">Auto-solicit review invites</span><span className="switch-desc">Send WhatsApp post-delivery</span></div>
                        <div className="switch-control active"></div>
                      </div>
                      <div className="form-group-switch mt-12">
                        <div className="switch-meta"><span className="switch-title">Auto-reply to 5★ reviews</span><span className="switch-desc">Reply with coupon codes</span></div>
                        <div className="switch-control active"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 9: INVENTORY & PROCUREMENT */}
          {/* ============================================== */}
          {activeTab === 'inventory' && (
            <section className="tab-pane active">
              <div className="liquid-card">
                <div className="table-header-controls">
                  <div className="search-box-wrapper">
                    <Search size={14} />
                    <input type="text" className="input table-search" value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder="Search inventory by SKU or product..." />
                  </div>
                  <div className="filters-row">
                    <select value={inventoryLocationFilter} onChange={(e) => setInventoryLocationFilter(e.target.value)} className="input input-sm">
                      <option value="all">All Locations</option>
                      <option value="warehouse">Warehouse</option>
                      <option value="amazon">Amazon FBA</option>
                      <option value="blinkit">Blinkit</option>
                    </select>
                    <select value={inventoryStatusFilter} onChange={(e) => setInventoryStatusFilter(e.target.value)} className="input input-sm">
                      <option value="all">All Stock Statuses</option>
                      <option value="low">Low Stock (&lt; 15 days)</option>
                      <option value="out">Out of stock</option>
                      <option value="healthy">Healthy Stock</option>
                    </select>
                    <button className="btn-primary" onClick={() => showToast('Low stock auto PO generated.', 'success')}><Plus size={14} /> New restock PO</button>
                  </div>
                </div>

                <div className="table-scroll-container mt-16">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product & SKU</th>
                        <th>Warehouse</th>
                        <th>Amazon FBA</th>
                        <th>Blinkit</th>
                        <th>Myntra</th>
                        <th>Instamart</th>
                        <th>Total Stock</th>
                        <th>Forecast (30d)</th>
                        <th>Remaining Run Rate</th>
                        <th>Reorder Target</th>
                        <th>PO Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventoryList.map(inv => {
                        const total = inv.warehouse + inv.amazon + inv.blinkit + inv.myntra + inv.instamart;
                        return (
                          <tr key={inv.id}>
                            <td className="font-semibold">{inv.name}<br/><span className="brand-version">{inv.sku}</span></td>
                            <td>{inv.warehouse}</td>
                            <td>{inv.amazon}</td>
                            <td>{inv.blinkit}</td>
                            <td>{inv.myntra}</td>
                            <td>{inv.instamart}</td>
                            <td className="font-semibold">{total}</td>
                            <td>{inv.forecast30} units</td>
                            <td><span className={`badge ${inv.daysLeft === 0 ? 'badge-red' : inv.daysLeft <= 7 ? 'badge-orange' : 'badge-green'}`}>{inv.daysLeft === 0 ? 'Stockout' : `${inv.daysLeft} days`}</span></td>
                            <td className="font-semibold">{inv.reorderQty} units</td>
                            <td><button className="btn-primary btn-sm" onClick={() => handleInventorySubmitPO(inv.sku, inv.reorderQty)}>Submit PO</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="dashboard-grid mt-24">
                <div className="dashboard-left">
                  <div className="liquid-card">
                    <span className="card-title">Procurement capitalLocked</span>
                    <div className="valuation-list mt-16">
                      <div className="valuation-row"><span className="val-lbl">Total stock lock:</span><span className="val-num text-lg font-semibold">₹48,24,500</span></div>
                      <div className="valuation-row"><span className="val-lbl">Main Delhi Warehouse:</span><span className="val-num font-semibold">₹28,50,000</span></div>
                      <div className="valuation-row"><span className="val-lbl">FBA Fulfillment centers:</span><span className="val-num font-semibold">₹11,42,000</span></div>
                    </div>
                  </div>
                </div>

                <div className="dashboard-right">
                  <div className="liquid-card">
                    <span className="card-title">Active Supplier procurement leadTimes</span>
                    <div className="supplier-list mt-16">
                      <div className="supplier-po-item">
                        <div className="sup-meta"><span className="sup-name font-semibold">Rishabh Packaging Labs</span><span className="sup-items">Glass bottles & dispensers</span></div>
                        <div className="sup-action"><span className="badge badge-orange">Lead: 12 days</span><button className="btn-primary btn-sm" onClick={() => showToast('PO notification pinged to Rishabh labs API.', 'success')}>Send PO</button></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 10: CONTENT STUDIO */}
          {/* ============================================== */}
          {activeTab === 'content' && (
            <section className="tab-pane active">
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <div className="liquid-card" style={{ height: '100%' }}>
                    <span className="card-title">Creative copywriting workspace</span>
                    <div className="form-container mt-16">
                      <div className="form-group">
                        <label className="form-label">Platform Template Type</label>
                        <select className="input" value={contentType} onChange={(e) => setContentType(e.target.value)}>
                          <option value="instagram-caption">Instagram Caption</option>
                          <option value="reels-script">Reels Script</option>
                          <option value="ad-copy">Meta Ad copy</option>
                          <option value="product-description">Shopify description</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Focus Skincare product</label>
                        <select className="input" value={contentProduct} onChange={(e) => setContentProduct(e.target.value)}>
                          <option value="vitamin-c">Vitamin C serum 30ml</option>
                          <option value="peach-lipstick">Matte Peach Lipstick</option>
                          <option value="rosewater-mist">Rosewater Face Mist</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Active brand voice & focus</label>
                        <input type="text" className="input" value={contentTone} onChange={(e) => setContentTone(e.target.value)} />
                      </div>
                      <button className="btn-primary btn-lg mt-12 w-full" onClick={handleGenerateContent} disabled={generatingContent}>
                        {generatingContent ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {generatingContent ? ' Generating creative copy...' : ' Generate Creative copy'}
                      </button>
                    </div>

                    {contentOutputVisible && (
                      <div className="content-ai-output mt-24">
                        <div className="output-header-actions">
                          <span className="output-lbl">Creative AI response draft</span>
                          <button className="btn-icon" onClick={() => { navigator.clipboard.writeText(generatedContent); showToast('Copied draft to clipboard!', 'success'); }} title="Copy copy"><Copy size={12} /></button>
                        </div>
                        <div className="output-box mt-8" style={{ whiteSpace: 'pre-line' }}>{generatedContent}</div>
                        <div className="output-actions mt-12">
                          <button className="btn-secondary btn-sm" onClick={handleSendToKanban}><UserCheck size={12} /> Send to approval</button>
                          <button className="btn-primary btn-sm" onClick={() => showToast('Creative post scheduled successfully.', 'success')}><Calendar size={12} /> Schedule post</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="dashboard-right">
                  <div className="liquid-card mb-24">
                    <span className="card-title">Workflow Kanban approvals</span>
                    <div className="kanban-board mt-16">
                      <div className="kanban-col">
                        <span className="col-title">Drafts</span>
                        <div className="kanban-cards-stack">
                          {kanbanStack.draft.map(c => (
                            <div key={c.id} className="kanban-card"><span className="k-title">{c.title}</span><span className="badge badge-grey">{c.type}</span></div>
                          ))}
                        </div>
                      </div>
                      <div className="kanban-col">
                        <span className="col-title">Review</span>
                        <div className="kanban-cards-stack">
                          {kanbanStack.review.map(c => (
                            <div key={c.id} className="kanban-card"><span className="k-title">{c.title}</span><span className="badge badge-orange">{c.type}</span></div>
                          ))}
                        </div>
                      </div>
                      <div className="kanban-col">
                        <span className="col-title">Approved</span>
                        <div className="kanban-cards-stack">
                          {kanbanStack.approved.map(c => (
                            <div key={c.id} className="kanban-card"><span className="k-title">{c.title}</span><span className="badge badge-green">{c.type}</span></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 11: FOUNDER ASSISTANT */}
          {/* ============================================== */}
          {activeTab === 'founder' && (
            <section className="tab-pane active">
              <div className="founder-chat-container liquid-card">
                <div className="chat-sidebar">
                  <div className="cs-header">
                    <span className="cs-title">Quick presets</span>
                    <span className="cs-desc">Tap to auto-execute search</span>
                  </div>
                  <div className="cs-prompts-list">
                    <button className="prompt-chip" onClick={() => handleFounderChatSubmit('Why did sales drop yesterday?')}>
                      <TrendingUp size={12} /><span>Why did sales drop yesterday?</span>
                    </button>
                    <button className="prompt-chip" onClick={() => handleFounderChatSubmit('Which channel generated highest profit this week?')}>
                      <DollarSign size={12} /><span>Which channel generated highest profit?</span>
                    </button>
                    <button className="prompt-chip" onClick={() => handleFounderChatSubmit('What products need restocking?')}>
                      <Package size={12} /><span>What products need restocking?</span>
                    </button>
                    <button className="prompt-chip" onClick={() => handleFounderChatSubmit('Generate a customer sentiment summary')}>
                      <Smile size={12} /><span>Review customer sentiment summary</span>
                    </button>
                  </div>
                </div>

                <div className="chat-console">
                  <div className="cc-header">
                    <div className="ai-avatar-glow">AI</div>
                    <div className="cc-title-info">
                      <span className="cc-title">Shills Founder AI Assistant</span>
                      <span className="cc-status"><span className="badge badge-live">Online</span> ready to scan</span>
                    </div>
                  </div>

                  <div className="cc-messages-scroll" style={{ flexGrow: 1 }}>
                    {founderMessages.map((msg, idx) => (
                      <div key={idx} className={`message-bubble ${msg.sender === 'founder-user' ? 'founder-user' : 'system-message'}`} style={{ alignSelf: msg.sender === 'founder-user' ? 'flex-end' : 'flex-start', textAlign: msg.sender === 'founder-user' ? 'right' : 'left' }}>
                        <div dangerouslySetInnerHTML={{ __html: msg.msg }}></div>
                        <span className="msg-time">{msg.time}</span>
                      </div>
                    ))}
                  </div>

                  <div className="cc-input-footer">
                    <input type="text" className="input flex-grow" value={founderInput} onChange={(e) => setFounderInput(e.target.value)} placeholder="Ask Founder Assistant anything (e.g. restock)..." onKeyDown={(e) => { if (e.key === 'Enter') handleFounderChatSubmit(); }} />
                    <button className="btn-primary" onClick={() => handleFounderChatSubmit()}><Send size={14} /></button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 12: ANALYTICS & INTELLIGENCE */}
          {/* ============================================== */}
          {activeTab === 'analytics' && (
            <section className="tab-pane active">
              <div className="metrics-grid select-none mb-24">
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' }}>
                  <span className="label">Gross Contribution Margin</span>
                  <span className="value">64.5%</span>
                  <span className="trend up"><ArrowUpRight size={12} /> +1.2%</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' }}>
                  <span className="label">CAC (Blended)</span>
                  <span className="value">₹320</span>
                  <span className="trend down"><ArrowDownLeft size={12} /> -18 improvement</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' }}>
                  <span className="label">LTV to CAC Ratio</span>
                  <span className="value">5.2x</span>
                  <span className="trend up"><ArrowUpRight size={12} /> +0.4x</span>
                </div>
                <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--pink)' }}>
                  <span className="label">Forecasted Sales (30d)</span>
                  <span className="value">₹92,45,000</span>
                  <span className="trend up"><ArrowUpRight size={12} /> +9.8%</span>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <div className="liquid-card dashboard-chart-card">
                    <div className="card-header-actions">
                      <span className="card-title">3-Month Predictive Forecasting Models</span>
                    </div>
                    <div className="chart-wrapper">
                      <canvas ref={forecastCanvasRef}></canvas>
                    </div>
                  </div>

                  <div className="liquid-card mt-24">
                    <span className="card-title">Customer cohort retention analysis (2026)</span>
                    <div className="table-scroll-container mt-16">
                      <table className="cohort-table">
                        <thead>
                          <tr><th>Cohort Month</th><th>Shoppers</th><th>Month 0</th><th>Month 1</th><th>Month 2</th><th>Month 3</th></tr>
                        </thead>
                        <tbody>
                          <tr><td className="font-semibold">Jan 2026</td><td>4,200</td><td className="ch-val pct-100">100%</td><td className="ch-val pct-30">34%</td><td className="ch-val pct-25">28%</td><td className="ch-val pct-20">24%</td></tr>
                          <tr><td className="font-semibold">Feb 2026</td><td>4,800</td><td className="ch-val pct-100">100%</td><td className="ch-val pct-30">32%</td><td className="ch-val pct-25">26%</td><td className="ch-val pct-20">22%</td></tr>
                          <tr><td className="font-semibold">Mar 2026</td><td>5,100</td><td className="ch-val pct-100">100%</td><td className="ch-val pct-30">36%</td><td className="ch-val pct-25">29%</td><td className="ch-val pct-20">25%</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="dashboard-right">
                  <div className="liquid-card mb-24">
                    <span className="card-title">Margins by active products</span>
                    <div className="channel-row-grid mt-16">
                      <div className="channel-row-item">
                        <div className="channel-meta"><span className="channel-name font-semibold">Vitamin C Face Serum</span><span className="channel-domain">MRP: ₹799 • COGS: ₹162</span></div>
                        <div className="text-right"><span className="margin-pct green-txt font-semibold">50.8% Net</span></div>
                      </div>
                      <div className="channel-row-item">
                        <div className="channel-meta"><span className="channel-name font-semibold">Matte Peach Lipstick</span><span className="channel-domain">MRP: ₹649 • COGS: ₹98</span></div>
                        <div className="text-right"><span className="margin-pct green-txt font-semibold">57.1% Net</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="liquid-card mb-24">
                    <span className="card-title"><Lightbulb size={14} className="orange-txt" /> Optimization insights</span>
                    <div className="rec-list mt-16">
                      <div className="rec-item"><p className="rec-txt">"Increase ad spends on Amazon: Matte Peach Lipstick yields high 5.1x ROAS vs. aggregate 4.2x average."</p></div>
                    </div>
                  </div>

                  <div className="liquid-card">
                    <span className="card-title">Executive Reports compiler</span>
                    <div className="form-container mt-16">
                      <button className="btn-primary w-full" onClick={() => showToast('PDF Report created successfully.', 'success')}><FileText size={14} /> Export PDF Statement</button>
                      <button className="btn-secondary w-full" onClick={() => showToast('Excel Sheet created successfully.', 'success')}><Sheet size={14} /> Export Excel Data</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================== */}
          {/* TAB 13: SETTINGS */}
          {/* ============================================== */}
          {activeTab === 'settings' && (
            <section className="tab-pane active">
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <div className="liquid-card">
                    <span className="card-title">Connected API storefront channels</span>
                    <div className="channel-integrations-list mt-16">
                      <div className="int-item">
                        <div className="int-brand">
                          <div className="channel-brand-icon shopify-color">S</div>
                          <div className="int-details"><span className="int-title">Shopify Store API</span><span className="int-domain">shillsbeauty.myshopify.com</span></div>
                        </div>
                        <div className="int-status"><span className="badge badge-green">Connected</span><button className="btn-icon" onClick={() => showToast('Shopify webhook API disconnected.')}><Power size={12} /></button></div>
                      </div>

                      <div className="int-item mt-12">
                        <div className="int-brand">
                          <div className="channel-brand-icon amazon-color">A</div>
                          <div className="int-details"><span className="int-title">Amazon Seller Central</span><span className="int-domain">Partner Seller ID: A3P982</span></div>
                        </div>
                        <div className="int-status"><span className="badge badge-green">Connected</span><button className="btn-icon" onClick={() => showToast('Amazon FBA API disconnected.')}><Power size={12} /></button></div>
                      </div>

                      <div className="int-item mt-12">
                        <div className="int-brand">
                          <div className="channel-brand-icon blinkit-color">B</div>
                          <div className="int-details"><span className="int-title">Blinkit Partner Portal</span><span className="int-domain">Delhi/NCR hub connections</span></div>
                        </div>
                        <div className="int-status"><span className="badge badge-green">Connected</span><button className="btn-icon" onClick={() => showToast('Blinkit portal disconnected.')}><Power size={12} /></button></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dashboard-right">
                  <div className="liquid-card">
                    <span className="card-title">Configurations & Threshold rules</span>
                    <div className="form-container mt-16">
                      <div className="form-group">
                        <label className="form-label">Low-Stock trigger threshold (days)</label>
                        <input type="number" className="input" defaultValue="7" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">WhatsApp active campaign restriction hours</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="time" className="input flex-grow" defaultValue="09:00" />
                          <input type="time" className="input flex-grow" defaultValue="21:00" />
                        </div>
                      </div>
                      <button className="btn-primary mt-12 w-full" onClick={() => showToast('Settings saved successfully.', 'success')}>Save settings</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

        </main>
      </div>

      {/* Slide-out Inspector Sheet (macOS style) */}
      {inspectorOpen && (
        <>
          <div className="inspector-overlay" style={{ display: 'block' }} onClick={() => setInspectorOpen(false)}></div>
          <aside className="inspector-panel open">
            <div className="inspector-header">
              <span className="inspector-title">Details: {inspectorData.id}</span>
              <button className="btn-icon" onClick={() => setInspectorOpen(false)}><X size={14} /></button>
            </div>
            <div className="inspector-body">
              <div className="inspector-detail-card">
                <div className="inspector-section">
                  <span className="inspector-sec-title">Overview summary</span>
                  <div className="item-row"><span className="meta-lbl">Customer:</span><span className="meta-val font-semibold">{inspectorData.customer}</span></div>
                  <div className="item-row"><span className="meta-lbl">Email:</span><span className="meta-val">{inspectorData.email}</span></div>
                  <div className="item-row"><span className="meta-lbl">Value:</span><span className="meta-val font-semibold">₹{inspectorData.value?.toLocaleString('en-IN')}</span></div>
                  <div className="item-row"><span className="meta-lbl">Store Channel:</span><span className="meta-val badge badge-blue">{inspectorData.channel?.toUpperCase()}</span></div>
                </div>

                <div className="inspector-section">
                  <span className="inspector-sec-title">Shipment history</span>
                  <div className="profile-timeline">
                    <div className="timeline-event">
                      <div className="timeline-dot green-dot"></div>
                      <div className="timeline-content">
                        <span className="timeline-title">Order registered</span>
                        <span className="timeline-date">{inspectorData.datetime}</span>
                      </div>
                    </div>
                    <div className="timeline-event">
                      <div className="timeline-dot orange-dot"></div>
                      <div className="timeline-content">
                        <span className="timeline-title">Fulfillment state</span>
                        <span className="timeline-date">{inspectorData.fulfillment?.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {inspectorData.issue === 'issue' && (
                  <div className="inspector-section" style={{ background: 'rgba(255,69,58,0.08)', borderRadius: '10px', padding: '12px' }}>
                    <span className="inspector-sec-title text-red"><AlertTriangle size={12} /> AI Warning flag</span>
                    <p className="summary-p font-semibold mt-4">"{inspectorData.msg}"</p>
                    <div className="form-actions mt-12">
                      <button className="btn-primary btn-sm" onClick={() => handleApproveRefund(inspectorData.id)}>Initiate refund</button>
                      <button className="btn-secondary btn-sm" onClick={() => { showToast('Alert templates dispatched via WhatsApp API.', 'success'); setInspectorOpen(false); }}>WhatsApp Ping</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  ) : (
        /* Landing Page & Sign In/Sign Up */
        <div className="landing-container">
          <div className="landing-glow-1"></div>
          <div className="landing-glow-2"></div>
          
          {/* Header Navigation */}
          <header className="landing-navbar">
            <div className="landing-nav-logo">
              <img src="/logo.png" alt="Shills Professional Logo" className="landing-nav-logo-img" />
              <span className="landing-nav-logo-txt">Growth OS</span>
            </div>
            
            
            
            <div className="landing-nav-actions">
              <button className="btn-nav-signup" onClick={() => { setAuthMode('signin'); setAuthModalOpen(true); }}>Sign In</button>
            </div>
          </header>

          {/* Hero Section */}
          <main className="landing-hero-section">
            <div className="hero-content">
              <div className="hero-badge">
                <span>Enterprise Grade</span>
              </div>
              <h1 className="hero-title">
                The Intelligent Operating System for Modern Beauty Brands
              </h1>
              <p className="hero-description">
                Consolidate your sales, sync inventory health, orchestrate WhatsApp loops, and run automated AI customer service across Shopify, Amazon, Blinkit, Instamart, Myntra, and Flipkart.
              </p>
              
              <div className="hero-cta-buttons">
                <button className="btn-hero-primary" onClick={() => { setAuthMode('signin'); setAuthModalOpen(true); }}>
                  Access Admin Portal
                </button>
              </div>

              <div className="hero-powered-by">
                Powered by <span className="scalepods-blue">ScalePods</span> Growth Framework
              </div>
            </div>

            {/* Dashboard Mockup Preview */}
            <div className="hero-preview-container">
              <div className="preview-browser-header">
                <div className="browser-dots"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
                <div className="browser-address">shills.scalepods.io/growth-os</div>
              </div>
              <div className="preview-image-fallback">
                <div className="preview-glow"></div>
                <div className="preview-stats-row">
                  <div className="preview-stat-card">
                    <span className="lbl">Today's Revenue</span>
                    <span className="val">₹2,48,920</span>
                    <span className="trend">+12.4%</span>
                  </div>
                  <div className="preview-stat-card">
                    <span className="lbl">Monthly Revenue</span>
                    <span className="val">₹84,20,500</span>
                    <span className="trend">+18.2%</span>
                  </div>
                  <div className="preview-stat-card">
                    <span className="lbl">AI Containment</span>
                    <span className="val">78.4%</span>
                    <span className="trend" style={{ color: '#007AFF' }}>Optimal</span>
                  </div>
                </div>
                <div className="preview-chart-mock">
                  <div className="mock-bar" style={{ height: '40%' }}></div>
                  <div className="mock-bar" style={{ height: '65%' }}></div>
                  <div className="mock-bar" style={{ height: '50%' }}></div>
                  <div className="mock-bar" style={{ height: '85%' }}></div>
                  <div className="mock-bar" style={{ height: '70%' }}></div>
                  <div className="mock-bar" style={{ height: '95%' }}></div>
                </div>
              </div>
            </div>
          </main>

          {/* Integrations Ribbon */}
          <section id="integrations" className="landing-integrations-section">
            <span className="section-meta">Native Live Connections (Click to verify)</span>
            <div className="integrations-scroll">
              <button className="integration-chip shopify" onClick={() => showToast('Shopify API integration verified & active.', 'success')}>Shopify</button>
              <button className="integration-chip amazon" onClick={() => showToast('Amazon Seller Central API active & verified.', 'success')}>Amazon</button>
              <button className="integration-chip blinkit" onClick={() => showToast('Blinkit quick-commerce engine active & verified.', 'success')}>Blinkit</button>
              <button className="integration-chip instamart" onClick={() => showToast('Swiggy Instamart dark store sync active & verified.', 'success')}>Instamart</button>
              <button className="integration-chip myntra" onClick={() => showToast('Myntra catalog webhook active & verified.', 'success')}>Myntra</button>
              <button className="integration-chip flipkart" onClick={() => showToast('Flipkart API channel connector active & verified.', 'success')}>Flipkart</button>
            </div>
          </section>

          {/* Features Grid */}
          <section id="features" className="landing-features-section">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Multi-Channel Sync</h3>
              <p>Direct API syncing across Shopify and Quick-Commerce dark stores with automatic reconciliation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Customer Operations</h3>
              <p>Self-healing refund and dispute resolutions with Blinkit & Amazon delivery agents.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Founder Assistant</h3>
              <p>Direct LLM database chat console that forecasts stockouts and calculates net profit margins.</p>
            </div>
          </section>

          {/* Footer */}
          <footer className="landing-page-footer">
            <div className="footer-credits">
              <span>© 2026 Shills Professional. All rights reserved.</span>
              <span className="footer-scalepods">Engineered by <strong>ScalePods</strong></span>
            </div>
          </footer>

          {/* Frosted Authentication Modal */}
          {authModalOpen && (
            <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
              <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="btn-modal-close" onClick={() => setAuthModalOpen(false)}>
                  <X size={16} />
                </button>
                
                <div className="auth-logo-header">
                  <img src="/logo.png" alt="Shills Professional Logo" className="auth-logo-img" />
                </div>
                
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '24px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-rounded)' }}>
                  Admin Portal Login
                </div>

                <form className="landing-form" onSubmit={(e) => {
                  e.preventDefault();
                  setIsLoggedIn(true);
                  setTheme('dark');
                  setAuthModalOpen(false);
                  showToast('Access Granted. Syncing multi-channel APIs in Dark Mode...', 'success');
                }}>
                  <div className="input-group">
                    <label className="input-label">Security Identity</label>
                    <input 
                      type="email" 
                      className="input-field" 
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)} 
                      placeholder="name@shillsbeauty.com"
                      required 
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">OS Access Token</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)} 
                      placeholder="admin123"
                      required 
                    />
                  </div>
                  
                  <div style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.18)', borderRadius: '10px', padding: '12px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', width: '100%', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: '600', color: '#007AFF', marginBottom: '2px' }}>Demo Environment Mode</div>
                    Dummy credentials are prefilled. Click the button below to directly launch the Growth OS.
                  </div>

                  <button type="submit" className="btn-signin">
                    Sign In to Growth OS
                  </button>
                </form>
                
                <div style={{ marginTop: '20px', fontSize: '9px', color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', letterSpacing: '0.05em' }}>
                  Secured by <strong>ScalePods</strong> Cryptography
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spotlight Finder overlay */}
      {spotlightOpen && (
        <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={() => setSpotlightOpen(false)}>
          <div className="spotlight-panel" onClick={(e) => e.stopPropagation()}>
            <div className="spotlight-header">
              <Search size={18} />
              <input type="text" className="spotlight-input" value={spotlightInput} onChange={(e) => setSpotlightInput(e.target.value)} placeholder="Type navigations (e.g. orders, inventory)..." autoFocus />
            </div>
            <div className="spotlight-results">
              {filteredSpotlightOptions.length === 0 ? (
                <div style={{ padding: '16px', fontSize: '13px', color: 'var(--label-tertiary)' }}>No matching results found.</div>
              ) : (
                filteredSpotlightOptions.map((item, index) => (
                  <div key={index} className={`spotlight-item ${index === spotlightSelectedIndex ? 'selected' : ''}`} onClick={() => selectSpotlightItem(item)}>
                    <div className="spotlight-item-left">
                      <LayoutDashboard size={14} />
                      <span>{item.text}</span>
                    </div>
                    <span className="spotlight-shortcut">{item.shortcut}</span>
                  </div>
                ))
              )}
            </div>
            <div className="spotlight-footer">
              <span>Use <kbd>ESC</kbd> to close, <kbd>Enter</kbd> to select option</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
