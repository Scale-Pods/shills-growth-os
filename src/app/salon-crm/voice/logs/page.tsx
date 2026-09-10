import { fetchSalons } from '../../_data/salons';
import { fetchVapiCalls } from '../../_data/vapiCalls';
import VoiceSection from '../VoiceSection';

export const dynamic = 'force-dynamic';

export default async function SalonCrmVoiceLogsPage() {
  const [salons, logs] = await Promise.all([fetchSalons(), fetchVapiCalls()]);
  return <VoiceSection logs={logs} salons={salons} view="logs" />;
}
