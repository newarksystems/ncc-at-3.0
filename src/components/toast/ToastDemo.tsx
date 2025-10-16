'use client';

import React from 'react';
import { useToastNotifications } from '@/hooks/useToastNotifications';

const ToastDemo: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToastNotifications();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Toast Notification Demo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => showSuccess('Success!', 'Operation completed successfully.')}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          Show Success
        </button>
        
        <button
          onClick={() => showError('Error!', 'Failed to complete operation.')}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          Show Error
        </button>
        
        <button
          onClick={() => showWarning('Warning!', 'This action requires attention.')}
          className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded"
        >
          Show Warning
        </button>
        
        <button
          onClick={() => showInfo('Information', 'Here is some useful information.')}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Show Info
        </button>
      </div>
    </div>
  );
};

export default ToastDemo;