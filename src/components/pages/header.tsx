import React, { useState } from "react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleForward = () => {
    router.forward();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    await logout();
    setShowUserDropdown(false);
  };

  return (
    <header className="border-b border-slate-700 px-3 md:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Logo/Title */}
          <div className="flex items-center gap-2">
            <div>
              <div className="text-sm font-medium text-blue-400">
                <span className="hidden md:inline">NEWARK CALL CENTER</span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white p-1 md:p-2"
              onClick={handleBack}
              title="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white p-1 md:p-2"
              onClick={handleForward}
              title="Go forward"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white p-1 md:p-2"
              onClick={handleRefresh}
              title="Refresh page"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Status Info - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-xs text-slate-400">
              <span className="text-green-400">⚡ DATA UPDATE IN</span> 44:18
            </div>
            <div className="text-xs text-slate-400">
              <span className="text-blue-400">🕒 LAST UPDATE</span> 5:15:21 am
            </div>
            <div className="text-xs text-slate-400">(EVERY 60 MINUTES)</div>
          </div>

          {/* Status Icons - Condensed on mobile */}
          <div className="hidden md:flex items-center gap-1">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">?</div>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">✓</div>
            <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs">i</div>
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white p-1 md:p-2"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <User className="w-4 h-4" />
            </Button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-slate-300 border-b border-slate-600">
                    {user?.name || 'User'}
                    <div className="text-xs text-slate-400">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}