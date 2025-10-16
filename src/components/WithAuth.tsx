'use client';

import React from 'react';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';

interface WithAuthProps {
  children: React.ReactNode;
}

export const WithAuth: React.FC<WithAuthProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};