import { getSalonCrmServiceClient, type Salon } from '@/lib/supabase/salonCrm';
import ScraperClient from './ScraperClient';

export const dynamic = 'force-dynamic';

async function fetchScrapedSalons(): Promise<Salon[]> {
  const supabase = getSalonCrmServiceClient();
  const { data, error } = await supabase
    .from('salons')
    .select('*')
    .eq('lead_source', 'google_maps')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch scraped salons:', error.message);
    return [];
  }
  return (data as Salon[]) ?? [];
}

export default async function ScraperPage() {
  const salons = await fetchScrapedSalons();
  return <ScraperClient initialSalons={salons} />;
}
