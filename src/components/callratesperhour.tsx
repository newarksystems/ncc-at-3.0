"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RefreshCcw, X, Minimize2 } from "lucide-react";
import { useCallStats } from "@/hooks/useCallStats";
import useWebSocket from "@/hooks/useWebSocket";
import { useUserStore } from "@/stores/userStore";
import { User } from "@/types";

type CallData = {
  hour: string;
  connected: number;
  offline: number;
  missed: number;
  other: number;
};

export default function CallRatesPerHour() {
  const [isFullscreen, setIsFullScreen] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const { user: currentUser } = useUserStore();
  const { hourlyStats, loading, error, refresh, updateHourlyStats } = useCallStats();

  // Debug logging
  useEffect(() => {
    console.log('CallRatesPerHour - loading:', loading, 'error:', error, 'hourlyStats:', hourlyStats);
  }, [loading, error, hourlyStats]);

  const transformedData = useMemo(() => {
    if (!hourlyStats) return [];
    
    return Object.entries(hourlyStats).map(([hour, stats]) => ({
      hour: `${hour}:00`,
      connected: stats.connected || 0,
      offline: stats.offline || 0,
      missed: stats.missed || 0,
      other: stats.other || 0,
    }));
  }, [hourlyStats]);

  // Removed duplicate useEffect - the logic is already handled above

  const handleWsMessage = useCallback(
    (data: any) => {
      console.log("WebSocket message received:", data);
      updateHourlyStats(data); // Handle hourly_stats messages
      if (data.type === "call_update" || data.type === "call_ended") {
        const designation = currentUser?.role === "super-admin" ? undefined : currentUser?.designation;
        refresh(designation);
      }
    },
    [currentUser, refresh, updateHourlyStats]
  );

  const handleWsError = useCallback((error: Event) => {
    console.error("WebSocket error:", error);
    setWsError("Failed to connect to real-time updates. Retrying...");
  }, []);

  const wsProtocol = typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') : 'ws://';
  let backendHost = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000';
  // Remove trailing '/api' if present for WebSocket connections
  if (backendHost.endsWith('/api')) {
    backendHost = backendHost.slice(0, -4);
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  useWebSocket({
    url: currentUser ? `${wsProtocol}${backendHost}/api/ws/hourly-stats?designation=${encodeURIComponent(currentUser.designation || '')}&token=${encodeURIComponent(token || '')}` : `${wsProtocol}${backendHost}/api/ws/hourly-stats`,
    subscriptions: ["hourly_stats"],
    onMessage: handleWsMessage,
    onError: handleWsError,
    onOpen: () => {
      console.log("WebSocket opened for CallRatesPerHour");
      setWsError(null);
    },
    onClose: () => {
      console.log("WebSocket closed for CallRatesPerHour");
    },
  });

  return (
    <div className="bg-slate-800 border-b border-slate-700 mb-4">
      <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm text-sky-400">Call Rates Per Hour</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const designation = currentUser?.role === "super-admin" ? undefined : currentUser?.designation;
              refresh(designation);
            }}
            className="text-slate-400 hover:text-slate-200"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullscreen)}
            className="text-slate-400 hover:text-slate-200"
          >
            {isFullscreen ? <X className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="p-1">
        {wsError && (
          <div className="text-red-400 text-sm mb-2">{wsError}</div>
        )}
        {loading ? (
          <div className="h-80 flex items-center justify-center text-slate-400">
            Loading call data...
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center text-red-400">
            Error: {error}
          </div>
        ) : (
          <div className={`w-full ${isFullscreen ? "h-[800px]" : "h-80"}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={transformedData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 50,
                }}
              >
                <XAxis dataKey="hour" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    borderRadius: "0.25rem",
                    color: "#f1f5f9",
                  }}
                />
                <Legend />
                <Bar dataKey="connected" name="Connected" fill="#22c55e" />
                <Bar dataKey="offline" name="Offline" fill="#64748b" />
                <Bar dataKey="missed" name="Missed" fill="#ef4444" />
                <Bar dataKey="other" name="Other" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}