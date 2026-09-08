import { fetchRecoveryOutreach } from '../_data/outreach';
import VoiceClient from './VoiceClient';

export const dynamic = 'force-dynamic';

export default async function ReceivablesVoicePage() {
  const rows = await fetchRecoveryOutreach();
  return <VoiceClient rows={rows} />;
}
