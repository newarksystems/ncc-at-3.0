import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/authContext';

interface AgentDashboardStats {
  totalCalls: number;
  answeredCalls: number;
  unansweredCalls: number;
  ptpCustomers: number;
  ptpTotalAmount: number;
  totalAmountCollected: number;
  averageTalkingTime: string;
  longestTalkingTime: string;
}

export const useAgentDashboardStats = () => {
  const [stats, setStats] = useState<AgentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // This would be replaced with actual API call
      const agentStats = await apiService.getAgentStats(user.id);
      
      // Transform API response to match our interface
      setStats({
        totalCalls: agentStats.total_calls || 0,
        answeredCalls: agentStats.answered_calls || 0,
        unansweredCalls: agentStats.unanswered_calls || 0,
        ptpCustomers: agentStats.ptp_customers || 0,
        ptpTotalAmount: agentStats.ptp_total_amount || 0,
        totalAmountCollected: agentStats.total_amount_collected || 0,
        averageTalkingTime: agentStats.average_talking_time || '0:00',
        longestTalkingTime: agentStats.longest_talking_time || '0:00'
      });
    } catch (err: any) {
      console.error('Error fetching agent stats:', err);
      setError(err.message || 'Failed to fetch agent statistics');
      
      // Fallback to mock data for development
      setStats({
        totalCalls: 45,
        answeredCalls: 38,
        unansweredCalls: 7,
        ptpCustomers: 12,
        ptpTotalAmount: 125000,
        totalAmountCollected: 89500,
        averageTalkingTime: '4:32',
        longestTalkingTime: '12:45'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
};
