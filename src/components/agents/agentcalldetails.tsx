import React, { useState, useEffect } from "react"
import { RefreshCcw, Phone, X, Minimize2, ChevronDown, Users, MoreHorizontal } from "lucide-react"
import { Badge } from "../ui/badge"
import { MdPhoneMissed } from "react-icons/md"
import { FaPhoneAlt } from "react-icons/fa"
import { HiPhoneArrowDownLeft, HiPhoneArrowUpRight } from "react-icons/hi2"
import { TbPhoneDone } from "react-icons/tb"
import { Button } from "../ui/button"
import { AgentsCallDetailsLineGraph } from "./agentcalldetailsgraphs"
import AgentsTotalCallsComparison from "./agentcallcomparisongraphs"
import AgentAvgHandlingTimeChart from "./agentcallahtgraph"
import { useAgents } from "@/hooks/useAgents"
import { Agent } from "@/services/api"

export function AgentCallDetails() {
    const { agents, loading, error, refresh } = useAgents();
    
    // Calculate summary statistics
    const totalCalls = agents.reduce((sum, agent) => sum + agent.total_calls, 0);
    const totalOutboundCalls = agents.reduce((sum, agent) => sum + agent.answered_calls, 0);
    const totalInboundCalls = agents.reduce((sum, agent) => sum + agent.missed_calls, 0);
    
    return (
        <div className="">
          
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 mb-6 bg-slate-900 border-b border-slate-600 gap-0.5 text-center p-4">
            <div className="flex flex-col items-center px-1 pt-2 bg-slate-800 px-2 py-4">
                <div className="flex items-center gap-2">
                <FaPhoneAlt className="w-8 h-8 text-blue-400" />
                <p className="text-4xl font-medium text-white tracking-wide">{totalCalls}</p>
                </div>
                <p className="text-slate-400 text-2xl mt-4">TOTAL CALLS</p>
            </div>

            <div className="relative flex items-center justify-center bg-slate-800 w-full py-3">
                <span className="text-sm text-slate-300 sm:absolute top-0.5 left-1/2 transform -translate-x-1/2 md:self-start">OUTBOUND CALLS</span>
                <div className="flex items-center justify-center md:mt-6 gap-6">
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <HiPhoneArrowUpRight className="w-6 h-6 text-green-400" />
                        <span className="text-2xl text-white lg:text-3xl">{totalOutboundCalls}</span>
                    </div>
                    <span className="text-slate-400 text-xl">OUTBOUND CALLS</span>
                    </div>
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <TbPhoneDone className="w-6 h-6  text-blue-400" />
                        <span className="text-2xl lg:text-3xl text-white">{Math.floor(totalOutboundCalls * 0.8)}</span>
                    </div>
                    <span className="text-slate-400 text-xl">OUTBOUND ANSWERED</span>
                    </div>
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <MdPhoneMissed className="w-6 h-6 text-red-400" />
                        <span className="text-2xl lg:text-3xl text-white">{Math.floor(totalOutboundCalls * 0.2)}</span>
                    </div>
                    <span className="text-slate-400 text-xl">OUTBOUND UNANSWERED</span>
                    </div>
                </div>
            </div>

            <div className="relative flex items-center justify-center bg-slate-800 w-full py-3">
              <span className="text-sm text-slate-300 sm:absolute top-0.5 left-1/2 transform -translate-x-1/2 md:self-start">INBOUND CALLS</span>
                <div className="flex items-center justify-center md:mt-6 gap-6">
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <HiPhoneArrowDownLeft className="w-6 h-6 text-green-400" />
                        <span className="text-2xl lg:text-3xl text-white">{totalInboundCalls}</span>
                    </div>
                    <span className="text-slate-400 text-xl">INBOUND CALLS</span>
                    </div>
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <TbPhoneDone className="w-6 h-6 text-blue-400" />
                        <span className="text-2xl lg:text-3xl text-white">{Math.floor(totalInboundCalls * 0.7)}</span>
                    </div>
                    <span className="text-slate-400 text-xl">INBOUND ANSWERED</span>
                    </div>
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <MdPhoneMissed className="w-6 h-6 text-rose-400" />
                        <span className="text-2xl lg:text-3xl text-white">{Math.floor(totalInboundCalls * 0.3)}</span>
                    </div>
                    <span className="text-slate-400 text-xl">INBOUND UNANSWERED</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-x-auto p-4">
            <AgentCallDetailsList />        
            <AgentsTotalCallsComparison />
            <AgentsCallDetailsLineGraph />
            <AgentAvgHandlingTimeChart />
        </div>

        </div>
    )
}

function AgentCallDetailsList() {
    const [isFullscreen, setIsFullScreen] = useState(false)
    const { agents, loading, error, refresh } = useAgents();
    
    // Format agent data for the table
    const formatAgentData = (agent: Agent) => {
        return {
            agent: `${agent.first_name} ${agent.last_name}`,
            total_calls: agent.total_calls,
            total_outbound_calls: agent.answered_calls,
            answered_outbound_calls: Math.floor(agent.answered_calls * 0.8),
            unanswered_outbound_calls: Math.floor(agent.answered_calls * 0.2),
            total_inbound_calls: agent.missed_calls,
            answered_inbound_calls: Math.floor(agent.missed_calls * 0.7),
            unanswered_inbound_calls: Math.floor(agent.missed_calls * 0.3),
            aht: agent.average_call_duration,
            fcr: agent.answer_rate ? Math.floor(agent.answer_rate * 100) : 0,
            far: agent.answer_rate_today ? Math.floor(agent.answer_rate_today * 100) : 0
        };
    };

    return (
        <div className={`${isFullscreen 
            ? 'fixed inset-0 z-50 bg-slate-900'
            : 'bg-slate-800'
        }`}>
            <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm text-sky-400">Agents' Calls Details</h3>
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
                      >Agent Info</th>
                      <th
                        className="bg-slate-900 border border-slate-600 px-4 py-2 text-sky-300"
                        colSpan={3}
                      >Outbound Calls</th>
                      <th
                        className="bg-slate-700 border border-slate-600 px-4 py-2 text-sky-300"
                        colSpan={3}
                      >Inbound Calls</th>
                      <th
                        className="bg-sky-400/90 text-slate-700 border border-slate-600 px-4 py-2"
                        colSpan={3}
                      >Call Stats</th>
                  </tr>

                  <tr className="text-left text-slate-300">
                    {/* agent info row */}
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Agent</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Total Calls</th>
                    {/* calls row */}
                    <th className="border border-slate-600 p-2 bg-slate-900 text-slate-300">Total</th>
                    <th className="border border-slate-600 p-2 bg-slate-900 text-slate-300">Answered</th>
                    <th className="border border-slate-600 p-2 bg-slate-900 text-slate-300">Unanswered</th>
                    {/* logged in info */}
                    <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Total</th>
                    <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Answered</th>
                    <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Unanswered</th>
                    {/* logged out info */}
                    <th className="bg-sky-400/90 border border-slate-600 p-2 text-slate-300">AHT</th>
                    <th className="bg-sky-400/90 border border-slate-600 p-2 text-slate-300">FCR</th>
                     <th className="bg-sky-400/90 border border-slate-600 p-2 text-slate-300">FAR</th>
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
                              <Phone className="w-3 h-3 text-sky-300" />
                              {row.agent}
                            </div>
                          </td>
                          <td className="p-2 border border-slate-600">
                            {row.total_calls}
                          </td>
                          <td className="p-2 border border-slate-600">{row.total_outbound_calls}</td>
                          <td className="p-2 border border-slate-600">{row.answered_outbound_calls}</td>
                          <td className="p-2 border border-slate-600">{row.unanswered_outbound_calls}</td>
                          <td className="p-2 border border-slate-600">{row.total_inbound_calls}</td>
                          <td className="p-2 border border-slate-600">{row.answered_inbound_calls}</td>
                          <td className="p-2 border border-slate-600">{row.unanswered_inbound_calls}</td>
                          <td className="p-2 border border-slate-600">{row.aht}%</td>
                          <td className="p-2 border border-slate-600">{row.fcr}%</td>
                          <td className="p-2 border border-slate-600">{row.far}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
    )
}