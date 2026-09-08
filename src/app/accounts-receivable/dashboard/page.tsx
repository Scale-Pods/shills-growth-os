import { getReceivablesServiceClient, type PartyLedgerRow } from '@/lib/supabase/receivables';
import { fetchRecoveryOutreach } from '../_data/outreach';
import ReceivablesDashboard from './ReceivablesDashboard';

export const dynamic = 'force-dynamic';

async function fetchLedger(): Promise<PartyLedgerRow[]> {
  const supabase = getReceivablesServiceClient();
  const { data, error } = await supabase
    .from('party_ledger')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch party_ledger:', error.message);
    return [];
  }
  return (data as PartyLedgerRow[]) ?? [];
}

export default async function AccountsReceivableDashboardPage() {
  const [ledger, outreach] = await Promise.all([fetchLedger(), fetchRecoveryOutreach()]);
  return <ReceivablesDashboard ledger={ledger} outreach={outreach} />;
}
