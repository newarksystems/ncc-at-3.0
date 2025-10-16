// 'use client'

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import {
//   ChevronLeft,
//   ChevronRight,
//   RotateCcw,
//   Pause,
//   Users,
//   Settings,
//   MoreHorizontal,
//   Phone,
//   Minimize2,
//   RefreshCcw,
// } from "lucide-react"
// import { FaHandshake, FaUsers } from "react-icons/fa"
// import { TbHeadphonesFilled, TbPhoneCheck, TbPhoneRinging, TbRefreshAlert, TbRefreshDot } from "react-icons/tb"
// import { ImPhoneHangUp } from "react-icons/im"
// import { TfiHeadphoneAlt } from "react-icons/tfi"
// import { BsFillPhoneVibrateFill, BsTelephoneForwardFill } from "react-icons/bs"
// import { PiPhoneListFill, PiUsersFourFill } from "react-icons/pi"
// import { MdOutlineSupportAgent, MdPhoneCallback, MdPhoneMissed } from "react-icons/md"
// import { HiPhoneArrowUpRight } from "react-icons/hi2"
// import { BiSolidPhoneCall } from "react-icons/bi"
// import { GiReceiveMoney } from "react-icons/gi"
// import { LiveCallsTable } from "../livecalls"
// import CallsRatePerHour from "../callratesperhour"
// import { AgentPerformanceDash } from "../agentperformancedash"

// export default function Dashboard() {
//   const [showAnsweredTooltip, setShowAnsweredTooltip] = useState(false);
//   const [showUnansweredTooltip, setShowUnansweredTooltip] = useState(false);
//   const [showPassedSlaTooltip, setShowPassedSlaTooltip] = useState(false);
//   const [showFailedSlaTooltip, setShowFailedSlaTooltip] = useState(false)

//   return (
//     <div className="min-h-screen text-white ">
//       {/* Header */}
//       <header className="border-b border-slate-700 px-6 py-3">
//         <div className="flex items-center justify-between overflow-x-auto">
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
//                 <div className="w-4 h-4 bg-white rounded-sm"></div>
//               </div>
//               <div>
//                 <div className="text-sm font-medium text-blue-400">NEWARK CALL CENTER</div>
//               </div>
//             </div>

//             <div className="flex items-center gap-2 ml-8">
//               <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
//                 <ChevronLeft className="w-4 h-4" />
//               </Button>
//               <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
//                 <ChevronRight className="w-4 h-4" />
//               </Button>
//               <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
//                 <RotateCcw className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>

//           <div className="flex items-center gap-4">
//             <div className="text-xs text-slate-400">
//               <span className="text-green-400">⚡ DATA UPDATE IN</span> 44:18
//             </div>
//             <div className="text-xs text-slate-400">
//               <span className="text-blue-400">🕒 LAST UPDATE</span> 5:15:21 am
//             </div>
//             <div className="text-xs text-slate-400">(EVERY 60 MINUTES)</div>
//             <div className="flex items-center gap-1">
//               <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">?</div>
//               <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">✓</div>
//               <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs">i</div>
//               <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">U</div>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Navigation Bar */}
//       <div className="bg-slate-800 border-b border-slate-700 px-6 py-2 overflow-x-auto">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2 text-sm">
//             <span className="text-white">Queues</span>
//             <span className="text-slate-400">&gt;</span>
//             <span className="text-white">Live</span>
//             <span className="text-slate-400">&gt;</span>
//             <span className="text-white">Standard</span>
//             <select className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm ml-4">
//               <option>-- Select --</option>
//             </select>
//           </div>
//           <div className="flex items-center gap-2">
//             <span className="text-xs text-slate-400">LIVE DATA</span>
//             <Button
//               variant="outline"
//               size="sm"
//               className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
//             >
//               <Pause className="w-4 h-4 mr-1" />
//               Pause
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
//             >
//               <Users className="w-4 h-4 mr-1" />
//               Queues
//             </Button>
//             <Button variant="ghost" size="sm" className="text-slate-400">
//               <Settings className="w-4 h-4" />
//             </Button>
//             <Button variant="ghost" size="sm" className="text-slate-400">
//               <MoreHorizontal className="w-4 h-4" />
//             </Button>
//           </div>
//         </div>
//       </div>

//       <div className="">
//       <div className="p-6 space-y-6">
//         <div className="flex flex-col md:flex-row gap-4 min-h-[140px] items-stretch">
//           {/* Left Stats */}
//           <div className="w-full md:w-1/4 bg-slate-800 border-slate-700 p-3 flex flex-col">
//             <span className="text-sm text-green-400">Live data</span>
//             <div className=" flex flex-col md:flex-row justify-center bg-slate-900 gap-0.5 min-h-[115px] border border-green-300">
//               <div className="relative flex items-center justify-center bg-slate-800 w-full ">
//                 <span className="text-sm text-slate-300 sm:absolute top-1 left-1/2 transform -translate-x-1/2 md:self-start">CALLS</span>
//                 <div className="flex items-center justify-center md:mt-3 gap-6">
//                   <div className="flex flex-col">
//                     <div className="flex items-center gap-2">
//                       <TfiHeadphoneAlt className="w-6 h-6" />
//                       <span className="text-2xl lg:text-3xl font-bold text-green-400">5</span>
//                     </div>
//                     <span className="text-slate-400">TALKING</span>
//                   </div>
//                   <div className="flex flex-col">
//                     <div className="flex items-center gap-2">
//                       <BsFillPhoneVibrateFill className="w-6 h-6" />
//                       <span className="text-2xl lg:text-3xl font-bold text-blue-400">4</span>
//                     </div>
//                     <span className="text-slate-400">CALLING</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="relative flex items-center justify-center bg-slate-800 gap-4 w-full">
//                 <span className="text-sm text-slate-300 sm:absolute top-1 left-1/2 transform -translate-x-0.75 md:self-start">AGENTS</span>
//                 <div className="flex items-center md:mt-3 gap-6">
//                   <div className="flex flex-col gap-1">
//                     <div className="flex items-center gap-2">
//                       <FaUsers className="w-6 h-6" />
//                       <span className="text-2xl lg:text-3xl font-bold text-green-400">50</span>
//                     </div>
//                     <span className="text-slate-400">ALL</span>
//                   </div>
//                   <div className="flex flex-col gap-1">
//                     <div className="flex items-center gap-2">
//                       <ImPhoneHangUp className="w-6 h-6" />
//                       <span className="text-2xl lg:text-3xl font-bold text-slate-400">22</span>
//                     </div>
//                     <span className="text-slate-400">AVAILABLE</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Stats */}
//           <div className="w-full md:w-3/4 bg-slate-800 border-slate-900 p-3 flex flex-col">
//             <span className="text-sm text-cyan-500">Since last database update</span>
//             <div className="">
//               <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 bg-slate-900 gap-0.5 text-center border border-cyan-400">
//                 <div className="flex flex-col items-center px-1 pt-2 bg-slate-800 px-2">
//                   <div className="flex items-center gap-2">
//                     <MdPhoneCallback className="w-8 h-8 text-blue-400" />
//                     <p className="text-4xl tracking-wide">141</p>
//                   </div>
//                   <p className="text-slate-400">TOTAL DIALED CALLS</p>

//                   {/* Answered vs Unanswered bar */}
//                   <div className="relative flex w-full h-4 mt-2 md:top-4">
//                     {/* Answered */}
//                     <div 
//                       className="flex-1 bg-green-500 flex items-center justify-center group relative"
//                       onClick={() => setShowAnsweredTooltip((prev) => !prev)}
//                       onMouseEnter={() => setShowAnsweredTooltip(true)}
//                       onMouseLeave={() => setShowAnsweredTooltip(false)}
//                     >
//                       <span className="text-xs text-white">67%</span>
//                       {/* Tooltip */}
//                       {showAnsweredTooltip && (
//                 <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
//                   Connected Calls 67%
//                 </div>
//                       )}
//                     </div>

//                     {/* Unanswered */}
//                     <div 
//                       className="flex-[0.33] bg-red-400 flex items-center justify-center group relative"
//                       onClick={() => setShowUnansweredTooltip((prev) => !prev)}
//                       onMouseEnter={() => setShowUnansweredTooltip(true)}
//                       onMouseLeave={() => setShowUnansweredTooltip(false)}
//                     >
//                       <span className="text-xs text-white">33%</span>
//                       {/* Tooltip */}
//                     {showUnansweredTooltip && (
//                 <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
//                   Disconnected Calls 33%
//                 </div>
//               )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 bg-slate-800 py-1">
//                   <div className="flex flex-col items-center">
//                     <div className="flex items-center gap-1 justify-end">
//                       <TbPhoneCheck className="text-green-400" />
//                       <p className="text-xl">94</p>
//                     </div>
//                     <p className="text-[11px] text-slate-300 tracking-wider">CONNECTED</p>
//                   </div>
//                   <div className="flex flex-col items-center">
//                     <div className="flex items-center gap-1">
//                       <HiPhoneArrowUpRight className="text-red-400" />
//                       <p className="text-xl">21</p>
//                     </div>
//                     <p className="text-[11px] text-slate-300 tracking-wider">TO FOLLOW-UP</p>
//                   </div>
//                   <div className="flex flex-col items-center">
//                     <div className="flex items-center gap-1 justify-end">
//                       <MdPhoneMissed className="text-red-400" />
//                       <p className="text-xl">47</p>
//                     </div>
//                     <p className="text-[11px] text-slate-300 tracking-wider">DISCONNECTED</p>
//                   </div>
//                   <div className="flex flex-col items-center">
//                     <div className="flex items-center gap-1">
//                       <TbRefreshAlert className="text-[#b9a000ec]" />
//                       <p className="text-xl">21</p>
//                     </div>
//                     <p className="text-[11px] tracking-wider">CALLBACKS</p>
//                   </div>
//                 </div>
//                 <div className="flex flex-col justify-center items-center bg-slate-800 px-1">
//                   <div className="flex justify-center items-center gap-2">
//                     <FaHandshake className="w-8 h-8 text-blue-300" />
//                     <p className="text-3xl">93.6%</p>
//                   </div>
//                   <p className="text-[17px] text-slate-400">SERVICE LEVEL</p>
//                   <div className="relative flex w-full h-4 mt-2 md:top-3">
//                     <div 
//                       className="flex-1 bg-green-500 flex items-center justify-center group relative"
//                       onClick={() => setShowPassedSlaTooltip((prev) => !prev)}
//                       onMouseEnter={() => setShowPassedSlaTooltip(true)}
//                       onMouseLeave={() => setShowPassedSlaTooltip(false)}
//                     >
//                       <span className="text-xs text-white">70%</span>

//                       {showPassedSlaTooltip && (
//                         <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
//                           Passed SLA 70%
//                         </div>
//                       )}
//                     </div>

//                     <div 
//                       className="flex-[0.30] bg-red-400 flex items-center justify-center group relative"
//                       onClick={() => setShowFailedSlaTooltip((prev) => !prev)}
//                       onMouseEnter={() => setShowFailedSlaTooltip(true)}
//                       onMouseLeave={() => setShowFailedSlaTooltip(false)}
//                     >
//                       <span className="text-xs text-white">30%</span>
//                       {showFailedSlaTooltip && (
//                         <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
//                           Failed SLA 30%
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 bg-slate-800 py-1">
//                   {/* FCR -> when an account is resolved on first conversation with borrower i.e (payment/valid PTP) : Could take even 2 to 3 attempts*/}
//                     <div className="flex flex-col items-center">
//                       <div className="flex items-center gap-1 justify-end">
//                         <MdOutlineSupportAgent className="w-6 h-6 text-green-400" />
//                         <p className="text-xl">86.1%</p>
//                       </div>
//                       <p className="text-[11px] text-slate-300 tracking-wider">FCR</p>
//                     </div>
//                     {/* FAR -> when the case/account is resolved strictly on the very first dial attempt : It takes the very first dial attempt*/}
//                     <div className="flex flex-col items-center">
//                       <div className="flex items-center gap-1 justify-end">
//                         <MdOutlineSupportAgent className="w-6 h-6 text-green-400" />
//                         <p className="text-xl">86.1%</p>
//                       </div>
//                       <p className="text-[11px] text-slate-300 tracking-wider">FAR</p>
//                     </div>
//                     <div className="flex flex-col items-center">
//                       <div className="flex items-center gap-1 justify-end">
//                         <BsTelephoneForwardFill className="w-6 h-4 text-yellow-400" />
//                         <p className="text-xl">5.7%</p>
//                       </div>
//                       <p className="text-[11px] text-slate-300 tracking-wider">RIGHT PARTY CONTACT RATE</p>
//                     </div>
//                     <div className="flex flex-col items-center">
//                       <div className="flex items-center gap-1 justify-end">
//                         <TbRefreshDot className="w-6 h-4 text-yellow-400" />
//                         <p className="text-xl">100%</p>
//                       </div>
//                       <p className="text-[11px] text-slate-300 tracking-wider">PTP FULFILLMENT</p>
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-2 bg-slate-800 py-1">
//                   <div className="flex flex-col items-center">
//                     <div className="flex items-center gap-1 justify-end">
//                       <MdOutlineSupportAgent className="w-6 h-6 text-indigo-400" />
//                       <p className="text-xl">03:15</p>
//                     </div>
//                     <p className="text-[11px] text-slate-300 tracking-wider">AVERAGE TALK TIME</p>
//                   </div>
//                   <div className="flex flex-col items-center">
//                     <div className="flex items-center gap-1 justify-end">
//                       <BiSolidPhoneCall className="w-6 h-5 text-yellow-400" />
//                       <p className="text-xl">03:22</p>
//                     </div>
//                     <p className="text-[11px] text-slate-300 tracking-wider">LONGEST TALK TIME</p>
//                   </div>
//                   <div className="flex flex-col items-center">
//                     <div className="flex items-center gap-1 justify-end">
//                       <MdOutlineSupportAgent className="w-6 h-6 text-indigo-400" />
//                       <p className="text-xl">00:20</p>
//                     </div>
//                     <p className="text-[11px] text-slate-300 tracking-wider">AVG CALL ATTEMPT DURATION</p>
//                   </div>
//                   <div className="flex flex-col items-center mt-2">
//                     <div className="flex items-center gap-1 justify-end">
//                       <GiReceiveMoney className="w-6 h-6 text-yellow-400" />
//                       <p className="text-xl">30,000</p>
//                     </div>
//                     <p className="text-[11px] text-slate-300 tracking-wider">TOTAL COLLECTED</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>

//         {/* Tables Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2  gap-6 px-6 pb-6">
//           {/* Live Calls*/}
//          <LiveCallsTable />

//           {/* Hourly calls rate bar */}
//          <CallsRatePerHour />
//         </div>

//         {/* Bottom Tables */}
//         <div className="grid grid-cols-1 md:grid-cols-1 px-6 gap-6">
//           {/* Agents Logged In */}
//           <AgentPerformanceDash />
//         </div>
//       </div>
    
//   )
// }
