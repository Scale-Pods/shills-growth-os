import { fetchSalons } from '../../_data/salons';
import WhatsappSection from '../WhatsappSection';

export const dynamic = 'force-dynamic';

export default async function SalonCrmWhatsappDashboardPage() {
  const salons = await fetchSalons();
  return <WhatsappSection salons={salons} view="dashboard" />;
}
