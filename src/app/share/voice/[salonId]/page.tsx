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

/** The salon's most recent voice call: latest vapi_call_logs row with master_leads_id = salonId. */
async function fetchLatestCallForSalon(salonId: string): Promise<VapiCallLog | null> {
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
    return null;
  }
  return (data as VapiCallLog) ?? null;
}

export default async function SharedVoicePage({ params }: { params: Promise<{ salonId: string }> }) {
  const { salonId: rawId } = await params;
  const salonId = decodeURIComponent(rawId);

  const [salon, log] = await Promise.all([fetchSalonById(salonId), fetchLatestCallForSalon(salonId)]);

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
