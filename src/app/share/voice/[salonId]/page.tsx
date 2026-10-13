import { getSalonCrmServiceClient, type Salon } from '@/lib/supabase/salonCrm';
import type { VapiCallLog } from '@/lib/supabase/vapiCalls';
import SharedVoiceCard from '../../SharedVoiceCard';

export const dynamic = 'force-dynamic';

async function fetchSalonById(salonId: string): Promise<Salon | null> {
  const supabase = getSalonCrmServiceClient();
  const { data, error } = await supabase
    .from('salons')
    .select('*')
    .eq('id', salonId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch salon by id:', error.message);
    return null;
  }
  return (data as Salon) ?? null;
}

/** Digits-only tail of a phone number, for tolerant matching across formats. */
function phoneKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 7) return null;
  return digits.slice(-10);
}

/**
 * The salon's most recent voice call. Primary path: vapi_call_logs.master_leads_id = salonId.
 * Falls back to phone-tail matching against the salon's own phone/whatsapp_number for rows
 * the pipeline didn't (or couldn't) stamp with master_leads_id — mirrors VoiceSection.tsx.
 */
async function fetchLatestCallForSalon(salonId: string, salon: Salon | null): Promise<VapiCallLog | null> {
  const supabase = getSalonCrmServiceClient();
  const { data, error } = await supabase
    .from('vapi_call_logs')
    .select('*')
    .eq('master_leads_id', salonId)
    .order('started_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch vapi_call_logs by master_leads_id:', error.message);
  }
  if (data) return data as VapiCallLog;

  const keys = [phoneKey(salon?.phone), phoneKey(salon?.whatsapp_number)].filter(
    (k): k is string => k !== null
  );
  if (keys.length === 0) return null;

  const { data: candidates, error: phoneError } = await supabase
    .from('vapi_call_logs')
    .select('*')
    .order('started_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(200);

  if (phoneError || !candidates) {
    if (phoneError) console.error('Failed to fetch vapi_call_logs for phone fallback:', phoneError.message);
    return null;
  }

  const match = (candidates as VapiCallLog[]).find((c) => {
    const k = phoneKey(c.customer_phone);
    return k !== null && keys.includes(k);
  });
  return match ?? null;
}

export default async function SharedVoicePage({ params }: { params: Promise<{ salonId: string }> }) {
  const { salonId: rawId } = await params;
  const salonId = decodeURIComponent(rawId);

  const salon = await fetchSalonById(salonId);
  const log = await fetchLatestCallForSalon(salonId, salon);

  if (!salon || !log) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          {salon ? 'No voice call found for this salon.' : 'No salon found for this link.'}
        </p>
      </div>
    );
  }

  const recordingUrl = log.recording_url ?? salon.call_recording_url ?? null;

  return <SharedVoiceCard log={log} salon={salon} recordingUrl={recordingUrl} />;
}
