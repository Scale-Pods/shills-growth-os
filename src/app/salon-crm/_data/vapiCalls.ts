import { getSalonCrmServiceClient } from '@/lib/supabase/salonCrm';
import type { VapiCallLog } from '@/lib/supabase/vapiCalls';

/**
 * Server-only fetch of every VAPI voice-call row, newest first.
 *
 * NOTE: `vapi_call_logs` was created outside this repo and, until
 * database/sql/salon_crm/24_vapi_call_logs_grant.sql is applied, the
 * service_role has no SELECT privilege on it — the query then returns a
 * permission error and this resolves to []. The page renders an empty state
 * rather than crashing.
 */
export async function fetchVapiCalls(): Promise<VapiCallLog[]> {
  const supabase = getSalonCrmServiceClient();
  const { data, error } = await supabase
    .from('vapi_call_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    console.error('Failed to fetch vapi_call_logs:', error.message);
    return [];
  }
  return (data as VapiCallLog[]) ?? [];
}
