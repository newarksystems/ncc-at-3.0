import { useState } from "react";
import { Badge } from "../ui/badge";
import { Minimize2, Phone, X, RefreshCcw } from "lucide-react";

export function AgentPerformanceDash() {
    const [isFullscreen, setIsFullScreen] = useState(false)

    return (
        <div className={`${isFullscreen 
            ? 'fixed inset-0 z-50 bg-slate-900'
            : 'bg-slate-800'
        }`}>
            <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm text-sky-400">Agents' Performance</h3>
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
                        colSpan={3}
                      >Agent Info</th>
                      <th
                        className="bg-slate-900 border border-slate-600 px-4 py-2 text-sky-300"
                        colSpan={4}
                      >Call</th>
                      <th
                        className="bg-slate-700 border border-slate-600 px-4 py-2 text-sky-300"
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
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">Amount Collected (Today)</th>
                    {/* calls row */}
                    <th className="border border-slate-600 p-2 bg-slate-900 text-slate-300">Outbound Calls</th>
                    <th className="border border-slate-600 p-2 bg-slate-900 text-slate-300">AHT</th>
                    <th className="border border-slate-600 p-2 bg-slate-900 text-slate-300">Inbound Calls</th>
                    <th className="border border-slate-600 p-2 bg-slate-900 text-slate-300">Status</th>
                    {/* logged in info */}
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">At</th>
                    <th className="border border-slate-600 bg-slate-700 px-4 py-2">For</th>
                    {/* logged out info */}
                    <th className="bg-red-400 border border-slate-600 p-2 text-slate-300">At</th>
                    <th className="bg-red-400 border border-slate-600 p-2 text-slate-300">For</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      agent: "Doris Glimp",
                      availability: "Available",
                      // phone: "5554448842",
                      amount_collected: "10000",
                      outbound_calls: "20",
                      avg_handling_time: "7:31",
                      inbound_calss: "5",
                      status: "Disconnected",
                      li_at: "08:00",
                      li_for: "9:20",
                      lo_at: "02:13",
                      lo_for: "2:14",
                      
                    },
                    {
                      agent: "Mark Simon",
                      availability: "Available",
                      // phone: "5554448842",
                      amount_collected: "10000",
                      outbound_calls: "50",
                      avg_handling_time: "5:31",
                      inbound_calss: "15",
                      status: "Connected",
                      li_at: "08:00",
                      li_for: "8:20",
                      lo_at: "02:45",
                      lo_for: "2:34",
                      
                    },
                    {
                      agent: "Susan Yalovsky",
                      availability: "Away",
                      // phone: "5554448842",
                      amount_collected: "20000",
                      outbound_calls: "80",
                      avg_handling_time: "2:33",
                      inbound_calss: "10",
                      status: "Disconnected",
                      li_at: "08:15",
                      li_for: "6:20",
                      lo_at: "01:30",
                      lo_for: "2:14",
                      
                    },
                    {
                      agent: "Mary Homer",
                      availability: "Do Not Disturb",
                      // phone: "5554448842",
                      amount_collected: "30000",
                      outbound_calls: "25",
                      avg_handling_time: "7:31",
                      inbound_calss: "25",
                      status: "Connected",
                      li_at: "08:00",
                      li_for: "9:20",
                      lo_at: "02:13",
                      lo_for: "2:14",
                      
                    },
                    {
                      agent: "Britta Shoop",
                      availability: "Available",
                      // phone: "5554448842",
                      amount_collected: "60000",
                      outbound_calls: "90",
                      avg_handling_time: "5:10",
                      inbound_calss: "2",
                      status: "Disconnected",
                      li_at: "06:00",
                      li_for: "9:20",
                      lo_at: "02:30",
                      lo_for: "2:14",
                      
                    },
                  ].map((row, i) => (
                    <tr key={i} className="text-white">
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
                            row.availability === "Available"
                              ? "bg-green-500/70 text-white"
                              : row.availability === "Do Not Disturb"
                                ? "bg-red-500/90 text-white"
                                : row.availability === "Away"
                                  ? "bg-orange-500/80 text-white"
                                  : "bg-blue-600 text-white"
                          }`}
                        >
                          {row.availability}
                        </Badge>
                      </td>
                      <td className="p-2 border border-slate-600">{row.amount_collected}</td>
                      <td className="p-2 border border-slate-600">
                          {row.outbound_calls}
                      </td>
                      <td className="p-2 border border-slate-600">{row.avg_handling_time}</td>
                      <td className="p-2 border border-slate-600">{row.inbound_calss}</td>
                      <td className="p-2 border border-slate-600">{row.status}</td>
                      <td className="p-2 border border-slate-600">{row.li_at}</td>
                      <td className="p-2 border border-slate-600">{row.li_for}</td>
                      <td className="p-2 border border-slate-600">{row.lo_at}</td>
                      <td className="p-2 border border-slate-600">{row.lo_for}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
    )
}