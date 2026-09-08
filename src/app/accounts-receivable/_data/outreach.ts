import { getReceivablesServiceClient, type RecoveryOutreachRow } from '@/lib/supabase/receivables';

/** Server-only fetch of every recovery_outreach row, newest first. */
export async function fetchRecoveryOutreach(): Promise<RecoveryOutreachRow[]> {
  const supabase = getReceivablesServiceClient();
  const { data, error } = await supabase
    .from('recovery_outreach')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch recovery_outreach:', error.message);
    return [];
  }
  return (data as RecoveryOutreachRow[]) ?? [];
}
