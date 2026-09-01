import { getSalonCrmServiceClient, type Salon } from '@/lib/supabase/salonCrm';
import { normalizeTranscript } from '@/lib/supabase/transcript';
import SharedChatCard from '../../SharedChatCard';

export const dynamic = 'force-dynamic';

async function fetchSalonByWhatsapp(phone: string): Promise<Salon | null> {
  const supabase = getSalonCrmServiceClient();
  const { data, error } = await supabase
    .from('salons')
    .select('*')
    .eq('whatsapp_number', phone)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch salon by whatsapp_number:', error.message);
    return null;
  }
  return (data as Salon) ?? null;
}

export default async function SharedWhatsappPage({ params }: { params: Promise<{ phone: string }> }) {
  const { phone: rawPhone } = await params;
  const phone = decodeURIComponent(rawPhone);
  const salon = await fetchSalonByWhatsapp(phone);

  if (!salon) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>No conversation found for this number.</p>
      </div>
    );
  }

  const entries = normalizeTranscript(salon.conversation_transcript).sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  return <SharedChatCard channel="whatsapp" salon={salon} entries={entries} />;
}
