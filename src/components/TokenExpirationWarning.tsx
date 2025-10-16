'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { useUserStore } from '@/stores/userStore';

export default function TokenExpirationWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const { logout } = useUserStore();

  useEffect(() => {
    const handleTokenExpiring = (event: CustomEvent) => {
      setShowWarning(true);
    };

    const handleAuthLogout = () => {
      setShowWarning(false);
    };

    const handleSessionExtended = () => {
      setShowWarning(false);
    };

    window.addEventListener('auth-token-expiring', handleTokenExpiring as EventListener);
    window.addEventListener('auth-logout', handleAuthLogout);
    window.addEventListener('auth-session-extended', handleSessionExtended);

    return () => {
      window.removeEventListener('auth-token-expiring', handleTokenExpiring as EventListener);
      window.removeEventListener('auth-logout', handleAuthLogout);
      window.removeEventListener('auth-session-extended', handleSessionExtended);
    };
  }, []);

  const handleStaySignedIn = async () => {
    const success = await authService.extendSession();
    if (!success) {
      // If session extension failed, logout
      logout();
    }
  };

  const handleSignOut = () => {
    setShowWarning(false);
    logout();
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold text-sky-400 mb-4">Session Expiring</h2>
        <p className="text-slate-200 mb-6">
          Your session is about to expire. Would you like to stay signed in?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Sign Out
          </button>
          <button
            onClick={handleStaySignedIn}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md transition-colors"
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
}