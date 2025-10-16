"use client"

import React, { useState, useEffect, useMemo } from "react";
import { RefreshCcw, X, Minimize2, ChevronDown, Phone, Users, MoreHorizontal, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaUserCircle } from "react-icons/fa";
import { useAgents } from "@/hooks/useAgents";
import { Agent } from "@/services/api";
import { AgentPerformanceDash } from "@/components/agents/agentperformancedash";
import { AgentStatsLayoutDash } from "@/components/agentstatslayoutdash";
import { applyAgentFilters, exportAgentData, FilterState } from "@/utils/agentFilters";

export default function AgentOverviewPerformanceMetrics() {
    const [isFullscreen, setIsFullScreen] = useState(false);
    const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        dateRange: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            to: new Date()
        },
        extension: "All",
        status: "All",
        department: "All"
    });
    const { agents, loading, error, refresh } = useAgents();

    const handleFiltersChange = (newFilters: FilterState) => {
        setFilters(newFilters);
        console.log('Filters changed:', newFilters);
    };

    // Apply filters to agents
    const filteredAgents = useMemo(() => 
        applyAgentFilters(agents, filters), 
        [agents, filters]
    );

    const handleExport = () => {
        exportAgentData(filteredAgents, 'agent-performance.csv');
    };

    // Set the first agent as active by default
    useEffect(() => {
        if (agents.length > 0 && !activeAgentId) {
            setActiveAgentId(agents[0].id);
        }
    }, [agents, activeAgentId]);

    const handleAgentClick = (agentId: string) => {
        setActiveAgentId(agentId);
    };

    // Find the active agent
    const activeAgent = agents.find(agent => agent.id === activeAgentId) || agents[0];

    // Format agent data for display
    const formatAgentData = (agent: Agent) => {
        return {
            name: `${agent.first_name} ${agent.last_name}`,
            extension: agent.extension,
            totalCalls: agent.total_calls,
            inbound: agent.missed_calls,
            outbound: agent.answered_calls,
            internal: 0, // This would come from actual data
            avgSpeed: "00:08", // This would come from actual data
            avgHandled: agent.average_talk_time_formatted,
            longestTalk: "12:30", // This would come from actual data
            talkingTime: "1:45:20", // This would come from actual data
            voicemail: 0, // This would come from actual data
            avgRinging: "00:18", // This would come from actual data
            avgTalkingOut: agent.average_talk_time_formatted,
            longestTalkOut: "15:45", // This would come from actual data
            talkingTimeOut: "3:20:15", // This would come from actual data
        };
    };

    const currentAgentData = activeAgent ? formatAgentData(activeAgent) : null;

    return (
        <AgentStatsLayoutDash
            title="Agent Performance"
            onFiltersChange={handleFiltersChange}
            onExport={handleExport}
            onRefresh={refresh}
        >          
            <div className="flex flex-col md:flex-row p-4">
                <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4' : 'bg-slate-800'}`}>
                    <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="text-sm text-sky-400">Agents' Performance</h3>
                        <div className="flex items-center gap-4">
                            <button 
                              className="text-slate-400 cursor-pointer"
                              onClick={refresh}
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsFullScreen(!isFullscreen)}
                                className="text-slate-400 cursor-pointer"
                            >
                                {isFullscreen ? <X className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-screen px-2 py-2">
                        {loading ? (
                            <div className="p-4 text-center text-slate-300">
                                Loading agents...
                            </div>
                        ) : error ? (
                            <div className="p-4 text-center text-red-400">
                                Error loading agents: {error}
                            </div>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="px-4">
                                        <th className="text-left border border-slate-700 text-sky-300 px-2 py-2">Agent</th>
                                        <th className="text-left border border-slate-700 text-sky-300 px-4 py-2">Total Calls</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agents.map((agent) => (
                                        <tr
                                            key={agent.id}
                                            onClick={() => handleAgentClick(agent.id)}
                                            className={`cursor-pointer ${activeAgentId === agent.id ? 'bg-slate-700' : ''} hover:bg-slate-600`}
                                        >
                                            <td className="text-left text-sky-100 border border-slate-700 px-4 py-1">
                                                {agent.first_name} {agent.last_name}
                                            </td>
                                            <td className="text-left text-sky-100 border border-slate-700 px-4 py-1">
                                                {agent.total_calls}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="flex-1 px-4">
                    <div className="flex items-center justify-between border-b border-slate-700">
                        <h3 className="text-sky-300 mb-2">Summary</h3>
                        <div className="flex items-center gap-6">
                            <button 
                              className="text-slate-400 cursor-pointer"
                              onClick={refresh}
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                            <button className="text-slate-400 cursor-pointer">
                                <Minimize2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {currentAgentData ? (
                        <>
                            <div className="flex">
                                <div className="flex text-center items-center gap-4 px-4 py-2">
                                    <div>
                                        <FaUserCircle className="text-slate-500 w-10 h-10 md:w-20 md:h-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 text-xl md:text-3xl">{currentAgentData.name}</p>
                                        <div className="flex space-x-4 text-slate-300">
                                            <Phone className="w-5" />
                                            <Mail className="w-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 mt-4">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <h4 className="text-sm md:text-xl text-slate-400 mb-4">TOTAL CALLS</h4>
                                            <CircularProgress value={currentAgentData.totalCalls} label="" color="rgb(251, 146, 60)" />
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-sm md:text-xl text-slate-400 mb-4">INBOUND CALLS</h4>
                                            <CircularProgress value={currentAgentData.inbound} label="" color="rgb(34, 197, 94)" />
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-sm md:text-xl text-slate-400 mb-4">OUTBOUND CALLS</h4>
                                            <CircularProgress value={currentAgentData.outbound} label="" color="rgb(34, 197, 94)" />
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-sm md:text-xl text-slate-400 mb-4">INTERNAL CALLS</h4>
                                            <CircularProgress value={currentAgentData.internal} label="" color="rgb(239, 68, 68)" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-12 mt-6">
                                <div className="flex-1 border-r border-slate-800">
                                    <h4 className="flex justify-center text-lg font-semibold text-white mb-4">Outbound Calls</h4>
                                    <div className="grid grid-cols-4 gap-4 text-center">
                                        <div>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="w-3 h-3 bg-green-500 mr-2"></div>
                                                <span className="text-2xl text-white">{currentAgentData.avgRinging}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">AVERAGE RINGING TIME</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="w-3 h-3 bg-blue-500 mr-2"></div>
                                                <span className="text-2xl text-white">{currentAgentData.avgTalkingOut}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">AVERAGE TALKING TIME</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="w-3 h-3 bg-red-500 mr-2"></div>
                                                <span className="text-2xl text-white">{currentAgentData.longestTalkOut}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">LONGEST TALKING TIME</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="w-3 h-3 bg-blue-400 mr-2"></div>
                                                <span className="text-2xl text-white">{currentAgentData.talkingTimeOut}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">TALKING TIME</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h4 className="flex justify-center text-lg font-semibold text-white mb-4">Inbound Calls</h4>
                                    <div className="grid grid-cols-5 gap-4 text-center">
                                        <div>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="w-3 h-3 bg-green-500 mr-2"></div>
                                                <span className="text-2xl text-white">{currentAgentData.avgSpeed}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">AVERAGE SPEED OF ANSWER</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="w-3 h-3 bg-blue-500 mr-2"></div>
                                                <span className="text-2xl text-white">{currentAgentData.avgHandled}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">AVERAGE HANDLED TIME</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="w-3 h-3 bg-red-500 mr-2"></div>
                                                <span className="text-2xl text-white">{currentAgentData.longestTalk}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">LONGEST TALKING TIME</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="w-3 h-3 bg-blue-400 mr-2"></div>
                                                <span className="text-2xl text-white">{currentAgentData.talkingTime}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">TALKING TIME</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="w-3 h-3 bg-orange-500 mr-2"></div>
                                                <span className="text-2xl text-white">{currentAgentData.voicemail}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">VOICEMAIL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Add the AgentPerformanceDash component here */}
                            {/* <div className="mt-6">
                                <AgentPerformanceDash />
                            </div> */}
                            <div className="grid grid-cols-2 space-x-4 space-y-4 mt-6">
                                <div>
                                    <div className="bg-slate-800 border-slate-700 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-blue-400">Call Volume By Hour</h4>
                                            <div className="flex space-x-2 gap-4">
                                                <button 
                                                  className="text-slate-400 cursor-pointer"
                                                  onClick={refresh}
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button className="text-slate specifieke cursor-pointer">
                                                    <Minimize2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-48 bg-slate-700/50 flex items-end justify-between px-4 pb-4">
                                            <div className="flex items-end space-x-2 h-full">
                                                {[4, 28, 47, 37, 37, 16, 61, 61, 23].map((height, i) => (
                                                    <div key={i} className="flex flex-col items-center">
                                                        <div
                                                            className="w-8 bg-gradient-to-t from-purple-500 to-pink-500"
                                                            style={{ height: `${height}%` }}
                                                        ></div>
                                                        <span className="text-xs text-slate-400 mt-1">{9 + i}:00 AM</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="bg-slate-800 border-slate-700 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-blue-400">Call Volume By Day</h4>
                                             <div className="flex space-x-2 gap-4">
                                                <button 
                                                  className="text-slate-400 cursor-pointer"
                                                  onClick={refresh}
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button className="text-slate-400 cursor-pointer">
                                                    <Minimize2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-600">
                                                        <th className="text-left p-2 text-slate-400"></th>
                                                        {Array.from({ length: 24 }, (_, i) => (
                                                            <th key={i} className="text-center p-1 text-slate-400">
                                                                {i}:00
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="text-white">
                                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                                                        <tr key={day} className="border-b border-slate-700">
                                                            <td className="p-2 font-medium">{day}</td>
                                                            {Array.from({ length: 24 }, (_, j) => (
                                                                <td key={j} className="text-center p-1">
                                                                    {Math.floor(Math.random() * 20)}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="bg-slate-800 border-slate-700 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-blue-400">Call Volume by Week</h4>
                                             <div className="flex space-x-2 gap-4">
                                                <button 
                                                  className="text-slate-400 cursor-pointer"
                                                  onClick={refresh}
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button className="text-slate-400 cursor-pointer">
                                                    <Minimize2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-48 bg-slate-700/50 flex items-center justify-center">
                                            <span className="text-slate-400">Area Chart Placeholder</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="bg-slate-800 border-slate-700 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-blue-400">Call Volume by Month</h4>
                                             <div className="flex space-x-2 gap-4">
                                                <button 
                                                  className="text-slate-400 cursor-pointer"
                                                  onClick={refresh}
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button className="text-slate-400 cursor-pointer">
                                                    <Minimize2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-48 bg-slate-700/50 flex items-center justify-center">
                                            <span className="text-slate-400">Line Chart Placeholder</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-4 text-center text-slate-300">
                            {loading ? "Loading agent data..." : "Select an agent to view details"}
                        </div>
                    )}
                </div>
            </div>
        </AgentStatsLayoutDash>
    )
}

function CircularProgress({ value, max, label, color }: { value: number; max?: number; label: string; color: string }) {
    const percentage = max ? (value / max) * 100 : value;
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="rgb(51, 65, 85)" strokeWidth="11" fill="none" />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke={color}
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{value}</span>
                </div>
            </div>
            <span className="text-sm text-slate-400 mt-2 text-center">{label}</span>
        </div>
    );
}