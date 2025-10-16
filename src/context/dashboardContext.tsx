import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService, DashboardStats, LiveCall, CallStats, Agent  } from '@/services/api';
import { useUserStore } from '@/stores/userStore';
import { AdminDesignation } from '@/types';

interface DashboardData {
  stats: DashboardStats | null;
  liveCalls: LiveCall[] | null;
  callStats: CallStats | null;
  agents: Agent[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface DashboardContextType {
  dashboardData: DashboardData;
  selectedDesignation: AdminDesignation | null;
  setSelectedDesignation: (designation: AdminDesignation | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: null,
    liveCalls: null,
    callStats: null,
    agents: null,
    loading: true,
    error: null,
    refresh: async () => {},
  });
  
  const [selectedDesignation, setSelectedDesignation] = useState<AdminDesignation | null>(null);
  const { user } = useUserStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDashboardData((prev) => ({ ...prev, loading: true, error: null }));

        // Determine what data to fetch based on user role
        const promises = [];
        const keys = [];
        
        // All users can see stats (but may be filtered by role and designation)
        if (user?.role === 'admin' && selectedDesignation) {
          // For admins, fetch stats with the selected designation
          promises.push(apiService.getDashboardStats(selectedDesignation));
          keys.push('stats');
        } else if (user?.role === 'super-admin') {
          // For super-admins, use the selected designation if provided, or fetch all stats
          promises.push(apiService.getDashboardStats(selectedDesignation || undefined));
          keys.push('stats');
        } else {
          // For non-admins, fetch stats without designation filter
          promises.push(apiService.getDashboardStats());
          keys.push('stats');
        }
        
        // Admin roles can see more data
        if (user?.role === 'super-admin' || user?.role === 'admin') {
          promises.push(apiService.getLiveCalls());
          promises.push(apiService.getCallStats());
          promises.push(apiService.getAgents());
          keys.push('liveCalls', 'callStats', 'agents');
        } 
        // Agents can see their own live calls and stats
        else if (user?.role === 'agent') {
          // For agents, we might want to filter to their own data
          promises.push(apiService.getLiveCalls());
          promises.push(apiService.getCallStats());
          keys.push('liveCalls', 'callStats');
        }
        // Viewers might have limited access
        else if (user?.role === 'viewer') {
          // Viewers might only see stats and call stats, not live data
          promises.push(apiService.getCallStats());
          keys.push('callStats');
        }

        const results = await Promise.allSettled(promises);
        
        const data: any = {
          stats: null,
          liveCalls: null,
          callStats: null,
          agents: null
        };
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            data[keys[index]] = result.value;
          }
        });

        setDashboardData({
          ...data,
          loading: false,
          error: null,
          refresh: fetchData,
        });
      } catch (error: any) {
        setDashboardData((prev) => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch dashboard data',
        }));
      }
    };

    // Start fetching data
    fetchData();
  }, [user?.role, user?.id, selectedDesignation]);

  return (
    <DashboardContext.Provider value={{ dashboardData, selectedDesignation, setSelectedDesignation }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};