import { getSalonCrmServiceClient, type Salon, type OutreachSequence } from '@/lib/supabase/salonCrm';
import SalonCrmDashboard from './SalonCrmDashboard';

export const dynamic = 'force-dynamic';

async function fetchData() {
  const supabase = getSalonCrmServiceClient();

  const [salonsRes, outreachRes] = await Promise.all([
    supabase.from('salons').select('*'),
    supabase.from('outreach_sequences').select('*').order('executed_at', { ascending: false }).limit(2000),
  ]);

  if (salonsRes.error) console.error('Failed to fetch salons:', salonsRes.error.message);
  if (outreachRes.error) console.error('Failed to fetch outreach_sequences:', outreachRes.error.message);

  return {
    salons: (salonsRes.data as Salon[]) ?? [],
    outreachSequences: (outreachRes.data as OutreachSequence[]) ?? [],
  };
}

export default async function SalonCrmDashboardPage() {
  const { salons, outreachSequences } = await fetchData();
  return <SalonCrmDashboard salons={salons} outreachSequences={outreachSequences} />;
}
