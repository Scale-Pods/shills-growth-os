import { fetchRecoveryOutreach } from '../../_data/outreach';
import EmailSection from '../EmailSection';

export const dynamic = 'force-dynamic';

export default async function ReceivablesEmailReceivedPage() {
  const rows = await fetchRecoveryOutreach();
  return <EmailSection rows={rows} view="received" />;
}
