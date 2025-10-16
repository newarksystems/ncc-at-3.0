'use client';

import React, { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';

export default function UserStoreProvider({ children }: { children: React.ReactNode }) {
  const initializeFromStorage = useUserStore((state) => state.initializeFromStorage);

  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  return <>{children}</>;
}