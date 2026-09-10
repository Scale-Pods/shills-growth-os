import { Phone, MapPin, Building2, Clock, Sparkles, PlayCircle } from 'lucide-react';
import type { Salon } from '@/lib/supabase/salonCrm';
import { parseSentiment } from '@/lib/supabase/salonCrm';
import {
  parseVoiceTranscript,
  callOutcome,
  formatDuration,
  formatUsd,
  type VapiCallLog,
} from '@/lib/supabase/vapiCalls';

const INTEREST_COLOR: Record<string, string> = {
  positive: '#34C759',
  neutral: '#FF9F0A',
  negative: '#FF3B30',
  not_interested: '#FF3B30',
};

const OUTCOME_LABEL: Record<string, string> = {
  connected: 'Connected',
  voicemail: 'Voicemail',
  no_answer: 'No answer',
  unknown: 'Unknown',
};

export default function SharedVoiceCard({
  log,
  salon,
  recordingUrl,
}: {
  log: VapiCallLog;
  salon: Salon | null;
  recordingUrl: string | null;
}) {
  const accentColor = '#AF52DE';
  const outcome = callOutcome(log);

  const turnsFromLog = parseVoiceTranscript(log.transcript);
  const turns = turnsFromLog.length > 0 ? turnsFromLog : parseVoiceTranscript(salon?.conversation_transcript_voice);
  const rawTranscript = log.transcript ?? salon?.conversation_transcript_voice ?? null;

  const sentiment = parseSentiment(salon?.voice_sentiment ?? null);
  const sentimentColor = (sentiment.interest && INTEREST_COLOR[sentiment.interest]) || '#8E8E93';

  const startedAt = log.started_at ?? log.created_at ?? salon?.voice_call_at ?? null;
  const title = salon?.salon_name ?? log.customer_name ?? 'Voice call';

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
                <Phone size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: accentColor }}>
                  AI Voice Call
                </div>
                <div style={{ fontSize: '19px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {title}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.75)',
                padding: '5px 10px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Phone size={11} /> {OUTCOME_LABEL[outcome] ?? 'Unknown'}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)' }}>
            {salon && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={12} /> {salon.category?.replace(/_/g, ' ') || 'Salon'}
              </span>
            )}
            {salon && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={12} /> {[salon.city, salon.region].filter(Boolean).join(', ') || 'Unknown location'}
              </span>
            )}
            {(log.customer_phone || salon?.phone) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={12} /> {log.customer_phone ?? salon?.phone}
              </span>
            )}
            {startedAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={12} /> {new Date(startedAt).toLocaleString()}
              </span>
            )}
          </div>

          {sentiment.summary && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: '10px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
              &ldquo;{sentiment.summary}&rdquo;
              {sentiment.intent && <span style={{ color: 'rgba(255,255,255,0.35)' }}> · intent: {sentiment.intent.replace(/_/g, ' ')}</span>}
            </p>
          )}

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={12} /> {formatDuration(log.duration_seconds)} talk time
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{formatUsd(log.cost_usd)}</span>
            {sentiment.interest && (
              <span
                style={{
                  fontSize: '12px',
                  color: sentimentColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              >
                <Sparkles size={12} /> {sentiment.interest.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Body — the only scrollable region */}
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
          {recordingUrl && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <PlayCircle size={12} /> Recording
              </div>
              <audio controls src={recordingUrl} style={{ width: '100%' }} />
            </div>
          )}

          {log.summary && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '8px' }}>
                Summary
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', margin: 0 }}>{log.summary}</p>
            </div>
          )}

          <div>
            <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '8px' }}>
              Transcript
            </div>
            {turns.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {rawTranscript ?? 'No transcript available for this call.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {turns.map((turn, idx) => {
                  const customer = turn.role === 'customer';
                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: customer ? 'flex-start' : 'flex-end',
                        maxWidth: '80%',
                        background: customer ? 'rgba(255,255,255,0.08)' : 'rgba(175,82,222,0.2)',
                        padding: '10px 14px',
                        borderRadius: '14px',
                      }}
                    >
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {turn.role === 'customer' ? 'Salon' : turn.role === 'system' ? 'System' : 'Alka'}
                      </span>
                      <p style={{ fontSize: '13.5px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{turn.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          Shared read-only view · Shills Growth OS
        </div>
      </div>
    </div>
  );
}
