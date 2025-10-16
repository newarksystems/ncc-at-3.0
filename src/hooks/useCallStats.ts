// import { useState, useEffect, useCallback } from "react";
// import { apiService } from "@/services/api";

// interface HourlyCallStats {
//   [hour: string]: {
//     connected: number;
//     offline: number;
//     missed: number;
//     other: number;
//   };
// }

// interface UseCallStatsResult {
//   hourlyStats: HourlyCallStats | null;
//   loading: boolean;
//   error: string | null;
//   refresh: (designation?: string) => void;
// }

// export function useCallStats(): UseCallStatsResult {
//   const [hourlyStats, setHourlyStats] = useState<HourlyCallStats | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchStats = useCallback(async (designation?: string) => {
//     setLoading(true);
//     try {
//       const agentType = designation
//         ? {
//             "call-center-admin": "recovery-agent",
//             "marketing-admin": "marketing-agent",
//             "compliance-admin": "compliance-agent",
//           }[designation]
//         : undefined;
//       const statsData = await apiService.getCallStats(undefined, undefined, undefined, undefined, agentType);
//       setHourlyStats(statsData.calls_by_hour || {});
//       setError(null);
//     } catch (err: any) {
//       setError(err.message || "Failed to fetch call stats");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchStats();
//   }, [fetchStats]);

//   const refresh = useCallback((designation?: string) => {
//     fetchStats(designation);
//   }, [fetchStats]);

//   return { hourlyStats, loading, error, refresh };
// }

import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/api";

interface HourlyCallStats {
  [hour: string]: {
    connected: number;
    offline: number;
    missed: number;
    other: number;
  };
}

interface UseCallStatsResult {
  hourlyStats: HourlyCallStats | null;
  loading: boolean;
  error: string | null;
  refresh: (designation?: string) => void;
  updateHourlyStats: (data: any) => void;
}

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useCallStats(): UseCallStatsResult {
  const [hourlyStats, setHourlyStats] = useState<HourlyCallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (designation?: string) => {
    setLoading(true);
    try {
      const agentType = designation
        ? {
            "call-center-admin": "call-center-agent",
            "marketing-admin": "marketing-agent",
            "compliance-admin": "compliance-agent",
          }[designation]
        : undefined;
      console.log("Fetching stats with agentType:", agentType);
      const statsData = await apiService.getCallStats(undefined, undefined, undefined, undefined, agentType);
      console.log("Received statsData:", JSON.stringify(statsData, null, 2));
      setHourlyStats(statsData.calls_by_hour || {});
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch call stats");
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(debounce((designation?: string) => {
    fetchStats(designation);
  }, 1000), [fetchStats]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle WebSocket hourly stats updates
  const updateHourlyStats = useCallback((data: any) => {
    if (data.type === "hourly_stats") {
      console.log("Received WebSocket hourly_stats:", data);
      const stats: HourlyCallStats = {};
      data.data.forEach((stat: any) => {
        stats[stat.hour.replace(":00", "")] = {
          connected: stat.connected || 0,
          offline: stat.offline || 0,
          missed: stat.missed || 0,
          other: stat.other || 0,
        };
      });
      setHourlyStats(stats);
      setError(null);
    }
  }, []);

  return { hourlyStats, loading, error, refresh, updateHourlyStats };
}