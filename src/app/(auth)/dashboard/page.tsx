'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    } else if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user role and designation
      if (user.role === 'super-admin') {
        router.push('/admin/superadmin');
      } else if (user.role === 'admin') {
        switch (user.designation) {
          case 'call-center-admin':
            router.push('/admin/callcenter');
            break;
          case 'marketing-admin':
            router.push('/admin/marketing');
            break;
          case 'compliance-admin':
            router.push('/admin/compliance');
            break;
          default:
            router.push('/admin/callcenter');
        }
      } else if (user.role === 'agent') {
        router.push('/agentdash');
      } else if (user.role === 'viewer') {
        router.push('/viewer');
      } else {
        // Default fallback
        router.push('/admin/callcenter');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
      <div className="text-white">Redirecting to your dashboard...</div>
    </div>
  );
}