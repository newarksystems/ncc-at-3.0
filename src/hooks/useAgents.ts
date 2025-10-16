import { useState, useEffect, useCallback } from 'react';
import { apiService, Agent } from '@/services/api';
import { useUserStore } from '@/stores/userStore';
import useWebSocket from '@/hooks/useWebSocket';

interface UseAgentsProps {
  page?: number;
  size?: number;
  status?: string;
  department?: string;
}

interface UseAgentsResult {
  agents: Agent[];
  total: number;
  loading: boolean;
  error: string | null;
  refresh: (designation?: string) => void;
  currentUser: any; // Using 'any' because the return type expects User type, but we're passing the Zustand store user
}

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const useAgents = ({ page = 1, size = 15, status, department }: UseAgentsProps = {}): UseAgentsResult => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useUserStore();

  const fetchAgents = useCallback(async (designation?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Use the user from Zustand store
      if (!currentUser) {
        // If user is not in store, we can't proceed as we need user data for proper filtering
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      console.log('useAgents - fetchAgents called with:', { 
        currentUser: { role: currentUser.role, designation: currentUser.designation },
        designation,
        page,
        size
      });

      // Determine designation for super-admin or specific role
      // For super-admin, pass undefined so backend uses "super-admin"
      // For admin, pass undefined so backend uses current_user.designation from JWT
      const effectiveDesignation = undefined; // Let backend determine from JWT token

      console.log('useAgents - effective designation:', effectiveDesignation);

      // Fetch agents by designation - pass undefined for department since backend uses JWT
      const result = await apiService.getAgentsByDesignation(page, size, status, effectiveDesignation);
      
      console.log('useAgents - Raw API result:', result);
      console.log('useAgents - Result type:', typeof result, 'Is array:', Array.isArray(result));
      
      if (Array.isArray(result) && result.length === 2) {
        const [agentsData, totalCount] = result;
        console.log('useAgents - Destructured:', { agentsData: agentsData?.length || 0, totalCount });
        setAgents(agentsData || []);
        setTotal(totalCount || 0);
      } else {
        console.error('useAgents - Unexpected result format:', result);
        setAgents([]);
        setTotal(0);
      }
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch agents';
      setError(errorMessage);
      console.error('Error fetching agents:', err);
      // Set empty array on error to prevent undefined
      setAgents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentUser, page, size, status]);

  // Debounced refresh function
  const refresh = useCallback(debounce((designation?: string) => {
    fetchAgents(designation);
  }, 1000), [fetchAgents]);

  // WebSocket integration
  const wsUrl = currentUser
    ? `ws://localhost:8000/api/ws/agents?designation=${encodeURIComponent(currentUser?.designation || 'all')}&token=${encodeURIComponent(localStorage.getItem('access_token') || '')}`
    : 'ws://localhost:8000/api/ws/agents?designation=all';

  useWebSocket({
    url: wsUrl,
    subscriptions: ['agents'],
    onMessage: useCallback((data: any) => {
      console.log('WebSocket message received:', data);
      if (data.type === 'agent_update' || data.type === 'agent_status_change') {
        const designation = currentUser?.role === 'super-admin' ? undefined : currentUser?.designation;
        refresh(designation);
      }
    }, [currentUser, refresh]),
    onError: (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to real-time updates. Retrying...');
    },
    onOpen: () => {
      console.log('WebSocket opened for useAgents');
      setError(null);
    },
    onClose: (event) => {
      console.log('WebSocket closed for useAgents:', event.code, event.reason);
    },
  });

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, total, loading, error, refresh, currentUser };
};