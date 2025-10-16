"use client";

import React from "react";
import { RefreshCcw, Minimize2, X } from "lucide-react";
import { useLiveCalls } from "@/hooks/useLiveCalls";
import useWebSocket from "@/hooks/useWebSocket";
import { useUserStore } from "@/stores/userStore";

export function LiveCallsTable() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const { liveCalls, loading, error, refresh } = useLiveCalls();
  const { user: currentUser } = useUserStore();

  const handleWsMessage = React.useCallback((data) => {
    if (data.type === "new_call" || data.type === "call_update" || data.type === "call_ended") {
      refresh();
    }
  }, [refresh]);

  const handleWsError = React.useCallback((error) => {
    console.error("WebSocket error:", error);
  }, []);

  // Setup WebSocket for real-time updates
  const wsProtocol = typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') : 'ws://';
  let backendHost = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000';
  // Remove trailing '/api' if present for WebSocket connections
  if (backendHost.endsWith('/api')) {
    backendHost = backendHost.slice(0, -4);
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  useWebSocket({
    url: currentUser ? `${wsProtocol}${backendHost}/api/ws/live-calls?designation=${encodeURIComponent(currentUser.designation || '')}&token=${encodeURIComponent(token || '')}` : `${wsProtocol}${backendHost}/api/ws/live-calls`,
    onMessage: handleWsMessage,
    onError: handleWsError,
  });

  // Filter calls based on designation
  const filteredCalls = currentUser?.role === "super-admin"
    ? liveCalls
    : liveCalls.filter((call) => {
        const agentType = call.agent_type;
        if (!agentType) return false;
        switch (currentUser?.designation) {
          case "call-center-admin":
            return agentType === "recovery-agent";
          case "marketing-admin":
            return agentType === "marketing-agent";
          case "compliance-admin":
            return agentType === "compliance-agent";
          default:
            return false;
        }
      });

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-slate-900" : "bg-slate-800"}`}>
      <div className="p-2 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm text-sky-400">Live/Active Calls</h3>
        <div className="flex items-center gap-4">
          <button onClick={refresh} className="text-slate-400 hover:text-slate-200">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-slate-400 hover:text-slate-200"
          >
            {isFullscreen ? <X className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto p-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800 text-sky-300 text-center">
              <th className="bg-slate-700 border border-slate-600 px-4 py-2" colSpan={2}>Time</th>
              <th className="bg-slate-900 border border-slate-600 px-4 py-2" colSpan={4}></th>
              <th className="bg-slate-700 border border-slate-600 px-4 py-2" colSpan={3}>Call Info</th>
            </tr>
            <tr className="text-slate-200 text-left">
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Talk Time</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Hold Time</th>
              <th className="border border-slate-600 bg-slate-900 px-4 py-2">Agent</th>
              <th className="border border-slate-600 bg-slate-900 px-4 py-2">Customer No</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Direction</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Status</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Queue</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="bg-slate-800 text-slate-100">
                <td className="border border-slate-600 px-4 py-8 text-center text-slate-400" colSpan={9}>
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr className="bg-slate-800 text-slate-100">
                <td className="border border-slate-600 px-4 py-8 text-center text-red-400" colSpan={9}>
                  Error: {error}
                </td>
              </tr>
            ) : filteredCalls.length > 0 ? (
              filteredCalls.map((call) => (
                <tr key={call.id} className="bg-slate-800 text-slate-100">
                  <td className="border border-slate-600 px-4 py-2">{call.talk_time}</td>
                  <td className="border border-slate-600 px-4 py-2">{call.hold_time}</td>
                  <td className="border border-slate-600 px-4 py-2">{call.agent_name || "N/A"}</td>
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
                          : "text-red-500"
                      }
                    >
                      {call.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="border border-slate-600 px-4 py-2">{call.queue_name || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr className="bg-slate-800 text-slate-100">
                <td className="border border-slate-600 px-4 py-8 text-center text-slate-400" colSpan={9}>
                  No active calls
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}