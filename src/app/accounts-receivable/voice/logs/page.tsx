import { fetchRecoveryOutreach } from '../../_data/outreach';
import VoiceSection from '../VoiceSection';

export const dynamic = 'force-dynamic';

export default async function ReceivablesVoiceLogsPage() {
  const rows = await fetchRecoveryOutreach();
  return <VoiceSection rows={rows} view="logs" />;
}
