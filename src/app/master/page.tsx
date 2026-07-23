import { getSalonCrmServiceClient, type Salon, type WhatsappLog, type EmailLog } from '@/lib/supabase/salonCrm';
import MasterDashboard from './MasterDashboard';

export const dynamic = 'force-dynamic';

async function fetchSalonCrmData() {
  const supabase = getSalonCrmServiceClient();

  const [salonsRes, waRes, emailRes] = await Promise.all([
    supabase.from('salons').select('*'),
    supabase.from('whatsapp_logs').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(1000),
  ]);

  if (salonsRes.error) console.error('Failed to fetch salons:', salonsRes.error.message);
  if (waRes.error) console.error('Failed to fetch whatsapp_logs:', waRes.error.message);
  if (emailRes.error) console.error('Failed to fetch email_logs:', emailRes.error.message);

  return {
    salons: (salonsRes.data as Salon[]) ?? [],
    whatsappLogs: (waRes.data as WhatsappLog[]) ?? [],
    emailLogs: (emailRes.data as EmailLog[]) ?? [],
  };
}

export default async function MasterDashboardPage() {
  const salonCrm = await fetchSalonCrmData();
  return <MasterDashboard salonCrm={salonCrm} />;
}
