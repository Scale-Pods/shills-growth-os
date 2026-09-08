import { fetchSalons } from '../../_data/salons';
import WhatsappSection from '../WhatsappSection';

export const dynamic = 'force-dynamic';

export default async function SalonCrmWhatsappLeadsPage() {
  const salons = await fetchSalons();
  return <WhatsappSection salons={salons} view="leads" />;
}
