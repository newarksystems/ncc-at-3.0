import React, { useState } from "react"
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

export function AgentCallDetails() {
    return (
        <div className="">
          <div className="bg-slate-800 border-b border-slate-700 mb-4  px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-slate-300">
                            <span>Agents</span>
                            <span>{" > "}</span>
                            <span>Overview</span>
                            <span>{" > "}</span>
                            <span className="text-white">Call Details</span>
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
                    <span>Extension: 1005 ⊗</span>
                </div>
            </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 mb-6 bg-slate-900 border-b border-slate-600 gap-0.5 text-center p-4">
            <div className="flex flex-col items-center px-1 pt-2 bg-slate-800 px-2 py-4">
                <div className="flex items-center gap-2">
                <FaPhoneAlt className="w-8 h-8 text-blue-400" />
                <p className="text-4xl font-medium text-white tracking-wide">141</p>
                </div>
                <p className="text-slate-400 text-2xl mt-4">TOTAL CALLS</p>
            </div>

            <div className="relative flex items-center justify-center bg-slate-800 w-full py-3">
                <span className="text-sm text-slate-300 sm:absolute top-0.5 left-1/2 transform -translate-x-1/2 md:self-start">OUTBOUND CALLS</span>
                <div className="flex items-center justify-center md:mt-6 gap-6">
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <HiPhoneArrowUpRight className="w-6 h-6 text-green-400" />
                        <span className="text-2xl text-white lg:text-3xl">5</span>
                    </div>
                    <span className="text-slate-400 text-xl">OUTBOUND CALLS</span>
                    </div>
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <TbPhoneDone className="w-6 h-6  text-blue-400" />
                        <span className="text-2xl lg:text-3xl text-white">4</span>
                    </div>
                    <span className="text-slate-400 text-xl">OUTBOUND ANSWERED</span>
                    </div>
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <MdPhoneMissed className="w-6 h-6 text-red-400" />
                        <span className="text-2xl lg:text-3xl text-white">4</span>
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
                        <span className="text-2xl lg:text-3xl text-white">5</span>
                    </div>
                    <span className="text-slate-400 text-xl">INBOUND CALLS</span>
                    </div>
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <TbPhoneDone className="w-6 h-6 text-blue-400" />
                        <span className="text-2xl lg:text-3xl text-white">4</span>
                    </div>
                    <span className="text-slate-400 text-xl">INBOUND ANSWERED</span>
                    </div>
                    <div className="flex flex-col">
                    <div className="flex items-center justify-center gap-2">
                        <MdPhoneMissed className="w-6 h-6 text-rose-400" />
                        <span className="text-2xl lg:text-3xl text-white">4</span>
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
    return (
        <div className={`${isFullscreen 
            ? 'fixed inset-0 z-50 bg-slate-900'
            : 'bg-slate-800'
        }`}>
            <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm text-sky-400">Agents' Calls Details</h3>
              <div className="flex items-center gap-4">
                <button className="text-slate-400 cursor-pointer">
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
                    {/* <th className="border border-slate-600 bg-slate-700 px-4 py-2">Amount Collected (Today)</th> */}
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
                  {[
                    {
                      agent: "Doris Glimp",
                      availability: "Available",
                      // phone: "5554448842",
                      amount_collected: "10000",
                      total_calls: "70",
                      total_outbound_calls: "20",
                      answered_outbound_calls: "10",
                      unanswered_outbound_calls: "10",
                      total_inbound_calls: "30",
                      answered_inbound_calls: "16",
                      unanswered_inbound_calls: "14",
                      avg_handling_time: "7:31",
                      inbound_calss: "5",
                      status: "Disconnected",
                      aht: "20",
                      fcr: "30",
                      far: "50"
                      
                    },
                    {
                      agent: "Mark Simon",
                      availability: "Available",
                      // phone: "5554448842",
                      amount_collected: "10000",
                      total_calls: "80",
                      total_outbound_calls: "50",
                      answered_outbound_calls: "33",
                      unanswered_outbound_calls: "17",
                      total_inbound_calls: "20",
                      answered_inbound_calls: "7",
                      unanswered_inbound_calls: "14",                      
                      avg_handling_time: "5:31",
                      inbound_calss: "15",
                      status: "Connected",
                      aht: "41",
                      fcr: "26",
                      far: "60"
                      
                    },
                    {
                      agent: "Susan Yalovsky",
                      availability: "Away",
                      // phone: "5554448842",
                      amount_collected: "20000",
                      total_calls: "86",
                      total_outbound_calls: "40",
                      answered_outbound_calls: "25",
                      unanswered_outbound_calls: "15",
                      total_inbound_calls: "11",
                      answered_inbound_calls: "8",
                      unanswered_inbound_calls: "3",                      
                      avg_handling_time: "2:33",
                      inbound_calss: "10",
                      status: "Disconnected",
                      aht: "20",
                      fcr: "62",
                      far: "21"
                      
                    },
                    {
                      agent: "Mary Homer",
                      availability: "Do Not Disturb",
                      // phone: "5554448842",
                      amount_collected: "30000",
                      total_calls: "80",
                      total_outbound_calls: "35",
                      answered_outbound_calls: "10",
                      unanswered_outbound_calls: "25",
                      total_inbound_calls: "17",
                      answered_inbound_calls: "8",
                      unanswered_inbound_calls: "9",                      
                      avg_handling_time: "7:31",
                      inbound_calss: "25",
                      status: "Connected",
                      aht: "20",
                      fcr: "33",
                      far: "29"
                      
                    },
                    {
                      agent: "Britta Shoop",
                      availability: "Available",
                      // phone: "5554448842",
                      amount_collected: "60000",
                      total_calls: "95",
                      total_outbound_calls: "90",
                      answered_outbound_calls: "31",
                      unanswered_outbound_calls: "59",
                      total_inbound_calls: "24",
                      answered_inbound_calls: "15",
                      unanswered_inbound_calls: "9",                      
                      avg_handling_time: "5:10",
                      inbound_calss: "2",
                      status: "Disconnected",
                      aht: "20",
                      fcr: "89",
                      far: "60"
                      
                    },
                  ].map((row, i) => (
                    <tr key={i} className="text-white">
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
    )
}