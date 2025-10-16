'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCcw, Eye, FileText, Download } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import useWebSocket from '@/hooks/useWebSocket';
import { apiService } from '@/services/api';
import { User, LiveCall, AgentCall, QueueStatus } from '@/types';
import { useUserStore } from '@/stores/userStore';
import { useActivityStore } from '@/stores/activityStore';

export default function ViewerDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useUserStore();
  const { 
    liveCalls, 
    updateLiveCalls, 
    dashboardStats, 
    updateDashboardStats,
    wsConnected,
    setWsError
  } = useActivityStore();
  const [wsError, setWsErrorLocal] = useState<string | null>(null);
  const { stats, calls, queueStatus, loading: statsLoading, error, refresh } = useViewerStats(user?.id || "");

  // The user data should already be available from the auth context
  // No need to fetch user data again since it's managed in the auth context

  // Log renders for debugging
  useEffect(() => {
    console.log("ViewerDashboard rendered");
  });

  // Filter live calls for viewing (all calls since viewer has read-only access)
  const filteredLiveCalls = useMemo(() => {
    return liveCalls;
  }, [liveCalls]);

  // Prepare data for performance trends chart
  const trendData = useMemo(() => {
    if (!stats?.calls_by_day) return [];
    return Object.entries(stats.calls_by_day).map(([day, data]) => ({
      day,
      answered: data.answered || 0,
      unanswered: data.unanswered || 0,
    }));
  }, [stats]);

  const handleWsMessage = React.useCallback((data: any) => {
    if (data.type === "new_call" || data.type === "call_update" || data.type === "call_ended") {
      console.log("WebSocket message received, refreshing viewer stats");
      refresh();
    }
  }, [refresh]);

  const handleWsError = React.useCallback((error: Event) => {
    console.error("WebSocket error:", error);
    setWsErrorLocal("Failed to connect to real-time updates. Retrying...");
    setWsError("Failed to connect to real-time updates. Retrying...");
  }, [setWsError, setWsErrorLocal]);

  const handleWsOpen = React.useCallback(() => {
    console.log("Activity WebSocket opened for ViewerDashboard");
    setWsErrorLocal(null);
  }, [setWsErrorLocal]);

  const handleWsClose = React.useCallback(() => {
    console.log("Activity WebSocket closed for ViewerDashboard");
  }, []);

  // Activity WebSocket connection
  const wsProtocol = typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') : 'ws://';
  let backendHost = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000';
  // Remove trailing '/api' if present for WebSocket connections
  if (backendHost.endsWith('/api')) {
    backendHost = backendHost.slice(0, -4);
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  useWebSocket({
    url: user ? `${wsProtocol}${backendHost}/api/ws/live-calls?designation=${encodeURIComponent(user.designation || '')}&token=${encodeURIComponent(token || '')}` : `${wsProtocol}${backendHost}/api/ws/live-calls`,
    onMessage: handleWsMessage,
    onError: handleWsError,
    onOpen: handleWsOpen,
    onClose: handleWsClose,
  });

  const loading = authLoading || statsLoading;

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <h1 className="text-2xl text-sky-400 mb-6">Viewer Dashboard</h1>
      {wsError && <div className="text-red-400 text-sm mb-4">{wsError}</div>}
      {loading ? (
        <div className="text-slate-400 text-center">Loading viewer data...</div>
      ) : error ? (
        <div className="text-red-400 text-center">Error: {error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Summary Metrics */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm text-sky-400">Call Summary</h2>
              <button onClick={refresh} className="text-slate-400 hover:text-slate-200">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-slate-200 text-sm">Total Calls</p>
                <p className="text-2xl text-sky-400">{stats?.total_calls || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-200 text-sm">Answered</p>
                <p className="text-2xl text-green-500">{stats?.answered_calls || 0}</p>
                <div className="mt-1 h-2 bg-slate-700 rounded">
                  <div
                    className="h-full bg-green-500 rounded"
                    style={{ width: `${(stats?.answered_calls || 0) / (stats?.total_calls || 1) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-slate-200 text-sm">Unanswered</p>
                <p className="text-2xl text-red-500">{stats?.unanswered_calls || 0}</p>
                <div className="mt-1 h-2 bg-slate-700 rounded">
                  <div
                    className="h-full bg-red-500 rounded"
                    style={{ width: `${(stats?.unanswered_calls || 0) / (stats?.total_calls || 1) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-slate-200 text-sm">Avg Talk Time</p>
                <p className="text-2xl text-sky-400">{stats?.average_talk_time || "00:00"}</p>
              </div>
            </div>
          </div>

          {/* Queue Status */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm text-sky-400 mb-4">Queue Status</h2>
            {queueStatus ? (
              <div className="space-y-2">
                <p className="text-slate-200">
                  <span className="text-sky-400">Queue:</span> {queueStatus.queue_name}
                </p>
                <p className="text-slate-200">
                  <span className="text-sky-400">Calls Waiting:</span> {queueStatus.calls_waiting}
                </p>
                <p className="text-slate-200">
                  <span className="text-sky-400">Your Position:</span> {queueStatus.position}
                </p>
              </div>
            ) : (
              <p className="text-slate-400">No queue assigned</p>
            )}
          </div>

          {/* Performance Trends */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm text-sky-400 mb-4">Performance Trends</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
                >
                  <XAxis dataKey="day" angle={-45} textAnchor="end" tick={{ fontSize: 12 }} />
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
                  <Bar dataKey="answered" name="Answered" fill="#22c55e" />
                  <Bar dataKey="unanswered" name="Unanswered" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live Calls */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 col-span-1 lg:col-span-3">
            <h2 className="text-sm text-sky-400 mb-4">Live Calls</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-slate-200 text-left">
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Talk Time</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Hold Time</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Customer Name</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Customer No</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Direction</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLiveCalls.length > 0 ? (
                    filteredLiveCalls.map((call: LiveCall) => (
                      <tr key={call.id} className="bg-slate-800 text-slate-100">
                        <td className="border border-slate-600 px-4 py-2">{call.talk_time}</td>
                        <td className="border border-slate-600 px-4 py-2">{call.hold_time}</td>
                        <td className="border border-slate-600 px-4 py-2">{call.caller_display_name || "N/A"}</td>
                        <td className="border border-slate-600 px-4 py-2">{call.caller_number}</td>
                        <td className="border border-slate-600 px-4 py-2 capitalize">{call.direction}</td>
                        <td className="border border-slate-600 px-4 py-2">
                          <span
                            className={
                              call.status === "answered" || call.status === "talking"
                                ? "text-green-500"
                                : call.status === "on_hold"
                                ? "text-yellow-500"
                                : call.status === "ringing"
                                ? "text-blue-500"
                                : call.status === "ended"
                                ? "text-gray-500"
                                : "text-red-500"
                            }
                          >
                            {call.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-slate-800 text-slate-100">
                      <td className="border border-slate-600 px-4 py-8 text-center text-slate-400" colSpan={6}>
                        No active calls
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Call History */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 col-span-1 lg:col-span-3">
            <h2 className="text-sm text-sky-400 mb-4">Call History</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-slate-200 text-left">
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Date</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Duration</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Customer Name</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Customer No</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Direction</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.length > 0 ? (
                    calls.map((call: AgentCall) => (
                      <tr key={call.id} className="bg-slate-800 text-slate-100">
                        <td className="border border-slate-600 px-4 py-2">{call.date}</td>
                        <td className="border border-slate-600 px-4 py-2">{call.duration}</td>
                        <td className="border border-slate-600 px-4 py-2">{call.caller_name || "N/A"}</td>
                        <td className="border border-slate-600 px-4 py-2">{call.caller_number}</td>
                        <td className="border border-slate-600 px-4 py-2 capitalize">{call.direction}</td>
                        <td className="border border-slate-600 px-4 py-2 capitalize">{call.outcome}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-slate-800 text-slate-100">
                      <td className="border border-slate-600 px-4 py-8 text-center text-slate-400" colSpan={6}>
                        No call history
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}