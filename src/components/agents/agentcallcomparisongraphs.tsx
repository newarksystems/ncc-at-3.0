"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { RefreshCcw, X, Minimize2 } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { Agent } from "@/services/api";

type TotalCallsData = {
  hour: string;
  [key: string]: number | string;
};

// Generate sample hourly data for each agent
const generateHourlyData = (agents: Agent[]): TotalCallsData[] => {
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00"];
  
  return hours.map(hour => {
    const data: TotalCallsData = { hour };
    agents.forEach(agent => {
      // Generate realistic call counts based on agent's total calls
      const baseCalls = Math.floor(agent.total_calls / 5);
      const variation = Math.floor(Math.random() * 10);
      data[agent.first_name] = baseCalls + variation;
    });
    return data;
  });
};

export default function AgentsTotalCallsComparison() {
  const [isFullscreen, setIsFullScreen] = useState(false)
  const { agents, loading, error, refresh } = useAgents();
  const chartData = generateHourlyData(agents);

  // Define colors for agents
  const agentColors = [
    "#22c55e", // green
    "#3b82f6", // blue
    "#f97316", // orange
    "#a855f7", // purple
    "#eab308", // yellow
  ];

  return (
    <div
      className={`${
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-900 px-2"
          : "bg-slate-800 border border-slate-900"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between py-1.5 px-3 border-b border-slate-700">
        <h2 className="text-sm text-sky-400">
          Agents Total Calls Comparison
        </h2>
        <div className="flex items-center gap-4">
          <button 
            className="text-slate-400 hover:text-slate-200"
            onClick={refresh}
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullscreen)}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            {isFullscreen ? (
              <X className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className={`${isFullscreen ? "h-[1000px] w-full" : "h-80 w-full"}`}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400">Loading chart data...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400">Error loading chart data: {error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
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

              {/* Dynamically generate lines for each agent */}
              {agents.map((agent, index) => (
                <Line
                  key={agent.id}
                  type="monotone"
                  dataKey={agent.first_name}
                  stroke={agentColors[index % agentColors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={agent.first_name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
