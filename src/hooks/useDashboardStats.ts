import { useState, useEffect } from 'react';
import { apiService, DashboardStats, LiveCall, Agent } from '@/services/api';

// Extended stats interface to include additional data needed for the dashboard
export interface ExtendedDashboardStats extends DashboardStats {
  talkingAgents: number;
  callingAgents: number;
  availableAgents: number;
  busyAgents: number;
  awayAgents: number;
  totalDialedCalls: number;
  connectedCalls: number;
  disconnectedCalls: number;
  followUpCalls: number;
  callbacks: number;
  serviceLevel: number;
  passedSla: number;
  failedSla: number;
  fcr: number;
  far: number;
  rightPartyContactRate: number;
  ptpFulfillment: number;
  averageTalkTime: string;
  longestTalkTime: string;
  avgCallAttemptDuration: string;
  totalCollected: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<ExtendedDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [dashboardStats, liveCallsData, agentsData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getLiveCalls(),
        apiService.getAgents()
      ]);
      
      // Calculate extended stats
      const talkingAgents = agentsData.filter(agent => agent.status === 'talking' || agent.status === 'on_call').length;
      const callingAgents = liveCallsData.filter(call => call.status === 'ringing' || call.status === 'talking').length;
      const availableAgents = agentsData.filter(agent => agent.status === 'available' && agent.is_logged_in).length;
      const busyAgents = agentsData.filter(agent => agent.status === 'busy' || agent.status === 'on_hold').length;
      const awayAgents = agentsData.filter(agent => agent.status === 'away' || agent.status === 'break').length;
      
      // For now, we'll use some mock calculations for the other stats
      // In a real implementation, these would come from the API
      const totalDialedCalls = 141;
      const connectedCalls = 94;
      const disconnectedCalls = 47;
      const followUpCalls = 21;
      const callbacks = 21;
      const serviceLevel = 93.6;
      const passedSla = 70;
      const failedSla = 30;
      const fcr = 86.1;
      const far = 86.1;
      const rightPartyContactRate = 5.7;
      const ptpFulfillment = 100;
      const averageTalkTime = "03:15";
      const longestTalkTime = "03:22";
      const avgCallAttemptDuration = "00:20";
      const totalCollected = 30000;
      
      const extendedStats: ExtendedDashboardStats = {
        ...dashboardStats,
        talkingAgents,
        callingAgents,
        availableAgents,
        busyAgents,
        awayAgents,
        totalDialedCalls,
        connectedCalls,
        disconnectedCalls,
        followUpCalls,
        callbacks,
        serviceLevel,
        passedSla,
        failedSla,
        fcr,
        far,
        rightPartyContactRate,
        ptpFulfillment,
        averageTalkTime,
        longestTalkTime,
        avgCallAttemptDuration,
        totalCollected
      };
      
      setStats(extendedStats);
      setLiveCalls(liveCallsData);
      setAgents(agentsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard stats');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, liveCalls, agents, loading, error, refresh: fetchStats };
};
