import { create } from 'zustand';
import { Call } from '@/types';

interface CallState {
  activeCalls: Call[];
  callHistory: Call[];
  currentCall: Call | null;
  callStats: {
    totalCalls: number;
    answeredCalls: number;
    unansweredCalls: number;
    missedCalls: number;
    averageDuration: number;
  };
  currentCallState: 'idle' | 'dialing' | 'ringing' | 'in-call' | 'ended' | 'on-hold';
  callTimer: number;
  isMuted: boolean;
  isOnHold: boolean;
  isCallModalOpen: boolean;
  setCallState: (state: CallState['currentCallState']) => void;
  setCallTimer: (seconds: number | ((prev: number) => number)) => void;
  updateCallStats: (stats: Partial<CallState['callStats']>) => void;
  incrementCallStat: (stat: 'totalCalls' | 'answeredCalls' | 'unansweredCalls' | 'missedCalls') => void;
  setMuted: (muted: boolean) => void;
  setOnHold: (onHold: boolean) => void;
  addCall: (call: Call) => void;
  updateCall: (callId: string, updates: Partial<Call>) => void;
  setCurrentCall: (call: Call | null) => void;
  endCurrentCall: () => void;
  resetCallState: () => void;
  startCallTimer: () => void;
  openCallModal: () => void;
  closeCallModal: () => void;
  stopCallTimer: () => void;
  resetCallTimer: () => void;
}

const useCallStore = create<CallState>((set, get) => ({
  activeCalls: [],
  callHistory: [],
  currentCall: null,
  callStats: {
    totalCalls: 0,
    answeredCalls: 0,
    unansweredCalls: 0,
    missedCalls: 0,
    averageDuration: 0,
  },
  currentCallState: 'idle',
  callTimer: 0,
  isMuted: false,
  isOnHold: false,
  isCallModalOpen: false,
  
  setCallState: (state) => set({ currentCallState: state }),
  
  setCallTimer: (seconds) => set((state) => ({
    callTimer: typeof seconds === 'function' ? seconds(state.callTimer) : seconds
  })),
  
  updateCallStats: (stats) => set((state) => ({
    callStats: { ...state.callStats, ...stats }
  })),
  
  incrementCallStat: (stat) => set((state) => ({
    callStats: {
      ...state.callStats,
      [stat]: state.callStats[stat] + 1
    }
  })),
  
  setMuted: (muted) => set({ isMuted: muted }),
  
  setOnHold: (onHold) => set({ isOnHold: onHold }),
  
  addCall: (call) => set((state) => {
    // Update stats based on call status
    let newStats = { ...state.callStats };
    
    if (call.status === 'answered' || call.status === 'talking') {
      newStats.answeredCalls += 1;
    } else if (call.status === 'unanswered' || call.status === 'missed') {
      newStats.unansweredCalls += 1;
    }
    
    newStats.totalCalls += 1;
    
    return {
      callHistory: [...state.callHistory, call],
      activeCalls: (call.status === 'talking' || call.status === 'ringing' || call.status === 'dialing') 
        ? [...state.activeCalls, call] 
        : state.activeCalls,
      currentCall: (call.status === 'talking' || call.status === 'ringing' || call.status === 'dialing') 
        ? call 
        : state.currentCall,
      callStats: newStats
    };
  }),
  
  updateCall: (callId, updates) => set((state) => {
    const updatedCall = state.activeCalls.find(call => call.id === callId) || 
                       state.callHistory.find(call => call.id === callId);
    
    // If we're updating a call status, potentially update stats
    let newStats = { ...state.callStats };
    if (updates.status && updatedCall?.status !== updates.status) {
      // Adjust stats based on old and new status
      if (updatedCall?.status === 'answered' || updatedCall?.status === 'talking') {
        newStats.answeredCalls = Math.max(0, newStats.answeredCalls - 1);
      } else if (updatedCall?.status === 'unanswered' || updatedCall?.status === 'missed') {
        newStats.unansweredCalls = Math.max(0, newStats.unansweredCalls - 1);
      }
      
      if (updates.status === 'answered' || updates.status === 'talking') {
        newStats.answeredCalls += 1;
      } else if (updates.status === 'unanswered' || updates.status === 'missed') {
        newStats.unansweredCalls += 1;
      }
    }
    
    return {
      activeCalls: state.activeCalls.map(call => 
        call.id === callId ? { ...call, ...updates } : call
      ),
      callHistory: state.callHistory.map(call => 
        call.id === callId ? { ...call, ...updates } : call
      ),
      currentCall: state.currentCall?.id === callId 
        ? { ...state.currentCall, ...updates } 
        : state.currentCall,
      callStats: newStats
    };
  }),
  
  setCurrentCall: (call) => set({ currentCall: call }),
  
  endCurrentCall: () => set((state) => ({
    activeCalls: state.activeCalls.filter(call => call.id !== state.currentCall?.id),
    currentCall: null,
    currentCallState: 'idle',
    callTimer: 0,
    isMuted: false,
    isOnHold: false,
  })),
  
  resetCallState: () => set({
    currentCall: null,
    currentCallState: 'idle',
    callTimer: 0,
    isMuted: false,
    isOnHold: false,
  }),
  
  startCallTimer: () => {
    if ((get() as any).intervalId) {
      clearInterval((get() as any).intervalId);
    }
    
    const interval = setInterval(() => {
      set((state) => ({ callTimer: state.callTimer + 1 }));
    }, 1000);
    
    // Store interval ID in a way that can be accessed later
    (get() as any).intervalId = interval;
  },
  
  stopCallTimer: () => {
    if ((get() as any).intervalId) {
      clearInterval((get() as any).intervalId);
      delete (get() as any).intervalId;
    }
  },
  
  resetCallTimer: () => set({ callTimer: 0 }),
  
  openCallModal: () => set({ isCallModalOpen: true }),
  closeCallModal: () => set({ isCallModalOpen: false }),
}));

export default useCallStore;