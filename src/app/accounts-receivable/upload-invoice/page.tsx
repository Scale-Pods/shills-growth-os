import { getReceivablesServiceClient, type PartyLedgerRow } from '@/lib/supabase/receivables';
import UploadInvoiceClient from './UploadInvoiceClient';

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

export default async function UploadInvoicePage() {
  const rows = await fetchLedger();
  return <UploadInvoiceClient rows={rows} />;
}
