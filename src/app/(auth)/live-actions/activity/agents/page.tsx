"use client"

import React, { useState, useEffect } from "react";
import { Minimize2, Phone, RefreshCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentLiveActionStats } from "@/components/agents/agentliveactionstats";
import { useAgents } from "@/hooks/useAgents";
import { Agent } from "@/services/api";

export default function AgentsLiveActions() {
    const [isFullscreen, setIsFullScreen] = useState(false)
    const { agents, loading, error, refresh } = useAgents();

    // Format agent data for the table
    const formatAgentData = (agent: Agent) => {
        return {
            agent: `${agent.first_name} ${agent.last_name}`,
            availability: agent.status,
            talking_to: agent.current_call_id ? `Active Call` : "-",
            talking_for: agent.current_call_id ? "00:30" : "-", // This would come from actual call data
            outbound_calls: agent.answered_calls_today.toString(),
            inbound_calss: agent.missed_calls_today.toString(),
            status: agent.current_call_id ? "Connected" : "Disconnected",
            li_at: agent.login_time ? new Date(agent.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
            li_for: agent.login_time ? calculateDuration(agent.login_time) : "-",
            lo_at: "-", // Would come from actual logout data
            lo_for: "-", // Would come from actual logout data
        };
    };

    // Helper function to calculate duration
    const calculateDuration = (startTime: string) => {
        const start = new Date(startTime);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-4">
            <AgentLiveActionStats />
            <div className={`${isFullscreen 
            ? 'fixed inset-0 z-50 bg-slate-900'
            : 'bg-slate-800'
        }`}>
            <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm text-sky-400">Agents' Live Action</h3>
              <div className="flex items-center gap-4">
                <button 
                  className="text-slate-400 cursor-pointer"
                  onClick={refresh}
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setIsFullScreen(!isFullscreen)}
                    className="text-slate-400 cursor-pointer">
                    {isFullscreen ? (
                        <X className="w-4 h-4" />
                    ) : (
                        <Minimize2 className="w-4 h-4" />
                    )}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto px-2 py-2 ">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-slate-200">
                      <th
                        className="bg-slate-700 border border-slate-600 px-4 py-2 text-sky-300"
                        colSpan={2}
                      ></th>
                      <th
                        className="bg-slate-900 border border-slate-600 px-4 py-2 text-sky-300"
                        colSpan={2}
                      >Talking</th>
                      <th
                        className="bg-slate-700 border border-slate-600 px-4 py-2 text-sky-300"
                        colSpan={3}
                      >Call</th>
                      <th
                        className="bg-slate-900 border border-slate-600 px-4 py-2 text-sky-300"
                        colSpan={2}
                      >Logged In</th>
                      <th
                        className="bg-red-400/90 border border-slate-600 px-4 py-2"
                        colSpan={2}
                      >Logged Out</th>
                  </tr>

                  <tr className="text-left text-slate-300">
                    {/* agent info row */}
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Agent</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Availability</th>

                    <th className="border border-slate-600 bg-slate-900 px-4 py-2">To</th>
                    <th className="border border-slate-600 bg-slate-900 px-4 py-2">For</th>
                    {/* calls row */}
                    <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Outbound Calls</th>
                    <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Inbound Calls</th>
                    <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Status</th>
                    {/* logged in info */}
                    <th className="border border-slate-600 bg-slate-900 px-4 py-2">At</th>
                    <th className="border border-slate-600 bg-slate-900 px-4 py-2">For</th>
                    {/* logged out info */}
                    <th className="bg-red-400 border border-slate-600 p-2 text-slate-300">At</th>
                    <th className="bg-red-400 border border-slate-600 p-2 text-slate-300">For</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="p-4 text-center text-slate-300">
                        Loading agents...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={11} className="p-4 text-center text-red-400">
                        Error loading agents: {error}
                      </td>
                    </tr>
                  ) : (
                    agents.map((agent, i) => {
                      const row = formatAgentData(agent);
                      return (
                        <tr key={agent.id} className="text-white">
                          <td className="p-2 border border-slate-600">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-orange-400" />
                              {row.agent}
                            </div>
                          </td>
                          <td className="p-2 border border-slate-600">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                row.availability === "available"
                                  ? "bg-green-500/70 text-white"
                                  : row.availability === "dnd" || row.availability === "busy"
                                    ? "bg-red-500/90 text-white"
                                    : row.availability === "away" || row.availability === "break"
                                      ? "bg-orange-500/80 text-white"
                                      : "bg-blue-600 text-white"
                              }`}
                            >
                              {row.availability.charAt(0).toUpperCase() + row.availability.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-2 border border-slate-600">{row.talking_to}</td>
                          <td className="p-2 border border-slate-600">{row.talking_for}</td>
                          <td className="p-2 border border-slate-600">
                              {row.outbound_calls}
                          </td>
                          <td className="p-2 border border-slate-600">{row.inbound_calss}</td>
                          <td className={`${row.status === "Connected" ? 'p-2 border border-slate-600 text-cyan-400' : 'p-2 border border-slate-600 text-rose-400'}`}>{row.status}</td>
                          <td className="p-2 border border-slate-600">{row.li_at}</td>
                          <td className="p-2 border border-slate-600">{row.li_for}</td>
                          <td className="p-2 border border-slate-600">{row.lo_at}</td>
                          <td className="p-2 border border-slate-600">{row.lo_for}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    )
}