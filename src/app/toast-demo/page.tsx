'use client';

import React from 'react';
import { useToastNotifications } from '@/hooks/useToastNotifications';

export default function ToastDemoPage() {
  const { showSuccess, showError, showWarning, showInfo } = useToastNotifications();

  const handleShowSuccess = () => {
    showSuccess('Success!', 'Your action was completed successfully.');
  };

  const handleShowError = () => {
    showError('Error!', 'Something went wrong. Please try again.');
  };

  const handleShowWarning = () => {
    showWarning('Warning!', 'This action requires attention.');
  };

  const handleShowInfo = () => {
    showInfo('Information', 'Here is some useful information for you.');
  };

  const handleShowPersistent = () => {
    showInfo('Persistent Toast', 'This toast will not auto-dismiss.', 0);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Toast Notification Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Types</h2>
            <div className="space-y-4">
              <button
                onClick={handleShowSuccess}
                className="w-full bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
              >
                Show Success Toast
              </button>
              
              <button
                onClick={handleShowError}
                className="w-full bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition"
              >
                Show Error Toast
              </button>
              
              <button
                onClick={handleShowWarning}
                className="w-full bg-orange-500 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition"
              >
                Show Warning Toast
              </button>
              
              <button
                onClick={handleShowInfo}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
              >
                Show Info Toast
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Special Cases</h2>
            <div className="space-y-4">
              <button
                onClick={handleShowPersistent}
                className="w-full bg-purple-500 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition"
              >
                Show Persistent Toast
              </button>
              
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-2">Usage Examples:</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Success: After form submission</li>
                  <li>• Error: When API calls fail</li>
                  <li>• Warning: Validation issues</li>
                  <li>• Info: General notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Guide</h2>
          <pre className="bg-slate-700 p-4 rounded-lg overflow-x-auto text-sm">
            {`// Import the hook
import { useToastNotifications } from '@/hooks/useToastNotifications';

// In your component
const { showSuccess, showError, showWarning, showInfo } = useToastNotifications();

// Show a success toast
showSuccess('Success!', 'Your action was completed.');

// Show an error toast with custom duration (10 seconds)
showError('Error!', 'Something went wrong.', 10000);

// Show a persistent toast (won't auto-dismiss)
showInfo('Information', 'This is important.', 0);`}
          </pre>
        </div>
      </div>
    </div>
  );
}