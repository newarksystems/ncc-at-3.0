// import React, { useState } from "react"
// import { RefreshCcw, Phone, X, Minimize2 } from "lucide-react"
// import { useAgents } from "@/hooks/useAgents"

// export function AgentPerformanceDash() {
//     const [isFullscreen, setIsFullScreen] = useState(false)
//     const { agents, loading, error, refresh } = useAgents()

//     return (
//         <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : ''}`}>
//             <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
//                 <h3 className="text-sm text-sky-400">Agents' Performance Dash</h3>
//                 <div className="flex items-center gap-4">
//                     <button onClick={refresh} className="text-slate-400 cursor-pointer">
//                         <RefreshCcw className="w-4 h-4" />
//                     </button>
//                     <button
//                         onClick={() => setIsFullScreen(!isFullscreen)}
//                         className="text-slate-400 cursor-pointer">
//                         {isFullscreen ? (
//                             <X className="w-4 h-4" />
//                         ) : (
//                             <Minimize2 className="w-4 h-4" />
//                         )}
//                     </button>
//                 </div>
//             </div>
//             <div className="overflow-x-auto px-2 py-2">
//                 <table className="w-full text-xs border-collapse">
//                     <thead>
//                         <tr className="text-slate-200">
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">Agent</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">Availability</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">Amount Collected (Today)</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">Outbound Calls</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">Avg. Handling Time</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">Inbound Calls</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">Status</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">LI At</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">LI For</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">LO At</th>
//                             <th className="border border-slate-600 bg-slate-700 px-4 py-2">LO For</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {loading ? (
//                             <tr className="text-white">
//                                 <td className="p-2 border border-slate-600 text-center" colSpan={11}>
//                                     Loading agents...
//                                 </td>
//                             </tr>
//                         ) : error ? (
//                             <tr className="text-white">
//                                 <td className="p-2 border border-slate-600 text-center text-red-400" colSpan={11}>
//                                     Error: {error}
//                                 </td>
//                             </tr>
//                         ) : agents.length === 0 ? (
//                             <tr className="text-white">
//                                 <td className="p-2 border border-slate-600 text-center" colSpan={11}>
//                                     No agents found
//                                 </td>
//                             </tr>
//                         ) : (
//                             agents.map((agent, i) => (
//                                 <tr key={agent.id} className="text-white">
//                                     <td className="p-2 border border-slate-600">
//                                         <div className="flex items-center gap-1">
//                                             <Phone className="w-3 h-3 text-sky-300" />
//                                             {agent.full_name}
//                                         </div>
//                                     </td>
//                                     <td className="p-2 border border-slate-600">
//                                         <span className={`px-2 py-1 rounded text-xs ${agent.status === 'available' ? 'bg-green-500' : agent.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'}`}>
//                                             {agent.status}
//                                         </span>
//                                     </td>
//                                     <td className="p-2 border border-slate-600">{agent.total_calls_today * 100}</td>
//                                     <td className="p-2 border border-slate-600">{agent.total_calls_today - agent.answered_calls_today}</td>
//                                     <td className="p-2 border border-slate-600">{agent.average_talk_time_formatted}</td>
//                                     <td className="p-2 border border-slate-600">{agent.answered_calls_today}</td>
//                                     <td className="p-2 border border-slate-600">
//                                         <span className={`px-2 py-1 rounded text-xs ${agent.is_logged_in ? 'bg-green-500' : 'bg-red-500'}`}>
//                                             {agent.is_logged_in ? 'Connected' : 'Disconnected'}
//                                         </span>
//                                     </td>
//                                     <td className="p-2 border border-slate-600">
//                                         {agent.login_time ? new Date(agent.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
//                                     </td>
//                                     <td className="p-2 border border-slate-600">
//                                         {agent.login_time ? Math.floor((Date.now() - new Date(agent.login_time).getTime()) / 60000) + ' min' : 'N/A'}
//                                     </td>
//                                     <td className="p-2 border border-slate-600">N/A</td>
//                                     <td className="p-2 border border-slate-600">N/A</td>
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     )
// }

// src/components/AgentPerformanceDash.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { RefreshCcw, Phone, X, Minimize2 } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import useWebSocket from "@/hooks/useWebSocket";

export function AgentPerformanceDash() {
  const [isFullscreen, setIsFullScreen] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const { agents, loading, error, refresh, currentUser } = useAgents({ page: 1, size: 100 });

const filteredAgents = useMemo(() => {
  console.log('AgentPerformanceDash - Filtering agents:', { 
    currentUser: currentUser ? { role: currentUser.role, designation: currentUser.designation } : null, 
    agents: agents ? agents.length : 0,
    agentsData: agents 
  });
  
  if (!currentUser || !agents || !Array.isArray(agents)) {
    console.warn('No currentUser or agents:', { currentUser, agents });
    return [];
  }
  if (currentUser.role === "super-admin") {
    console.log('Super admin - returning all agents:', agents.length);
    return agents;
  }
  const validDesignations = ["call-center-admin", "marketing-admin", "compliance-admin"];
  if (!validDesignations.includes(currentUser.designation)) {
    console.warn(`Invalid designation: ${currentUser.designation}, displaying all agents`);
    return agents;
  }
  
  const filtered = agents.filter((agent) => {
    const agentName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || `Agent ${agent.id?.slice(-4) || 'Unknown'}`;
    console.log('Filtering agent:', { agent: agentName, agent_type: agent.agent_type, currentUser_designation: currentUser.designation });
    switch (currentUser.designation) {
      case "call-center-admin":
        return agent.agent_type === "recovery-agent";
      case "marketing-admin":
        return agent.agent_type === "marketing-agent";
      case "compliance-admin":
        return agent.agent_type === "compliance-agent";
      default:
        return false;
    }
  });
  
  console.log('Filtered agents result:', filtered.length);
  return filtered;
}, [agents, currentUser]);

  const handleWsMessage = useCallback((data: any) => {
    console.log("WebSocket message received:", data);
    if (data.type === "agent_update" || data.type === "agent_status_change") {
      const designation = currentUser?.role === "super-admin" ? undefined : currentUser?.designation;
      refresh(designation);
    }
  }, [currentUser, refresh]);

  const wsProtocol = typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') : 'ws://';
  let backendHost = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000';
  // Remove trailing '/api' if present for WebSocket connections
  if (backendHost.endsWith('/api')) {
    backendHost = backendHost.slice(0, -4);
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const wsUrl = currentUser
    ? `${wsProtocol}${backendHost}/api/ws/agents?designation=${encodeURIComponent(currentUser.designation || "all")}&token=${encodeURIComponent(token || "")}`
    : `${wsProtocol}${backendHost}/api/ws/agents?designation=all`;

  useWebSocket({
    url: wsUrl,
    subscriptions: ["agents"],
    onMessage: handleWsMessage,
    onError: (error) => {
      console.error("WebSocket error:", error);
      setWsError("Failed to connect to real-time updates. Retrying...");
    },
    onOpen: () => {
      console.log("WebSocket opened for AgentPerformanceDash");
      setWsError(null);
    },
    onClose: () => {
      console.log("WebSocket closed for AgentPerformanceDash");
    },
  });

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-slate-900" : ""}`}>
      <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm text-sky-400">Agents' Performance Dash</h3>
        <div className="flex items-center gap-4">
          <button onClick={() => refresh(currentUser?.role === "super-admin" ? undefined : currentUser?.designation)} className="text-slate-400 cursor-pointer">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button onClick={() => setIsFullScreen(!isFullscreen)} className="text-slate-400 cursor-pointer">
            {isFullscreen ? <X className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto px-2 py-2">
        {wsError && (
          <div className="text-red-400 text-sm mb-2">{wsError}</div>
        )}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-slate-200">
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Agent</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Availability</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Amount Collected (Today)</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Outbound Calls</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Avg. Handling Time</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Inbound Calls</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Status</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">LI At</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">LI For</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">LO At</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">LO For</th>
            </tr>
          </thead>
          <tbody>
          {loading ? (
            <tr className="text-white">
              <td className="p-2 border border-slate-600 text-center" colSpan={11}>
                Loading agents...
              </td>
            </tr>
          ) : error ? (
            <tr className="text-white">
              <td className="p-2 border border-slate-600 text-center text-red-400" colSpan={11}>
                Error: {error}
              </td>
            </tr>
          ) : !filteredAgents || filteredAgents.length === 0 ? (
            <tr className="text-white">
              <td className="p-2 border border-slate-600 text-center" colSpan={11}>
                No agents found
              </td>
            </tr>
          ) : (
            filteredAgents.map((agent) => (
              <tr key={agent.id} className="text-white">
                <td className="p-2 border border-slate-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-sky-300" />
                    {`${agent.first_name || ''} ${agent.last_name || ''}`.trim() || `Agent ${agent.id?.slice(-4) || 'Unknown'}`}
                  </div>
                </td>
                <td className="p-2 border border-slate-600">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      agent.status === "available"
                        ? "bg-green-500"
                        : agent.status === "busy"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  >
                    {agent.status}
                  </span>
                </td>
                <td className="p-2 border border-slate-600">{agent.total_calls_today * 100}</td>
                <td className="p-2 border border-slate-600">{agent.total_calls_today - agent.answered_calls_today}</td>
                <td className="p-2 border border-slate-600">
                  {agent.average_call_duration
                    ? `${Math.floor(agent.average_call_duration / 60)}:${(agent.average_call_duration % 60).toString().padStart(2, "0")}`
                    : "N/A"}
                </td>
                <td className="p-2 border border-slate-600">{agent.answered_calls_today}</td>
                <td className="p-2 border border-slate-600">
                  <span
                    className={`px-2 py-1 rounded text-xs ${agent.is_logged_in ? "bg-green-500" : "bg-red-500"}`}
                  >
                    {agent.is_logged_in ? "Connected" : "Disconnected"}
                  </span>
                </td>
                <td className="p-2 border border-slate-600">
                  {agent.login_time
                    ? new Date(agent.login_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "N/A"}
                </td>
                <td className="p-2 border border-slate-600">
                  {agent.login_time
                    ? Math.floor((Date.now() - new Date(agent.login_time).getTime()) / 60000) + " min"
                    : "N/A"}
                </td>
                <td className="p-2 border border-slate-600">
                  {agent.last_login
                    ? new Date(agent.last_login).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "N/A"}
                </td>
                <td className="p-2 border border-slate-600">
                  {agent.last_login
                    ? Math.floor((Date.now() - new Date(agent.last_login).getTime()) / 60000) + " min"
                    : "N/A"}
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}