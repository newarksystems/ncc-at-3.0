// src/providers/ZustandProvider.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { initializeAuth } from '@/utils/authSync';

export default function ZustandProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <>
      {children}
    </>
  );
}