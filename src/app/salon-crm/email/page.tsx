import { getSalonCrmServiceClient, type Salon } from '@/lib/supabase/salonCrm';
import EmailPanel from './EmailPanel';

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

export default async function EmailPage() {
  const salons = await fetchSalons();
  return <EmailPanel salons={salons} />;
}
