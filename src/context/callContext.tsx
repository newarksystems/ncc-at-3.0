'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import atService from '@/services/africasTalkingService';

interface CallState {
  isConnected: boolean;
  currentCall: any | null;
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
}

interface CallContextType extends CallState {
  makeCall: (number: string) => Promise<void>;
  endCall: () => Promise<void>;
  getCallStatus: (sessionId: string) => Promise<any>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    currentCall: null,
    callStatus: 'idle',
  });

  const makeCall = useCallback(async (number: string) => {
    try {
      setCallState(prev => ({ ...prev, callStatus: 'calling' }));
      
      const result = await atService.makeCall({ to: number });
      
      setCallState(prev => ({
        ...prev,
        currentCall: result,
        callStatus: 'ringing',
        isConnected: true,
      }));
    } catch (error) {
      console.error('Failed to make call:', error);
      setCallState(prev => ({ ...prev, callStatus: 'idle' }));
      throw error;
    }
  }, []);

  const endCall = useCallback(async () => {
    setCallState({
      isConnected: false,
      currentCall: null,
      callStatus: 'idle',
    });
  }, []);

  const getCallStatus = useCallback(async (sessionId: string) => {
    return atService.getCallStatus(sessionId);
  }, []);

  return (
    <CallContext.Provider
      value={{
        ...callState,
        makeCall,
        endCall,
        getCallStatus,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
