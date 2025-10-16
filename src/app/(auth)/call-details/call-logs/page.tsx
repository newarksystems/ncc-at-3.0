"use client"

import React, { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Phone, Play, Users, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCallStats } from "@/hooks/useCallStats"
import { Call } from "@/services/api"

interface CallLog {
  id: string
  callStart: string
  callEnd: string
  status: "Answered" | "Unanswered"
  duration: string
  caller: string
  callerDisplay?: string
  callee: string
  inboundRule: string
  recordings: boolean
  details: {
    start: string
    answered: string
    end: string
    ringing: string
    talking: string
    status: string
    caller: string
    destination: string
    description: string
    direction: string
  }
}

export default function CallLogsPage() {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const { calls, loading, error, refresh } = useCallStats()

  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id)
  }

  // Format call data for display
  const formatCallLog = (call: Call): CallLog => {
    const callStart = new Date(call.call_start)
    const callEnd = call.call_end ? new Date(call.call_end) : new Date()
    const durationMs = callEnd.getTime() - callStart.getTime()
    const durationMinutes = Math.floor(durationMs / 60000)
    const durationSeconds = Math.floor((durationMs % 60000) / 1000)
    const duration = `${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`
    
    return {
      id: call.id,
      callStart: callStart.toLocaleString(),
      callEnd: call.call_end ? new Date(call.call_end).toLocaleString() : "-",
      status: call.status === "answered" ? "Answered" : "Unanswered",
      duration,
      caller: call.caller_number,
      callerDisplay: call.caller_display_name || undefined,
      callee: call.callee_number,
      inboundRule: "",
      recordings: call.has_recording,
      details: {
        start: callStart.toLocaleString(),
        answered: call.call_answered ? new Date(call.call_answered).toLocaleString() : "-",
        end: call.call_end ? new Date(call.call_end).toLocaleString() : "-",
        ringing: `${Math.floor(call.ringing_duration / 60)}:${(call.ringing_duration % 60).toString().padStart(2, '0')}`,
        talking: `${Math.floor(call.talk_duration / 60)}:${(call.talk_duration % 60).toString().padStart(2, '0')}`,
        status: call.status,
        caller: call.caller_number,
        destination: call.callee_number,
        description: call.description || "",
        direction: call.direction
      }
    }
  }

  const formattedCallLogs = calls.map(formatCallLog)

  return (
    <div className="min-h-screen bg-[#1a2332] text-white">
      {/* Header */}
     <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                    <span>Agents</span>
                    <span>{">"}</span>
                    <span>Overview</span>
                    <span>{">"}</span>
                    <span className="text-white">All Calls</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>-- SAVED FILTERS --</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        -- Select -- <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>FILTERS</span>
                </div>
                <Badge variant="secondary" className="bg-red-600 text-white text-xs">
                    Last 7 Days
                </Badge>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Users className="w-3 h-3 mr-1" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </div>
        </div>
        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
            <span>Applied Filters ⊗</span>
            <span>Date Range: Last 7 Days ⊗</span>
            <span>Extension: 1004 ⊗</span>
        </div>
    </div>

      {/* Table */}
      <div className="overflow-x-auto px-4 py-2 mt-4">
        <div className="flex justify-end mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={refresh}
          >
            Refresh
          </Button>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-slate-200">
              <th className="bg-slate-700 border border-slate-600 px-4 py-2 text-sky-300" colSpan={2}></th>
              <th className="bg-slate-900 border border-slate-600 px-4 py-2 text-sky-300" colSpan={2}>Call</th>
              <th className="bg-slate-700 border border-slate-600 px-4 py-2 text-sky-300" colSpan={3}></th>
            </tr>
            <tr className="text-left text-slate-300">
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Call Start</th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">Call End</th>
              <th className="border border-slate-600 bg-slate-900 px-4 py-2">Call Status</th>
              <th className="border border-slate-600 bg-slate-900 px-4 py-2">Total Duration</th>
              <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Caller</th>
              <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Callee</th>
              <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Recordings</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-300">
                  Loading call logs...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-red-400">
                  Error loading call logs: {error}
                </td>
              </tr>
            ) : (
              formattedCallLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="text-white hover:bg-slate-600/30 transition-colors duration-200">
                    <td className="p-2 border border-slate-600">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto mr-2 text-gray-300 hover:text-white"
                          onClick={() => toggleRow(log.id)}
                        >
                          {expandedRowId === log.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        {log.callStart}
                      </div>
                    </td>
                    <td className="p-2 border border-slate-600">{log.callEnd}</td>
                    <td className="p-2 border border-slate-600">
                      <Badge
                        className={`px-2 py-1 text-xs font-medium ${
                          log.status === "Answered" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="p-2 border border-slate-600">{log.duration}</td>
                    <td className="p-2 border border-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-orange-400" />
                        {log.caller} {log.callerDisplay && `${log.callerDisplay}`}
                      </div>
                    </td>
                    <td className="p-2 border border-slate-600">{log.callee || "-"}</td>
                    <td className="p-2 border border-slate-600">{log.recordings ? "Yes" : "No"}</td>
                  </tr>
                  {expandedRowId === log.id && (
                    <tr className="bg-slate-600/20">
                      <td colSpan={7} className="p-2 border border-slate-600">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-200">
                              <th className="bg-slate-700 border border-slate-600 px-2 py-1 text-sky-300">Start</th>
                              <th className="bg-slate-900 border border-slate-600 px-2 py-1 text-sky-300">End</th>
                              <th className="bg-slate-700 border border-slate-600 px-2 py-1 text-sky-300">Ringing</th>
                              <th className="bg-slate-900 border border-slate-600 px-2 py-1 text-sky-300">Talking</th>
                              <th className="bg-slate-700 border border-slate-600 px-2 py-1 text-sky-300">Status</th>
                              <th className="bg-slate-900 border border-slate-600 px-2 py-1 text-sky-300">Caller</th>
                              <th className="bg-slate-700 border border-slate-600 px-2 py-1 text-sky-300">Description</th>
                              <th className="bg-slate-900 border border-slate-600 px-2 py-1 text-sky-300">Direction</th>
                              <th className="bg-pink-700/90 border border-slate-600 px-2 py-1">Play</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-white">
                              <td className="p-2 border border-slate-600">{log.details.start}</td>
                              <td className="p-2 border border-slate-600">{log.details.end}</td>
                              <td className="p-2 border border-slate-600">{log.details.ringing}</td>
                              <td className="p-2 border border-slate-600">{log.details.talking}</td>
                              <td className="p-2 border border-slate-600">
                                <Badge
                                  className={`px-2 py-1 text-xs font-medium ${
                                    log.details.status === "answered" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                                  }`}
                                >
                                  {log.details.status}
                                </Badge>
                              </td>
                              <td className="p-2 border border-slate-600">{log.details.caller}</td>
                              <td className="p-2 border border-slate-600">{log.details.description || "-"}</td>
                              <td className="p-2 border border-slate-600">{log.details.direction || "-"}</td>
                              <td className="p-2 border border-slate-600">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto text-slate-300 hover:text-white"
                                  disabled={!log.details.description}
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="bg-[#2a3441] border-[#3a4551] text-white hover:bg-[#3a4551] rounded-md">
            ‹‹
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2a3441] border-[#3a4551] text-white hover:bg-[#3a4551] rounded-md">
            ‹
          </Button>
          <span className="text-white mx-2">1</span>
          <Button variant="outline" size="sm" className="bg-[#2a3441] border-[#3a4551] text-white hover:bg-[#3a4551] rounded-md">
            2
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2a3441] border-[#3a4551] text-white hover:bg-[#3a4551] rounded-md">
            3
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2a3441] border-[#3a4551] text-white hover:bg-[#3a4551] rounded-md">
            4
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2a3441] border-[#3a4551] text-white hover:bg-[#3a4551] rounded-md">
            5
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2a3441] border-[#3a4551] text-white hover:bg-[#3a4551] rounded-md">
            ›
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2a3441] border-[#3a4551] text-white hover:bg-[#3a4551] rounded-md">
            ››
          </Button>
        </div>
        <div className="text-gray-400">1 - {formattedCallLogs.length} of {formattedCallLogs.length} items</div>
      </div>
    </div>
  )
}