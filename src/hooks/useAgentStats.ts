import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/api";
import { AgentStats, AgentCall, QueueStatus } from "@/types";

interface UseAgentStatsResult {
  stats: AgentStats | null;
  calls: AgentCall[];
  queueStatus: QueueStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAgentStats(userId: string): UseAgentStatsResult {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [calls, setCalls] = useState<AgentCall[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Fetch agentId based on userId
  const fetchAgentId = useCallback(async () => {
    try {
      const agent = await apiService.getAgentByUserId(userId);
      setAgentId(agent.id);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch agent ID");
      console.error(err);
      setLoading(false);
    }
  }, [userId]);

  const fetchData = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      // Fetch agent stats
      const statsData = await apiService.getAgentStats(agentId);
      setStats(statsData);

      // Fetch recent calls
      const callsData = await apiService.getAgentCalls(agentId, { limit: 10, offset: 0 });
      setCalls(callsData);

      // Fetch queue status
      const queueData = await apiService.getQueueStatus(agentId);
      setQueueStatus(queueData);

      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch agent data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgentId();
  }, [fetchAgentId]);

  useEffect(() => {
    if (agentId) {
      fetchData();
    }
  }, [agentId, fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { stats, calls, queueStatus, loading, error, refresh };
}