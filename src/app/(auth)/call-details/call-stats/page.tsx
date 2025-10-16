"use client";

import React, { useState, useEffect } from "react";
import { MdPhoneCallback } from "react-icons/md";
import { RefreshCcw, Minimize2, X } from "lucide-react";
import { BsFillTelephoneInboundFill, BsFillTelephoneOutboundFill } from "react-icons/bs";
import { TbPhoneDone } from "react-icons/tb";
import { LuPhoneCall } from "react-icons/lu";
import { useCallStats } from "@/hooks/useCallStats";
import { Call } from "@/services/api";

interface HourData {
  hour: string;
  value: number;
}

interface DayData {
  day: string;
  hours: HourData[];
}

const generateHeatMapData = (calls: Call[]): [DayData[], DayData[]] => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const hours = Array.from({ length: 15 }, (_, i) =>
    `${6 + i}:00 ${6 + i < 12 ? "AM" : "PM"}`
  );

  // Initialize data structures
  const inboundData: DayData[] = days.map(day => ({
    day,
    hours: hours.map(hour => ({ hour, value: 0 }))
  }));

  const outboundData: DayData[] = days.map(day => ({
    day,
    hours: hours.map(hour => ({ hour, value: 0 }))
  }));

  // Process calls to populate heat map data
  calls.forEach(call => {
    const callDate = new Date(call.call_start);
    const dayIndex = callDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = callDate.getHours();
    
    // Adjust day index to match our array (0 = Monday)
    const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    
    // Find hour index
    const hourIndex = hour - 6; // Assuming we start from 6 AM
    
    if (hourIndex >= 0 && hourIndex < 15) {
      if (call.direction === "inbound") {
        inboundData[adjustedDayIndex].hours[hourIndex].value += 1;
      } else if (call.direction === "outbound") {
        outboundData[adjustedDayIndex].hours[hourIndex].value += 1;
      }
    }
  });

  return [inboundData, outboundData];
};

const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}> = ({ percentage, size = 120, strokeWidth = 12, color = "#10b981" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{percentage}%</span>
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          {percentage > 50 ? "ANSWERED" : "UNANSWERED"}
        </span>
      </div>
    </div>
  );
};

// Heat Map Cell Component
const HeatMapCell: React.FC<{ value: number }> = ({ value }) => {
  const getColor = (val: number): string => {
    if (val === 0) return "#374151";
    if (val > 20) return "#10b981";
    if (val > 10) return "#059669";
    if (val > 5) return "#047857";
    return "#065f46";
  };

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-gray-600"
      style={{ backgroundColor: getColor(value) }}
    >
      {value}
    </div>
  );
};

const SummaryDashboard: React.FC = () => {
  const [showInboundTooltip, setShowInboundTooltip] = useState(false);
  const [showAnsweredTooltip, setShowAnsweredTooltip] = useState(false);
  const [showOutboundTooltip, setShowOutboundTooltip] = useState(false);
  const [isSummaryFullScreen, setIsSummaryFullScreen] = useState(false)
  const [showOutboundAnsweredTooltip, setShowOutboundAnsweredTooltip] = useState(false);
  const [showInternalTooltip, setShowInternalTooltip] = useState(false);
  const { calls, loading, error, refresh } = useCallStats();

  // Calculate statistics
  const outboundCalls = calls.filter(call => call.direction === "outbound");
  const inboundCalls = calls.filter(call => call.direction === "inbound");
  const answeredCalls = calls.filter(call => call.status === "answered");
  const unansweredCalls = calls.filter(call => call.status === "unanswered");
  
  const outboundAnswered = outboundCalls.filter(call => call.status === "answered");
  const outboundUnanswered = outboundCalls.filter(call => call.status === "unanswered");
  const inboundAnswered = inboundCalls.filter(call => call.status === "answered");
  const inboundUnanswered = inboundCalls.filter(call => call.status === "unanswered");
  
  const outboundPercentage = outboundCalls.length > 0 ? Math.round((outboundAnswered.length / outboundCalls.length) * 100) : 0;
  const inboundPercentage = inboundCalls.length > 0 ? Math.round((inboundAnswered.length / inboundCalls.length) * 100) : 0;
  
  const totalAnswered = answeredCalls.length;
  const totalUnanswered = unansweredCalls.length;
  
  // Generate heat map data
  const [inboundHeatMap, outboundHeatMap] = generateHeatMapData(calls);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="bg-slate-900 ">
       <div className="p-2 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
        <h3 className="text-sm text-sky-400">Summary</h3>
        <button 
          className="text-slate-400 cursor-pointer"
          onClick={refresh}
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-4">
        <div className="flex flex-col items-center px-1 pt-2 bg-slate-800">
          <div className="flex items-center gap-2">
            <BsFillTelephoneOutboundFill className="w-5 h-5 text-green-400" />
            <p className="text-3xl tracking-wide">{outboundCalls.length}</p>
          </div>
          <p className="text-gray-400 text-xs uppercase">Outbound Calls</p>
          <div className="relative flex w-full h-2 mt-2">
            <div
              className="flex-1 bg-green-500 flex items-center justify-center group relative"
              onClick={() => setShowOutboundTooltip((prev) => !prev)}
              onMouseEnter={() => setShowOutboundTooltip(true)}
              onMouseLeave={() => setShowOutboundTooltip(false)}
            >
              <span className="text-xs text-white">{outboundPercentage}%</span>
              {showOutboundTooltip && (
                <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Answered Calls {outboundPercentage}%
                </div>
              )}
            </div>
            <div
              className="flex-[0.25] bg-red-500 flex items-center justify-center group relative"
              onClick={() => setShowOutboundTooltip((prev) => !prev)}
              onMouseEnter={() => setShowOutboundTooltip(true)}
              onMouseLeave={() => setShowOutboundTooltip(false)}
            >
              <span className="text-xs text-white">{100 - outboundPercentage}%</span>
              {showOutboundTooltip && (
                <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Unanswered Calls {100 - outboundPercentage}%
                </div>
              )}
            </div>
          </div>
          <div className="text-gray-400 text-xs mt-1">Unanswered {outboundUnanswered.length}</div>
        </div>

        <div className="flex flex-col items-center px-1 pt-2 bg-slate-800">
          <div className="flex items-center gap-2">
            <BsFillTelephoneInboundFill className="w-6 h-6 text-green-400" />
            <p className="text-2xl tracking-wide">{inboundCalls.length}</p>
          </div>
          <p className="text-gray-400 text-xs uppercase">Inbound Calls</p>
          <div className="relative flex w-full h-2 mt-2">
            <div
              className="flex-1 bg-green-500 flex items-center justify-center group relative"
              onClick={() => setShowAnsweredTooltip((prev) => !prev)}
              onMouseEnter={() => setShowAnsweredTooltip(true)}
              onMouseLeave={() => setShowAnsweredTooltip(false)}
            >
              <span className="text-xs text-white">{inboundPercentage}%</span>
              {showAnsweredTooltip && (
                <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Answered Calls {inboundPercentage}%
                </div>
              )}
            </div>
            <div
              className="flex-[0.33] bg-red-500 flex items-center justify-center group relative"
              onClick={() => setShowInboundTooltip((prev) => !prev)}
              onMouseEnter={() => setShowInboundTooltip(true)}
              onMouseLeave={() => setShowInboundTooltip(false)}
            >
              <span className="text-xs text-white">{100 - inboundPercentage}%</span>
              {showInboundTooltip && (
                <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Unanswered Calls {100 - inboundPercentage}%
                </div>
              )}
            </div>
          </div>
          <div className="text-gray-400 text-xs mt-1">Outbound {outboundCalls.length}</div>
        </div>
        
        <div className="flex flex-col items-center px-1 pt-2 bg-slate-800">
          <div className="flex items-center gap-2">
            <MdPhoneCallback className="w-8 h-8 text-blue-400" />
            <p className="text-2xl tracking-wide">03:39</p>
          </div>
          <p className="text-gray-400 text-xs uppercase">Average Talking Time</p>
          <div className="text-gray-400 text-xs mt-1">Total Talking Time 51:10</div>
        </div>
      </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800">
          <h2 className="text-lg text-sky-400 mb-4 p-1 border-b border-slate-700">Answered <span className="text-xs text-sky-300">(By Customer)</span> </h2>
          <div className="p-4">
          <div className="grid grid-cols-3 gap-6 mb-6 ">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <TbPhoneDone className="w-6 h-6"/>
                <p className="text-3xl font-bold">{totalAnswered}</p>
              </div>
              <p className="text-xs text-gray-400 uppercase">Total Answered</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <LuPhoneCall className="w-6 h-6"/>
                <p className="text-3xl font-bold">03:29</p>
              </div>
              <p className="text-xs text-gray-400 uppercase">Average Talking Time</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <LuPhoneCall className="w-6 h-6"/>
                <p className="text-3xl font-bold">0%</p>
              </div>
              <p className="text-xs text-gray-400 uppercase">Transferred</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-2">
                  <TbPhoneDone className="w-6 h-6"/>
                  <p className="text-3xl font-bold">{outboundAnswered.length}</p>
                </div>
                  <p className="text-xs text-gray-400 uppercase">Outbound Answered</p>
              </div>
                
              <div className="flex gap-2 h-20">
                <div className="flex flex-col items-center">
                  <div className="bg-green-500 w-8" style={{ height: "60px" }}></div>
                  <span className="text-xs text-gray-400 mt-1">56</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-green-500 w-8" style={{ height: "40px" }}></div>
                  <span className="text-xs text-gray-400 mt-1">34</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-green-500 w-8" style={{ height: "20px" }}></div>
                  <span className="text-xs text-gray-400 mt-1">18</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-green-500 w-8" style={{ height: "10px" }}></div>
                  <span className="text-xs text-gray-400 mt-1">7</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>&lt; 10 sec.</span>
                <span>10-20 sec.</span>
                <span>21-30 sec.</span>
                <span>31-60 sec.</span>
                <span>&gt; 60 sec.</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">0</div>
              <div className="text-xs text-gray-400 uppercase mb-4">Callbacks</div>
              <CircularProgress percentage={totalAnswered > 0 ? Math.round((totalAnswered / calls.length) * 100) : 0} color="#10b981" />
              <div className="mt-2 text-xs text-green-400">Answered Calls: {totalAnswered > 0 ? Math.round((totalAnswered / calls.length) * 100) : 0}%</div>
            </div>
          </div>
          </div>
        </div>

        <div className="bg-gray-800">
          <h2 className="text-lg p-1 text-sky-400 border-b border-slate-700 mb-4">Unanswered <span className="text-xs text-sky-300">(By Customer)</span> </h2>
          <div className="p-4">
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalUnanswered}</div>
              <div className="text-xs text-gray-400 uppercase">Total Unanswered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">00:32</div>
              <div className="text-xs text-gray-400 uppercase">Average Ringing Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">5</div>
              <div className="text-xs text-gray-400 uppercase">Ringing 0-5 (SEC)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">32</div>
              <div className="text-xs text-gray-400 uppercase">Caller Dropped (IN IVR)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">0</div>
              <div className="text-xs text-gray-400 uppercase">Reached VM</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-gray-400 uppercase mb-2">Limited By License</div>
              <div className="flex gap-2 h-20">
                <div className="flex flex-col items-center">
                  <div className="bg-red-500 w-8" style={{ height: "30px" }}></div>
                  <span className="text-xs text-gray-400 mt-1">8</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-red-500 w-8" style={{ height: "25px" }}></div>
                  <span className="text-xs text-gray-400 mt-1">5</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-red-500 w-8" style={{ height: "40px" }}></div>
                  <span className="text-xs text-gray-400 mt-1">10</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-red-500 w-8" style={{ height: "50px" }}></div>
                  <span className="text-xs text-gray-400 mt-1">12</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-red-500 w-8" style={{ height: "25px" }}></div>
                  <span className="text-xs text-gray-400 mt-1">6</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>&lt; 10 sec.</span>
                <span>10-20 sec.</span>
                <span>21-30 sec.</span>
                <span>31-60 sec.</span>
                <span>&gt; 60 sec.</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">01:12</div>
              <div className="text-xs text-gray-400 uppercase mb-4">Max Wait Time</div>
              <CircularProgress percentage={totalUnanswered > 0 ? Math.round((totalUnanswered / calls.length) * 100) : 0} color="#ef4444" />
              <div className="mt-2 text-xs text-rose-500">Unanswered Calls: {totalUnanswered > 0 ? Math.round((totalUnanswered / calls.length) * 100) : 0}%</div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800">
          <h2 className="p-1 border-b border-slate-700 text-sky-400 mb-4">
            Outbound Call Volume Per Hour Of The Day
          </h2>
          <div className="p-4">
          <div className="space-y-2">
            {outboundHeatMap.map((dayData, dayIndex) => (
              <div key={dayIndex} className="flex items-center gap-2">
                <div className="w-20 text-sm text-gray-400">{dayData.day}</div>
                <div className="flex gap-5">
                  {dayData.hours.map((hourData, hourIndex) => (
                    <HeatMapCell key={hourIndex} value={hourData.value} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-4 ml-22">
            <span>6:00 AM</span>
            <span>7:00 AM</span>
            <span>8:00 AM</span>
            <span>9:00 AM</span>
            <span>10:00 AM</span>
            <span>11:00 AM</span>
            <span>12:00 PM</span>
            <span>1:00 PM</span>
            <span>2:00 PM</span>
            <span>3:00 PM</span>
            <span>4:00 PM</span>
            <span>5:00 PM</span>
            <span>6:00 PM</span>
            <span>7:00 PM</span>
            <span>8:00 PM</span>
          </div>
        </div>
        </div>

        <div className="bg-gray-800">
          <h2 className="p-1 text-sky-400 border-b border-slate-700 mb-4">
            Inbound Call Volume Per Hour Of The Day
          </h2>
          <div className="p-4">
          <div className="space-y-2">
            {inboundHeatMap.map((dayData, dayIndex) => (
              <div key={dayIndex} className="flex items-center gap-2">
                <div className="w-20 text-sm text-gray-400">{dayData.day}</div>
                <div className="flex gap-5">
                  {dayData.hours.map((hourData, hourIndex) => (
                    <HeatMapCell key={hourIndex} value={hourData.value} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-4 ml-22">
            <span>6:00 AM</span>
            <span>7:00 AM</span>
            <span>8:00 AM</span>
            <span>9:00 AM</span>
            <span>10:00 AM</span>
            <span>11:00 AM</span>
            <span>12:00 PM</span>
            <span>1:00 PM</span>
            <span>2:00 PM</span>
            <span>3:00 PM</span>
            <span>4:00 PM</span>
            <span>5:00 PM</span>
            <span>6:00 PM</span>
            <span>7:00 PM</span>
            <span>8:00 PM</span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;