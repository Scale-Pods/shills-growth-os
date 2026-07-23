import { getSalonCrmServiceClient, type Salon } from '@/lib/supabase/salonCrm';
import WhatsappPanel from './WhatsappPanel';

export const dynamic = 'force-dynamic';

async function fetchSalons(): Promise<Salon[]> {
  const supabase = getSalonCrmServiceClient();
  const { data, error } = await supabase
    .from('salons')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch salons:', error.message);
    return [];
  }
  return (data as Salon[]) ?? [];
}

export default async function WhatsappPage() {
  const salons = await fetchSalons();
  return <WhatsappPanel salons={salons} />;
}
