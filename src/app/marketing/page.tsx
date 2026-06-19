'use client';

import React, { useState } from 'react';
import { useAppContext } from '../ClientWrapper';
import {
  Sparkles,
  Calendar,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  MessageSquare,
  Activity,
  Plus,
  Share2,
  Trash,
  X,
  DollarSign,
  RefreshCw
} from 'lucide-react';

// Inline Custom SVG Icons to avoid Lucide version incompatibilities
interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const InstagramIcon = ({ size = 16, ...props }: CustomIconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ size = 16, ...props }: CustomIconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const YoutubeIcon = ({ size = 16, ...props }: CustomIconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const LinkedinIcon = ({ size = 16, ...props }: CustomIconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

interface CalendarPost {
  id: string;
  date: number;
  platform: string;
  title: string;
  time: string;
  status: string;
  img: string;
  description: string;
}

export default function MarketingPage() {
  const {
    contentDrafts,
    setContentDrafts,
    showToast
  } = useAppContext();

  // Page States
  const [activePlatformFilter, setActivePlatformFilter] = useState('all');
  
  // UGC Generator States
  const [ugcProduct, setUgcProduct] = useState('Nail Gel Set #12');
  const [ugcPlatform, setUgcPlatform] = useState('Instagram Reels');
  const [ugcVibe, setUgcVibe] = useState('Aesthetic & clean');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUgc, setGeneratedUgc] = useState<{
    product: string;
    platform: string;
    vibe: string;
    hooks: string[];
    shots: string[];
    script: string;
  } | null>(null);

  // Calendar Details Modal
  const [selectedCalendarItem, setSelectedCalendarItem] = useState<CalendarPost | null>(null);

  // Marketing Stats
  const postsPublished = 24;
  const totalReach = '148.5K';
  const avgEngagement = '6.4%';
  const salesAttributed = '₹3,84,500';

  // Calendar Items June 2026 (Mock Data)
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>([
    { id: 'cal-1', date: 4, platform: 'Instagram', title: 'Vitamin C Brightening Hack', time: '11:00 AM', status: 'Published', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=150&q=80', description: 'Showing how to get the glazed skin look with Vitamin C face serum. Meta code: GLOW15' },
    { id: 'cal-2', date: 9, platform: 'Pinterest', title: 'Aesthetic Nude Nails Lookbook', time: '04:00 PM', status: 'Published', img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=150&q=80', description: 'Pinterest board showcasing Nail Gel Set #12 styles for bridal season.' },
    { id: 'cal-3', date: 15, platform: 'Instagram', title: 'Lavender Gel Cool Off Routine', time: '03:00 PM', status: 'Published', img: 'https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=150&q=80', description: 'Cooling gel moisturization tips for skincare post-sun exposure.' },
    { id: 'cal-4', date: 20, platform: 'Youtube', title: 'Salon-grade nails at home guide', time: '06:00 PM', status: 'Scheduled', img: 'https://images.unsplash.com/photo-1632345031435-8797b2d58045?w=150&q=80', description: 'Step-by-step application of self-leveling gel colors. Youtube Shorts.' },
    { id: 'cal-5', date: 25, platform: 'LinkedIn', title: 'How Shills OS automates dark store logistics', time: '10:00 AM', status: 'Scheduled', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&q=80', description: 'Founder post discussing direct B2B integrations and Quick Commerce scale.' }
  ]);

  // Generate UGC Script
  const handleGenerateUgc = () => {
    setIsGenerating(true);
    setGeneratedUgc(null);

    setTimeout(() => {
      let script = '';
      let hooks: string[] = [];
      let shots: string[] = [];

      if (ugcProduct.includes('Gel Set')) {
        hooks = [
          '“If you are still spending ₹3,000 at the nail salon, stop scrolling right now.”',
          '“Doing my nails at home in 10 minutes, and they look completely salon-done.”'
        ];
        shots = [
          'Shot 1: Close-up of bare, dull nails. Bring in Shills Nail Gel Set #12.',
          'Shot 2: Easy application of base coat, color coat (Classic Nude), curing under UV.',
          'Shot 3: The final shiny nails. Tap to cure. Show the Blinkit bag arriving.'
        ];
        script = `Hey guys! 💅 I stopped going to the nail salon, and it has saved me so much money. Look at this shine. I got the Shills Nail Gel Set #12 on Blinkit in 10 minutes. The base is self-leveling and doesn't chip for 3 weeks! Simply apply, cure, and you are done. Use code NAILS15. Link in bio!`;
      } else {
        hooks = [
          '“This one hydration mist saved my makeup from cakeing at 3 PM.”',
          '“The Damask Rose extract that feels like a luxury spa facial.”'
        ];
        shots = [
          'Shot 1: Model looking exhausted at work desk. Spraying Rosewater Mist.',
          'Shot 2: Close-up of dew droplets on skin showing instant glow.',
          'Shot 3: Bottle aesthetics. Code and Shopify link graphic overlays.'
        ];
        script = `Midday slump? 🌹 My skin was feeling so dry and tight. But one spray of Shills Rosewater Face Mist brings it back to dewy life. It is organic damask rose oil base with active hyaluronic acid. Keep it in your bag, spray over makeup, and look fresh instantly. Tap shop button!`;
      }

      setGeneratedUgc({
        product: ugcProduct,
        platform: ugcPlatform,
        vibe: ugcVibe,
        hooks,
        shots,
        script
      });
      setIsGenerating(false);
      showToast('AI UGC Script generated successfully.', 'success');
    }, 1200);
  };

  // Maker-Checker Approvals
  const approveDraft = (draftId: string) => {
    setContentDrafts(prev => prev.map(d => {
      if (d.id === draftId) {
        showToast(`Draft "${d.title}" approved and moved to Scheduled.`, 'success');
        return { ...d, status: 'approved' };
      }
      return d;
    }));
  };

  const publishNow = (draft: any) => {
    // Add to Calendar
    const newCal = {
      id: `cal-${Date.now()}`,
      date: 24, // Scheduled for June 24
      platform: draft.platform.includes('Instagram') ? 'Instagram' : draft.platform.includes('Youtube') ? 'Youtube' : 'Pinterest',
      title: draft.title,
      time: '12:00 PM',
      status: 'Published',
      img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=150&q=80',
      description: draft.scriptText
    };

    setCalendarPosts([newCal, ...calendarPosts]);
    
    // Delete draft from list
    setContentDrafts(prev => prev.filter(d => d.id !== draft.id));
    showToast(`Successfully published post on ${newCal.platform} API gateway!`, 'success');
  };

  // Add a new draft to the workflow
  const saveGeneratedToDraft = () => {
    if (!generatedUgc) return;

    const newDraft = {
      id: `c-${Date.now()}`,
      title: `AI UGC Script for ${generatedUgc.product}`,
      type: 'UGC Script',
      platform: generatedUgc.platform,
      product: generatedUgc.product,
      status: 'draft',
      scriptText: `Hooks:\n1. ${generatedUgc.hooks[0]}\n2. ${generatedUgc.hooks[1]}\n\nShots:\n${generatedUgc.shots.join('\n')}\n\nVoiceover Script:\n"${generatedUgc.script}"`
    };

    setContentDrafts([newDraft, ...contentDrafts]);
    setGeneratedUgc(null);
    showToast('AI UGC draft saved to Maker-Checker review pipeline.', 'success');
  };

  // Render Calendar Grid (June 2026)
  const renderCalendarGrid = () => {
    const daysInMonth = 30; // June has 30 days
    const startingDay = 1; // June 1, 2026 is Monday (starting index 1)
    
    const grid = [];

    // Weekday headers
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Fill days
    for (let day = 1; day <= daysInMonth; day++) {
      // Find posts for this day
      const dayPosts = calendarPosts.filter(p => p.date === day && (activePlatformFilter === 'all' || p.platform.toLowerCase() === activePlatformFilter.toLowerCase()));
      
      grid.push(
        <div 
          key={day} 
          style={{ 
            minHeight: '80px', 
            background: 'var(--bg-layer2)', 
            border: '1px solid var(--separator)', 
            borderRadius: '8px', 
            padding: '6px', 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: dayPosts.length > 0 ? 'pointer' : 'default',
            transition: 'background 150ms ease'
          }}
          onClick={() => dayPosts.length > 0 && setSelectedCalendarItem(dayPosts[0])}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-secondary)' }}>{day}</span>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
            {dayPosts.map(post => (
              <div 
                key={post.id} 
                style={{ 
                  width: '100%', 
                  background: post.status === 'Published' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(0, 122, 255, 0.15)',
                  borderLeft: `3px solid ${post.status === 'Published' ? 'var(--green)' : 'var(--blue)'}`,
                  padding: '2px 4px', 
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  overflow: 'hidden'
                }}
                title={`${post.title} (${post.time})`}
              >
                {post.platform === 'Instagram' && <InstagramIcon size={10} style={{ color: 'var(--pink)', flexShrink: 0 }} />}
                {post.platform === 'Youtube' && <YoutubeIcon size={10} style={{ color: 'var(--red)', flexShrink: 0 }} />}
                {post.platform === 'Pinterest' && <Share2 size={10} style={{ color: 'var(--orange)', flexShrink: 0 }} />}
                {post.platform === 'LinkedIn' && <LinkedinIcon size={10} style={{ color: 'var(--blue)', flexShrink: 0 }} />}
                
                <span style={{ fontSize: '9px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--label-primary)' }}>
                  {post.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Weekday Labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px', fontWeight: '700', fontSize: '11px', color: 'var(--label-tertiary)' }}>
          {weekdays.map(d => <div key={d}>{d}</div>)}
        </div>
        
        {/* Date Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {grid}
        </div>
      </div>
    );
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Marketing Content OS</h2>
            <span style={{ fontSize: '10px', background: 'rgba(0, 122, 255, 0.08)', color: 'var(--blue)', border: '1px solid rgba(0, 122, 255, 0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Powered by ScalePods</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>Automate social media copy pipelines, generate UGC hooks, and view auto-posting schedules.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">UGC Posts Published</span>
          <span className="value">{postsPublished} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Creatives</span></span>
          <span className="trend up"><CheckCircle2 size={12} /> Auto Posted</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Monthly Reach</span>
          <span className="value">{totalReach}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><TrendingUp size={12} /> +12.4% vs L30D</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--pink)' } as React.CSSProperties}>
          <span className="label">Avg Engagement Rate</span>
          <span className="value">{avgEngagement}</span>
          <span className="trend up"><MessageSquare size={12} /> High Affinity</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Sales Attributed</span>
          <span className="value">{salesAttributed}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><DollarSign size={12} /> Meta/IG Promo Codes</span>
        </div>
      </div>

      {/* Content Planner Monthly Calendar */}
      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--blue)' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Monthly Content Calendar - June 2026</h3>
          </div>
          
          {/* Calendar Platform Filters */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--fill-tertiary)', padding: '2px', borderRadius: '8px' }}>
            {['all', 'Instagram', 'Pinterest', 'Youtube'].map(p => (
              <button
                key={p}
                onClick={() => setActivePlatformFilter(p)}
                style={{ 
                  padding: '4px 10px', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  fontWeight: '700',
                  background: activePlatformFilter === p ? 'var(--bg-layer1)' : 'transparent',
                  color: activePlatformFilter === p ? 'var(--blue)' : 'var(--label-secondary)',
                  cursor: 'pointer'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {renderCalendarGrid()}
      </div>

      {/* UGC Generator & Maker-Checker Workflow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* UGC Creator Panel */}
        <div className="liquid-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--purple)' }} /> UGC Creator Engine
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--label-secondary)', marginBottom: '16px' }}>
            AI generates scripts, hook copy options, shot lists, and demo directions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Product Selection</label>
              <select className="input" style={{ width: '100%', padding: '8px' }} value={ugcProduct} onChange={(e) => setUgcProduct(e.target.value)}>
                <option value="Nail Gel Set #12">Nail Gel Set #12 (Classic Nudes)</option>
                <option value="Rosewater Face Mist 100ml">Rosewater Face Mist 100ml</option>
                <option value="Vitamin C Face Serum 30ml">Vitamin C Face Serum</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Target Platform</label>
              <select className="input" style={{ width: '100%', padding: '8px' }} value={ugcPlatform} onChange={(e) => setUgcPlatform(e.target.value)}>
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="TikTok">TikTok Video</option>
                <option value="Youtube Shorts">YouTube Shorts</option>
                <option value="Pinterest">Pinterest Board</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Brand Vibe / Focus</label>
              <input 
                type="text" 
                className="input" 
                style={{ width: '100%', padding: '8px 12px' }} 
                value={ugcVibe}
                onChange={(e) => setUgcVibe(e.target.value)}
                placeholder="e.g. Aesthetic & dewy skin"
              />
            </div>

            <button 
              className="btn-primary" 
              onClick={handleGenerateUgc}
              disabled={isGenerating}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
              {isGenerating ? 'Generating UGC Draft...' : 'Generate UGC Creative Draft'}
            </button>
          </div>

          {/* UGC Generator Output */}
          {generatedUgc && (
            <div style={{ marginTop: '16px', background: 'var(--fill-quaternary)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ borderBottom: '1px solid var(--separator)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>AI Script Output</span>
                <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '2px' }}>UGC Creative: {generatedUgc.product}</div>
              </div>
              
              <div style={{ fontSize: '12px' }}>
                <strong>Hooks:</strong>
                <ul style={{ paddingLeft: '16px', marginTop: '4px', color: 'var(--label-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <li>{generatedUgc.hooks[0]}</li>
                  <li>{generatedUgc.hooks[1]}</li>
                </ul>
              </div>

              <div style={{ fontSize: '12px' }}>
                <strong>Voiceover Script:</strong>
                <p style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--label-secondary)', lineHeight: '1.4' }}>
                  "{generatedUgc.script}"
                </p>
              </div>

              <button className="btn-primary" style={{ background: 'var(--green)' }} onClick={saveGeneratedToDraft}>
                Approve & Send to Team Review
              </button>
            </div>
          )}
        </div>

        {/* Maker-Checker Workflow Columns */}
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Maker-Checker Creative Workflow</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', alignItems: 'start' }}>
            
            {/* Column 1: AI Drafts */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '10px', minHeight: '300px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>AI Drafts</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contentDrafts.filter(d => d.status === 'draft').map(d => (
                  <div key={d.id} style={{ background: 'var(--bg-layer1)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>{d.title}</div>
                    <span className="badge badge-grey" style={{ fontSize: '9px' }}>{d.platform}</span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button className="btn-primary" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => approveDraft(d.id)}>Submit Review</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: In Review */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '10px', minHeight: '300px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>In Review</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contentDrafts.filter(d => d.status === 'review').map(d => (
                  <div key={d.id} style={{ background: 'var(--bg-layer1)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>{d.title}</div>
                    <span className="badge badge-orange" style={{ fontSize: '9px' }}>{d.platform}</span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '8px' }}>
                      <button className="btn-primary" style={{ padding: '2px 6px', fontSize: '10px', background: 'var(--green)' }} onClick={() => approveDraft(d.id)}>Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Approved & Scheduled */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '10px', minHeight: '300px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>Scheduled</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contentDrafts.filter(d => d.status === 'approved').map(d => (
                  <div key={d.id} style={{ background: 'var(--bg-layer1)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>{d.title}</div>
                    <span className="badge badge-blue" style={{ fontSize: '9px' }}>{d.platform}</span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--blue)' }} onClick={() => publishNow(d)}>Publish API</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Calendar Item Detail Modal Overlay */}
      {selectedCalendarItem && (
        <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={() => setSelectedCalendarItem(null)}>
          <div className="spotlight-panel" style={{ maxWidth: '480px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar style={{ color: 'var(--blue)' }} />
                <span style={{ fontWeight: '700', fontSize: '15px' }}>Scheduled Post Details</span>
              </div>
              <button className="btn-icon" onClick={() => setSelectedCalendarItem(null)}><X size={14} /></button>
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid var(--separator)' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <img 
                  src={selectedCalendarItem.img} 
                  alt={selectedCalendarItem.title} 
                  style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} 
                />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{selectedCalendarItem.title}</h4>
                  <span className="badge badge-blue" style={{ fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>{selectedCalendarItem.platform} • {selectedCalendarItem.time}</span>
                  <div style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '4px' }}>Date: June {selectedCalendarItem.date}, 2026</div>
                </div>
              </div>

              <div style={{ background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '8px', fontSize: '12.5px', color: 'var(--label-primary)' }}>
                <strong>Creative Caption / Guidelines:</strong>
                <p style={{ marginTop: '4px', lineHeight: '1.4', color: 'var(--label-secondary)' }}>
                  {selectedCalendarItem.description}
                </p>
              </div>
            </div>

            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--separator)' }}>
              <button className="btn-secondary" onClick={() => setSelectedCalendarItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
