'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen bg-slate-900">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white">Redirecting to dashboard...</div>
      </div>
    </div>
  );
}