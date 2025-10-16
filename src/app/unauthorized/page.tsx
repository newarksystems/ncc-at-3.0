'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a2332] p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-red-400 mb-4">Access Denied</h2>
        <p className="text-slate-400 mb-8 max-w-md">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => router.back()}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            Go Back
          </Button>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}