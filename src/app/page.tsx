'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from './ClientWrapper';

export default function Home() {
  const { isLoggedIn } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
        <p style={{ fontSize: '14px', color: 'var(--label-secondary)' }}>Loading Shills OS Board...</p>
      </div>
    </div>
  );
}
