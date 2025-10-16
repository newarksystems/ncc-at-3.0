"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Users, MoreHorizontal, Phone } from "lucide-react"
import { TbPhoneCheck, TbRefreshAlert, TbRefreshDot } from "react-icons/tb"
import { TfiHeadphoneAlt } from "react-icons/tfi"
import { BsFillPhoneVibrateFill, BsTelephoneForwardFill } from "react-icons/bs"
import { MdOutlineSupportAgent, MdPhoneCallback, MdPhoneMissed } from "react-icons/md"
import { HiPhoneArrowDownLeft, HiPhoneArrowUpRight } from "react-icons/hi2"
import { BiSolidPhoneCall } from "react-icons/bi"
import { GiReceiveMoney } from "react-icons/gi"
import { useLiveCalls } from "@/hooks/useLiveCalls"
import { LiveCall } from "@/services/api"

export default function CallsLiveActions() {
    const [showAnsweredTooltip, setShowAnsweredTooltip] = useState(false)
    const [showUnansweredTooltip, setShowUnansweredTooltip] = useState(false)
    const { liveCalls, loading, error, refresh } = useLiveCalls()

    // Calculate statistics
    const talkingCalls = liveCalls.filter(call => call.status === 'talking').length
    const callingCalls = liveCalls.filter(call => call.status === 'ringing').length
    const outboundCalls = liveCalls.filter(call => call.direction === 'outbound').length
    const inboundCalls = liveCalls.filter(call => call.direction === 'inbound').length
    const totalCalls = liveCalls.length
    const answeredCalls = liveCalls.filter(call => call.status === 'answered' || call.status === 'talking').length
    const unansweredCalls = liveCalls.filter(call => call.status === 'unanswered').length
    const answeredPercentage = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0
    const unansweredPercentage = totalCalls > 0 ? Math.round((unansweredCalls / totalCalls) * 100) : 0

    // Format call data for the table
    const formatCallData = (call: LiveCall) => {
        const callStart = new Date(call.call_start)
        const now = new Date()
        const duration = Math.floor((now.getTime() - callStart.getTime()) / 1000)
        const minutes = Math.floor(duration / 60)
        const seconds = duration % 60
        
        return {
            agent: call.agent_name || "Unknown",
            callee: call.callee_display_name || call.callee_number || "Unknown",
            since_start: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            talking_time: call.talk_time || "00:00",
            status: call.status,
            call_direction: call.direction,
            type: "External", // This would come from actual data
        }
    }

    return (
      <>                
        <div className="text-white">
          <div className="p-4 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 min-h-[140px] items-stretch">
              {/* Left Stats */}
              <div className="w-full md:w-1/4 bg-slate-800 border-slate-700 p-3 flex flex-col">
                <span className="text-sm text-green-400">Live data</span>
                <div className=" flex flex-col md:flex-row justify-center bg-slate-900 gap-0.5 min-h-[115px] border border-green-300">
                  <div className="relative flex items-center justify-center bg-slate-800 w-full ">
                    <span className="text-sm text-slate-300 sm:absolute top-1 left-1/2 transform -translate-x-1/2 md:self-start">CALLS</span>
                    <div className="flex items-center justify-center md:mt-3 gap-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <TfiHeadphoneAlt className="w-6 h-6" />
                          <span className="text-2xl lg:text-3xl font-bold text-green-400">{talkingCalls}</span>
                        </div>
                        <span className="text-slate-400">TALKING</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <BsFillPhoneVibrateFill className="w-6 h-6" />
                          <span className="text-2xl lg:text-3xl font-bold text-blue-400">{callingCalls}</span>
                        </div>
                        <span className="text-slate-400">CALLING</span>
                      </div>
                    </div>
                  </div>
        
                  <div className="relative flex items-center justify-center bg-slate-800 gap-4 w-full">
                    <span className="text-sm text-slate-300 sm:absolute top-1 left-1/3 transform -translate-x-0.75 md:self-start">CALL DIRECTION</span>
                    <div className="flex items-center md:mt-3 gap-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <HiPhoneArrowUpRight className="w-6 h-6" />
                          <span className="text-2xl lg:text-3xl font-bold text-green-400">{outboundCalls}</span>
                        </div>
                        <span className="text-slate-400">OUTBOUND</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <HiPhoneArrowDownLeft className="w-6 h-6" />
                          <span className="text-2xl lg:text-3xl font-bold text-slate-400">{inboundCalls}</span>
                        </div>
                        <span className="text-slate-400">INBOUND</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
        
                  {/* Right Stats */}
                  <div className="w-full md:w-3/4 bg-slate-800 border-slate-900 p-3 flex flex-col">
                    <span className="text-sm text-cyan-500">Since last database update</span>
                    <div className="">
                      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 bg-slate-900 gap-0.5 text-center border border-cyan-400">
                        <div className="flex flex-col items-center px-1 pt-2 bg-slate-800 px-2">
                          <div className="flex items-center gap-2">
                            <MdPhoneCallback className="w-8 h-8 text-blue-400" />
                            <p className="text-4xl tracking-wide">{totalCalls}</p>
                          </div>
                          <p className="text-slate-400">TOTAL CALLS</p>
        
                          {/* Answered vs Unanswered bar */}
                          <div className="relative flex w-full h-4 mt-2 md:top-2">
                            {/* Answered */}
                            <div 
                              className="flex-1 bg-green-500 flex items-center justify-center group relative"
                              onClick={() => setShowAnsweredTooltip((prev) => !prev)}
                              onMouseEnter={() => setShowAnsweredTooltip(true)}
                              onMouseLeave={() => setShowAnsweredTooltip(false)}
                            >
                              <span className="text-xs text-white">{answeredPercentage}%</span>
                              {/* Tooltip */}
                              {showAnsweredTooltip && (
                        <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          Answered Calls {answeredPercentage}%
                        </div>
                              )}
                            </div>
        
                            {/* Unanswered */}
                            <div 
                              className="flex-[0.33] bg-red-400 flex items-center justify-center group relative"
                              onClick={() => setShowUnansweredTooltip((prev) => !prev)}
                              onMouseEnter={() => setShowUnansweredTooltip(true)}
                              onMouseLeave={() => setShowUnansweredTooltip(false)}
                            >
                              <span className="text-xs text-white">{unansweredPercentage}%</span>
                              {/* Tooltip */}
                            {showUnansweredTooltip && (
                        <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          Unanswered Calls {unansweredPercentage}%
                        </div>
                      )}
                            </div>
                          </div>
                        </div>
        
                        <div className="grid grid-cols-2 bg-slate-800 py-1">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 justify-end">
                              <TbPhoneCheck className="text-green-400" />
                              <p className="text-xl">{answeredCalls}</p>
                            </div>
                            <p className="text-[11px] text-slate-300 tracking-wider">ANSWERED</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <HiPhoneArrowUpRight className="text-red-400" />
                              <p className="text-xl">21</p>
                            </div>
                            <p className="text-[11px] text-slate-300 tracking-wider">LINE BUSY</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 justify-end">
                              <MdPhoneMissed className="text-red-400" />
                              <p className="text-xl">{unansweredCalls}</p>
                            </div>
                            <p className="text-[11px] text-slate-300 tracking-wider">UNANSWERED</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <TbRefreshAlert className="text-[#b9a000ec]" />
                              <p className="text-xl">21</p>
                            </div>
                            <p className="text-[11px] tracking-wider">OFFLINE</p>
                          </div>
                        </div>
        
                        <div className="grid grid-cols-2 bg-slate-800 py-1">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1 justify-end">
                                <MdOutlineSupportAgent className="w-6 h-6 text-green-400" />
                                <p className="text-xl">01:30</p>
                              </div>
                              <p className="text-[11px] text-slate-300 tracking-wider">AVG RINGING TIME</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1 justify-end">
                                <MdOutlineSupportAgent className="w-6 h-6 text-green-400" />
                                <p className="text-xl">00:39</p>
                              </div>
                              <p className="text-[11px] text-slate-300 tracking-wider">AVG TALKING TIME</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1 justify-end">
                                <BsTelephoneForwardFill className="w-6 h-4 text-yellow-400" />
                                <p className="text-xl">5.7%</p>
                              </div>
                              <p className="text-[11px] text-slate-300 tracking-wider">RIGHT PARTY CONTACT RATE</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1 justify-end">
                                <TbRefreshDot className="w-6 h-4 text-yellow-400" />
                                <p className="text-xl">100%</p>
                              </div>
                              <p className="text-[11px] text-slate-300 tracking-wider">PTP FULFILLMENT</p>
                            </div>
                        </div>
        
                        <div className="grid grid-cols-2 bg-slate-800 py-1">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 justify-end">
                              <MdOutlineSupportAgent className="w-6 h-6 text-indigo-400" />
                              <p className="text-xl">03:15</p>
                            </div>
                            <p className="text-[11px] text-slate-300 tracking-wider">AVERAGE TALK TIME</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 justify-end">
                              <BiSolidPhoneCall className="w-6 h-5 text-yellow-400" />
                              <p className="text-xl">03:22</p>
                            </div>
                            <p className="text-[11px] text-slate-300 tracking-wider">LONGEST TALK TIME</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 justify-end">
                              <MdOutlineSupportAgent className="w-6 h-6 text-indigo-400" />
                              <p className="text-xl">00:20</p>
                            </div>
                            <p className="text-[11px] text-slate-300 tracking-wider">AVG CALL ATTEMPT DURATION</p>
                          </div>
                          <div className="flex flex-col items-center mt-2">
                            <div className="flex items-center gap-1 justify-end">
                              <GiReceiveMoney className="w-6 h-6 text-yellow-400" />
                              <p className="text-xl">30,000</p>
                            </div>
                            <p className="text-[11px] text-slate-300 tracking-wider">TOTAL COLLECTED</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
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
                    <tr className="text-left text-slate-300">
                        <th className="border border-slate-600 bg-slate-700 px-4 py-2">Caller</th>
                        <th className="border border-slate-600 bg-slate-700 px-4 py-2">Callee</th>
                        <th className="border border-slate-600 bg-slate-700 px-4 py-2">Since Start</th>
                        <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Talking Time</th>
                        <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Status</th>
                        <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Direction</th>
                        <th className="border border-slate-600 p-2 bg-slate-700 text-slate-300">Type</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="p-4 text-center text-slate-300">
                                Loading calls...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={7} className="p-4 text-center text-red-400">
                                Error loading calls: {error}
                            </td>
                        </tr>
                    ) : (
                        liveCalls.map((call) => {
                            const row = formatCallData(call)
                            return (
                                <tr key={call.id} className="text-white">
                                    <td className="p-2 border border-slate-600">
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-orange-400" />
                                            {row.agent}
                                        </div>
                                    </td>
                                    <td className="p-2 border border-slate-600">
                                        {row.callee}
                                    </td>
                                    <td className="p-2 border border-slate-600">{row.since_start}</td>
                                    <td className="p-2 border border-slate-600">
                                        {row.talking_time}
                                    </td>
                                    <td className={`${row.status === "talking" || row.status === "answered" ? 'p-2 border border-slate-600 text-green-400' : 'p-2 border border-slate-600 text-rose-400'}`}>
                                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                    </td>
                                    <td className={`${row.call_direction === "outbound" ? 'p-2 border border-slate-600 text-sky-300' : 'p-2 border border-slate-600 text-orange-400'}`}>
                                        {row.call_direction.charAt(0).toUpperCase() + row.call_direction.slice(1)}
                                    </td>
                                    <td className={`${row.type === "External" ? 'p-2 border border-slate-600 text-indigo-500' : 'p-2 border border-slate-600 text-pink-400'}`}>
                                        {row.type}
                                    </td>
                                </tr>
                            )
                        })
                    )}
                    </tbody>
                </table>
              </div>
            </div>
        </>
    )
}