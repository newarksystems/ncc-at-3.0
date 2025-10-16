import { useCallback } from 'react';
import { useToast } from '@/context/toast/ToastContext';
import type { ToastType } from '@/context/toast/ToastContext';

export const useToastNotifications = () => {
  const { showToast } = useToast();

  const showSuccess = useCallback((title: string, description?: string, duration?: number) => {
    return showToast({
      type: 'success',
      title,
      description,
      duration,
    });
  }, [showToast]);

  const showError = useCallback((title: string, description?: string, duration?: number) => {
    return showToast({
      type: 'error',
      title,
      description,
      duration,
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, description?: string, duration?: number) => {
    return showToast({
      type: 'warning',
      title,
      description,
      duration,
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, description?: string, duration?: number) => {
    return showToast({
      type: 'info',
      title,
      description,
      duration,
    });
  }, [showToast]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};