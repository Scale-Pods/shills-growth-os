import { getSalonCrmServiceClient, type Salon } from '@/lib/supabase/salonCrm';

/** Server-only fetch of every salon row, newest activity first. */
export async function fetchSalons(): Promise<Salon[]> {
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
