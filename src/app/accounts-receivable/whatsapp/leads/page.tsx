import { fetchRecoveryOutreach } from '../../_data/outreach';
import WhatsappSection from '../WhatsappSection';

export const dynamic = 'force-dynamic';

export default async function ReceivablesWhatsappLeadsPage() {
  const rows = await fetchRecoveryOutreach();
  return <WhatsappSection rows={rows} view="leads" />;
}
