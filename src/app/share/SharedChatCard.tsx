import { MessageSquare, Mail, MapPin, Building2, ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import type { Salon, TranscriptEntry } from '@/lib/supabase/salonCrm';
import { parseSentiment } from '@/lib/supabase/salonCrm';

const INTEREST_COLOR: Record<string, string> = {
  positive: '#34C759',
  neutral: '#FF9F0A',
  negative: '#FF3B30',
  not_interested: '#FF3B30',
};

export default function SharedChatCard({
  channel,
  salon,
  entries,
}: {
  channel: 'whatsapp' | 'email';
  salon: Salon;
  entries: TranscriptEntry[];
}) {
  const Icon = channel === 'whatsapp' ? MessageSquare : Mail;
  const accentColor = channel === 'whatsapp' ? '#34C759' : '#007AFF';
  const inboundCount = entries.filter((e) => e.direction === 'inbound').length;
  const outboundCount = entries.filter((e) => e.direction === 'outbound').length;

  const sentimentRaw = channel === 'whatsapp' ? salon.whatsapp_sentiment : salon.email_sentiment;
  const sentiment = parseSentiment(sentimentRaw);
  const sentimentColor = (sentiment.interest && INTEREST_COLOR[sentiment.interest]) || '#8E8E93';

  return (
    <div
      style={{
        height: '100vh',
        background: '#0a0a0c',
        color: '#f5f5f7',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '20px 24px',
            marginBottom: '16px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  background: `${accentColor}22`,
                  color: accentColor,
                  padding: '10px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: accentColor }}>
                  {channel === 'whatsapp' ? 'WhatsApp Conversation' : 'Email Conversation'}
                </div>
                <div style={{ fontSize: '19px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {salon.salon_name}
                </div>
              </div>
            </div>

            {sentiment.interest && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: `${sentimentColor}1a`,
                  border: `1px solid ${sentimentColor}40`,
                  color: sentimentColor,
                  padding: '5px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                title={sentiment.summary ?? undefined}
              >
                <Sparkles size={11} /> {sentiment.interest.replace(/_/g, ' ')}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Building2 size={12} /> {salon.category?.replace(/_/g, ' ') || 'Salon'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={12} /> {[salon.city, salon.region].filter(Boolean).join(', ') || 'Unknown location'}
            </span>
            {salon.whatsapp_number && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MessageSquare size={12} /> {salon.whatsapp_number}
              </span>
            )}
            {salon.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={12} /> {salon.email}
              </span>
            )}
          </div>

          {sentiment.summary && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: '10px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
              &ldquo;{sentiment.summary}&rdquo;
              {sentiment.intent && <span style={{ color: 'rgba(255,255,255,0.35)' }}> · intent: {sentiment.intent.replace(/_/g, ' ')}</span>}
            </p>
          )}

          <div style={{ display: 'flex', gap: '16px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ArrowDownLeft size={12} /> {inboundCount} received
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ArrowUpRight size={12} /> {outboundCount} sent
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{entries.length} total messages</span>
          </div>
        </div>

        {/* Chat thread — the only scrollable region */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '20px 24px',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              No messages yet in this conversation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: channel === 'whatsapp' ? '10px' : '14px' }}>
              {entries.map((entry, idx) =>
                channel === 'whatsapp' ? (
                  <div
                    key={idx}
                    style={{
                      alignSelf: entry.direction === 'inbound' ? 'flex-start' : 'flex-end',
                      maxWidth: '78%',
                      background: entry.direction === 'inbound' ? 'rgba(255,255,255,0.08)' : 'rgba(0,122,255,0.18)',
                      padding: '10px 14px',
                      borderRadius: '14px',
                    }}
                  >
                    <p style={{ fontSize: '13.5px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{entry.message}</p>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: '6px' }}>
                      {new Date(entry.at).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div
                    key={idx}
                    style={{
                      background: entry.direction === 'inbound' ? 'rgba(255,255,255,0.06)' : 'rgba(0,122,255,0.1)',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      borderLeft: `3px solid ${entry.direction === 'inbound' ? '#34C759' : '#007AFF'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {entry.direction === 'inbound' ? 'Received' : 'Sent'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{new Date(entry.at).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '13.5px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
                      {entry.message}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          Shared read-only view · Shills Growth OS
        </div>
      </div>
    </div>
  );
}
