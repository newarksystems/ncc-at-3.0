import React from "react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

export function AdminHeader() {
    return (
      <header className="border-b border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div> */}
              <div>
                <div className="text-sm font-medium text-blue-400">NEWARK CALL CENTER</div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-8">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400">
              <span className="text-green-400">⚡ DATA UPDATE IN</span> 44:18
            </div>
            <div className="text-xs text-slate-400">
              <span className="text-blue-400">🕒 LAST UPDATE</span> 5:15:21 am
            </div>
            <div className="text-xs text-slate-400">(EVERY 60 MINUTES)</div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">?</div>
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">✓</div>
              <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs">i</div>
              <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">U</div>
            </div>
          </div>
        </div>
      </header>
    )
}