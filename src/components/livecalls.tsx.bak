"use client";

import React, { useState } from "react";
import { RefreshCcw, Minimize2, X } from "lucide-react";

export function LiveCallsTable() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={`${
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-900"
          : "bg-slate-800"
      }`}
    >
      {/* Header */}
      <div className="p-2 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm text-sky-400">Live/Active Calls</h3>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-slate-200">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-slate-400 hover:text-slate-200"
          >
            {isFullscreen ? (
              <X className="w-4 h-4" /> // close fullscreen
            ) : (
              <Minimize2 className="w-4 h-4" /> // open fullscreen
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto p-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            {/* Parent Header Row */}
            <tr className="bg-slate-800 text-sky-300 text-center">
              <th
                className="bg-slate-700 border border-slate-600 px-4 py-2"
                colSpan={2}
              >
                Time
              </th>
              <th
                className="bg-slate-900 border border-slate-600 px-4 py-2"
                colSpan={4}
              ></th>
              <th
                className="bg-slate-700 border border-slate-600 px-4 py-2"
                colSpan={3}
              >
                Call Info
              </th>
            </tr>

            {/* Child Header Row */}
            <tr className="text-slate-200 text-left">
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">
                Talk Time
              </th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">
                Hold Time
              </th>
              <th className="border border-slate-600 bg-slate-900 px-4 py-2">
                Agent
              </th>
              <th className="border border-slate-600 bg-slate-900 px-4 py-2">
                Agent No
              </th>
              <th className="border border-slate-600 bg-slate-900 px-4 py-2">
                Customer Name
              </th>
              <th className="border border-slate-600 bg-slate-900 px-4 py-2">
                Customer No
              </th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">
                Direction
              </th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">
                Status
              </th>
              <th className="border border-slate-600 bg-slate-700 px-4 py-2">
                Queue
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Example row */}
            <tr className="bg-slate-800 text-slate-100">
              <td className="border border-slate-600 px-4 py-2">00:21</td>
              <td className="border border-slate-600 px-4 py-2">00:06</td>
              <td className="border border-slate-600 px-4 py-2">Alex</td>
              <td className="border border-slate-600 px-4 py-2">0700300000</td>
              <td className="border border-slate-600 px-4 py-2">Borris</td>
              <td className="border border-slate-600 px-4 py-2">071245780</td>
              <td className="border border-slate-600 px-4 py-2">Inbound</td>
              <td className="border border-slate-600 text-red-500 px-4 py-2">
                On Hold
              </td>
              <td className="border border-slate-600 px-4 py-2">Recovery</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
