"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Minus, Maximize2, X, Minimize2, RefreshCcw } from "lucide-react";

type CallData = {
  hour: string;
  connected: number;
  offline: number;
  missed: number;
  other: number;
};

const sampleData: CallData[] = [
  { hour: "08:00", connected: 20, offline: 10, missed: 5, other: 2 },
  { hour: "09:00", connected: 25, offline: 7, missed: 4, other: 3 },
  { hour: "10:00", connected: 15, offline: 12, missed: 6, other: 1 },
  { hour: "11:00", connected: 30, offline: 8, missed: 5, other: 2 },
  { hour: "12:00", connected: 28, offline: 6, missed: 7, other: 4 },
];

export default function CallsRatePerHour() {
  const [isFullscreen, setIsFullScreen] = useState(false)

  return (
    <div className={`${
      isFullscreen ? "fixed inset-0 z-50 bg-slate-900 px-2"
                   : "bg-slate-800 border border-slate-900"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between py-1.5 px-3 border-b border-slate-700">
        <h2 className="text-sm text-sky-400">
          Calls Rate Per Hour
        </h2>
        <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-slate-200">
          <RefreshCcw className="w-4 h-4"/>
        </button>
        <button
          onClick={() => setIsFullScreen(!isFullscreen)}
          className="text-slate-400 hover:text-slate-200 transition"
        >
          {isFullscreen ? <X className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
        </div>
      </div>

        <div className={`${isFullscreen ? 'h-[1000px] w-full' : 'h-80 w-full'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sampleData} barCategoryGap="20%">
              <XAxis dataKey="hour" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Bar dataKey="connected" stackId="a" fill="#22c55e" name="Connected Calls" />
              <Bar dataKey="offline" stackId="a" fill="#3b82f6" name="Offline Contacts" />
              <Bar dataKey="missed" stackId="a" fill="#f97316" name="Missed - No Response" />
              <Bar dataKey="other" stackId="a" fill="#a855f7" name="Other" />
            </BarChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
}

