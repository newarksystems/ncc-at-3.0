import { useState, useEffect } from "react";
import { apiService, LiveCall } from "@/services/api";
import { useUserStore } from "@/stores/userStore";

interface UseLiveCallsResult {
  liveCalls: LiveCall[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLiveCalls(): UseLiveCallsResult {
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useUserStore();

  const fetchLiveCalls = async () => {
    setLoading(true);
    try {
      const calls = await apiService.getLiveCalls();
      setLiveCalls(calls);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch live calls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCalls();
  }, []);

  return {
    liveCalls,
    loading,
    error,
    refresh: fetchLiveCalls,
  };
}