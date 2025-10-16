import { create } from 'zustand';
import { LiveCall, Agent, DashboardStats } from '@/types';

interface ActivityState {
  // Live Calls
  liveCalls: LiveCall[];
  updateLiveCalls: (calls: LiveCall[]) => void;
  addLiveCall: (call: LiveCall) => void;
  removeLiveCall: (callId: string) => void;
  updateLiveCall: (callId: string, updatedCall: Partial<LiveCall>) => void;
  
  // Active Agents
  activeAgents: Agent[];
  updateActiveAgents: (agents: Agent[]) => void;
  addActiveAgent: (agent: Agent) => void;
  removeActiveAgent: (agentId: string) => void;
  updateActiveAgent: (agentId: string, updatedAgent: Partial<Agent>) => void;
  
  // Dashboard Stats
  dashboardStats: DashboardStats | null;
  updateDashboardStats: (stats: DashboardStats) => void;
  
  // WebSocket connection status
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
  wsError: string | null;
  setWsError: (error: string | null) => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  // Live Calls
  liveCalls: [],
  updateLiveCalls: (calls) => set({ liveCalls: calls }),
  addLiveCall: (call) => set((state) => ({ 
    liveCalls: [...state.liveCalls, call] 
  })),
  removeLiveCall: (callId) => set((state) => ({ 
    liveCalls: state.liveCalls.filter(call => call.id !== callId) 
  })),
  updateLiveCall: (callId, updatedCall) => set((state) => ({
    liveCalls: state.liveCalls.map(call => 
      call.id === callId ? { ...call, ...updatedCall } : call
    )
  })),
  
  // Active Agents
  activeAgents: [],
  updateActiveAgents: (agents) => set({ activeAgents: agents }),
  addActiveAgent: (agent) => set((state) => ({ 
    activeAgents: [...state.activeAgents, agent] 
  })),
  removeActiveAgent: (agentId) => set((state) => ({ 
    activeAgents: state.activeAgents.filter(agent => agent.id !== agentId) 
  })),
  updateActiveAgent: (agentId, updatedAgent) => set((state) => ({
    activeAgents: state.activeAgents.map(agent => 
      agent.id === agentId ? { ...agent, ...updatedAgent } : agent
    )
  })),
  
  // Dashboard Stats
  dashboardStats: null,
  updateDashboardStats: (stats) => set({ dashboardStats: stats }),
  
  // WebSocket connection status
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
  wsError: null,
  setWsError: (error) => set({ wsError: error }),
}));