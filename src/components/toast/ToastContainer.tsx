'use client';

import React from 'react';
import { useToast } from '@/context/toast/ToastContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9999] flex flex-col items-end justify-start sm:justify-end p-4 space-y-3"
      style={{ top: 'auto', bottom: 0 }}
    >
      <div className="flex flex-col items-end space-y-3 w-full max-w-md">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;