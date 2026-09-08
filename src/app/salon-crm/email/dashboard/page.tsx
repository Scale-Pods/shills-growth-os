import { fetchSalons } from '../../_data/salons';
import EmailSection from '../EmailSection';

export const dynamic = 'force-dynamic';

export default async function SalonCrmEmailDashboardPage() {
  const salons = await fetchSalons();
  return <EmailSection salons={salons} view="dashboard" />;
}
