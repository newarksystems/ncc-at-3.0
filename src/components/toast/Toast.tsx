'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '@/context/toast/ToastContext';
import type { Toast as ToastType } from '@/context/toast/ToastContext';

interface ToastProps {
  toast: ToastType;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  const { hideToast } = useToast();
  const [progress, setProgress] = useState(100);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-white" />;
      case 'info':
        return <Info className="w-5 h-5 text-white" />;
      default:
        return <Info className="w-5 h-5 text-white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-orange-500';
      case 'info':
        return 'bg-blue-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-800';
      case 'error':
        return 'bg-rose-800';
      case 'warning':
        return 'bg-orange-800';
      case 'info':
        return 'bg-blue-800';
      default:
        return 'bg-blue-800';
    }
  };

  // Handle auto-dismiss progress bar
  useEffect(() => {
    if (toast.duration !== 0) { // 0 means no auto-dismiss
      const interval = 100; // Update every 100ms
      const decrement = (interval / (toast.duration || 5000)) * 100;
      
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0 && progressInterval.current) {
            clearInterval(progressInterval.current);
            hideToast(toast.id);
            return 0;
          }
          return prev - decrement;
        });
      }, interval);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [toast.duration, toast.id, hideToast]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className={`w-full max-w-sm rounded-lg shadow-lg p-4 pointer-events-auto ${getBackgroundColor()} relative overflow-hidden bg-opacity-100`}
      >
        {/* Progress bar */}
        {toast.duration !== 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div 
              className={`h-full ${getProgressColor()}`} 
              style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
            />
          </div>
        )}

        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-white">
              {toast.title}
            </p>
            {toast.description && (
              <p className="mt-1 text-sm text-white/90">
                {toast.description}
              </p>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              onClick={() => hideToast(toast.id)}
              className="rounded-md inline-flex text-white/80 hover:text-white focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Toast;