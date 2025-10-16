"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  Menu,
  Users,
  Phone,
  ChevronRight,
  ChevronDown,
  PanelLeft,
  Home,
  User,
  X,
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useUserStore } from "@/stores/userStore";
import { Header } from "@/components/pages/header";

export default function Sidebar() {
  const {
    isOpen,
    openDropdown,
    openNestedDropdown,
    hoveredMenu,
    toggleSidebar,
    setOpenDropdown,
    setOpenNestedDropdown,
    setHoveredMenu,
    resetHoveredMenu,
  } = useSidebarStore();
  
  const { user } = useUserStore();

  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if mobile view and update state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        isMobileSidebarOpen
      ) {
        setIsMobileSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileSidebarOpen]);

  const handleDropdown = (menu: string) => {
    if (isMobile || isOpen) {
      setOpenDropdown(openDropdown === menu ? null : menu);
      setOpenNestedDropdown(null);
    } else {
      setHoveredMenu(menu);
    }
  };

  // Determine the appropriate dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user) return '/signin';
    
    switch(user.role) {
      case 'super-admin':
        return '/admin/super-admin';
      case 'admin':
        if (user.designation === 'call-center-admin') {
          return '/admin/callcenter';
        } else if (user.designation === 'marketing-admin') {
          return '/admin/marketing';
        } else if (user.designation === 'compliance-admin') {
          return '/admin/compliance';
        }
        return '/admin/callcenter';
      case 'agent':
        return '/agentdash';
      case 'viewer':
        return '/viewer';
      default:
        return '/admin/callcenter';
    }
  };

  return (
    <>
      {/* Mobile top bar with hamburger, NCC, and Header content */}
      {isMobile && (
        <div className="fixed top-0 left-0 h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between z-50 w-full px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-2 rounded-md hover:bg-slate-800"
              title={isMobileSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <span className="text-white">{isMobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}</span>
            </button>
            <span className="text-sm font-medium text-blue-400">NCC</span>
          </div>
          <div className="flex items-center">
            <Header />
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Panel */}
      {isMobile && (
        <div
          ref={sidebarRef}
          className={`fixed top-14 h-[calc(100vh-3.5rem)] z-50 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-700 w-64 transition-transform duration-300 ease-in-out ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-64'
          }`}
        >
          <div className="flex-1 overflow-y-auto">
            <ul className="space-y-1 p-2">
              <li className="relative">
                <Link 
                  href={getDashboardRoute()}
                  className="flex items-center w-full p-2 rounded-md hover:bg-slate-800"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <Home size={20} />
                  <span className="ml-3">Home</span>
                </Link>
              </li>
              <li className="relative">
                <button
                  className="flex items-center w-full p-2 rounded-md hover:bg-slate-800"
                  onClick={() => handleDropdown("agents")}
                >
                  <Users size={20} />
                  <span className="ml-3">Agents</span>
                  {openDropdown === "agents" ? (
                    <ChevronDown className="ml-auto" size={16} />
                  ) : (
                    <ChevronRight className="ml-auto" size={16} />
                  )}
                </button>
                {openDropdown === "agents" && (
                  <ul className="ml-2 mt-1 space-y-1 text-sm">
                    <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                      <Link
                        href={'/live-actions/activity/agents'}
                        onClick={() => setIsMobileSidebarOpen(false)}
                      >
                        Live Actions
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => setOpenNestedDropdown(
                          openNestedDropdown === "agentDetails" ? null : "agentDetails"
                        )}
                        className="flex items-center w-full p-2 rounded hover:bg-slate-800"
                      >
                        Agent Details
                        {openNestedDropdown === "agentDetails" ? (
                          <ChevronDown className="ml-auto" size={14} />
                        ) : (
                          <ChevronRight className="ml-auto" size={14} />
                        )}
                      </button>
                      {openNestedDropdown === "agentDetails" && (
                        <ul className="ml-6 mt-1 space-y-1 text-xs">
                          <Link
                            href={'/agent-details/calls'}
                            onClick={() => setIsMobileSidebarOpen(false)}
                          >
                            <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                              Call Details
                            </li>
                          </Link>
                          <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                            Login History
                          </li>
                        </ul>
                      )}
                    </li>
                    <Link 
                      href={'/agent-performance'}
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                        Agent Performance
                      </li>
                    </Link>
                  </ul>
                )}
              </li>
              <li className="relative">
                <button
                  className="flex items-center w-full p-2 rounded-md hover:bg-slate-800"
                  onClick={() => handleDropdown("calls")}
                >
                  <Phone size={20} />
                  <span className="ml-3">Calls</span>
                  {openDropdown === "calls" ? (
                    <ChevronDown className="ml-auto" size={16} />
                  ) : (
                    <ChevronRight className="ml-auto" size={16} />
                  )}
                </button>
                {openDropdown === "calls" && (
                  <ul className="ml-2 mt-1 space-y-1 text-sm">
                    <Link
                      href={"/live-actions/activity/calls"}
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                        Live Calls
                      </li>
                    </Link>
                    <Link
                      href={"/call-details/call-logs/"}
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                        Call Logs
                      </li>
                    </Link>
                    <Link
                      href={"/call-details/call-stats"}
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                        Call Statistics
                      </li>
                    </Link>
                  </ul>
                )}
              </li>
              <li className="relative">
                <Link
                  href={"/user-management"}
                  className="flex items-center w-full p-2 rounded-md hover:bg-slate-800"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <User size={20} />
                  <span className="ml-3">User Management</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          ref={sidebarRef}
          className={`min-h-screen bg-slate-900 text-slate-200 flex flex-col border-r border-slate-700 transition-all duration-300 ${
            isOpen ? "w-64" : "w-16"
          }`}
        >
          <div className="flex items-center justify-between p-2 border-b border-slate-700">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-slate-800"
              title={isOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Menu size={22} />
            </button>
            {isOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-slate-800"
                title="Close sidebar"
              >
                <PanelLeft size={18} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="space-y-1 p-2">
              <li className="relative">
                <Link 
                  href={getDashboardRoute()}
                  className="flex items-center w-full p-2 rounded-md hover:bg-slate-800"
                >
                  <Home size={20} />
                  {isOpen && <span className="ml-3">Home</span>}
                </Link>
              </li>
              <li className="relative">
                <button
                  className="flex items-center w-full p-2 rounded-md hover:bg-slate-800"
                  onClick={() => handleDropdown("agents")}
                  onMouseEnter={() => !isOpen && setHoveredMenu("agents")}
                >
                  <Users size={20} />
                  {isOpen && <span className="ml-3">Agents</span>}
                  {isOpen && (openDropdown === "agents" ? (
                    <ChevronDown className="ml-auto" size={16} />
                  ) : (
                    <ChevronRight className="ml-auto" size={16} />
                  ))}
                </button>
                {isOpen && openDropdown === "agents" && (
                  <ul className="ml-10 mt-1 space-y-1 text-sm">
                    <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                      <Link href={'/live-actions/activity/agents'}>
                        Live Actions
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => setOpenNestedDropdown(
                          openNestedDropdown === "agentDetails" ? null : "agentDetails"
                        )}
                        className="flex items-center w-full p-2 rounded hover:bg-slate-800"
                      >
                        Agent Details
                        {openNestedDropdown === "agentDetails" ? (
                          <ChevronDown className="ml-auto" size={14} />
                        ) : (
                          <ChevronRight className="ml-auto" size={14} />
                        )}
                      </button>
                      {openNestedDropdown === "agentDetails" && (
                        <ul className="ml-6 mt-1 space-y-1 text-xs">
                          <Link href={'/agent-details/calls'}>
                            <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                              Call Details
                            </li>
                          </Link>
                          <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                            Login History
                          </li>
                        </ul>
                      )}
                    </li>
                    <Link href={'/agent-performance'}>
                      <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                        Agent Performance
                      </li>
                    </Link>
                  </ul>
                )}
                {!isOpen && hoveredMenu === "agents" && (
                  <div
                    onMouseEnter={() => setHoveredMenu("agents")}
                    onMouseLeave={resetHoveredMenu}
                    className="fixed top-20 left-16 w-52 bg-slate-900 border border-slate-700 shadow-lg py-2 z-50"
                  >
                    <ul className="space-y-1 text-sm">
                      <Link href={'/live-actions/activity/agents'}>
                        <li className="hover:bg-slate-700 px-3 py-2 cursor-pointer">
                          Live Actions
                        </li>
                      </Link>
                      <li>
                        <button
                          onClick={() => setOpenNestedDropdown(
                            openNestedDropdown === "agentDetails" ? null : "agentDetails"
                          )}
                          className="flex items-center w-full px-3 py-2 hover:bg-slate-700"
                        >
                          Agent Details
                          {openNestedDropdown === "agentDetails" ? (
                            <ChevronDown className="ml-auto" size={14} />
                          ) : (
                            <ChevronRight className="ml-auto" size={14} />
                          )}
                        </button>
                        {openNestedDropdown === "agentDetails" && (
                          <ul className="ml-4 mt-1 space-y-1 text-xs">
                            <Link href={'/agent-details/calls'}>
                              <li className="hover:bg-slate-700 px-3 py-2 cursor-pointer">
                                Call Details
                              </li>
                            </Link>
                            <li className="hover:bg-slate-700 px-3 py-2 cursor-pointer">
                              Login History
                            </li>
                          </ul>
                        )}
                      </li>
                      <Link href={'/agent-performance'}>
                        <li className="hover:bg-slate-700 px-3 py-2 cursor-pointer">
                          Agent Performance
                        </li>
                      </Link>
                    </ul>
                  </div>
                )}
              </li>
              <li className="relative">
                <button
                  className="flex items-center w-full p-2 rounded-md hover:bg-slate-800"
                  onClick={() => handleDropdown("calls")}
                  onMouseEnter={() => !isOpen && setHoveredMenu("calls")}
                >
                  <Phone size={20} />
                  {isOpen && <span className="ml-3">Calls</span>}
                  {isOpen && (openDropdown === "calls" ? (
                    <ChevronDown className="ml-auto" size={16} />
                  ) : (
                    <ChevronRight className="ml-auto" size={16} />
                  ))}
                </button>
                {isOpen && openDropdown === "calls" && (
                  <ul className="ml-10 mt-1 space-y-1 text-sm">
                    <Link href={"/live-actions/activity/calls"}>
                      <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                        Live Calls
                      </li>
                    </Link>
                    <Link href={"/call-details/call-logs/"}>
                      <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                        Call Logs
                      </li>
                    </Link>
                    <Link href={"/call-details/call-stats"}>
                      <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                        Call Statistics
                      </li>
                    </Link>
                  </ul>
                )}
                {!isOpen && hoveredMenu === "calls" && (
                  <div
                    onMouseEnter={() => setHoveredMenu("calls")}
                    onMouseLeave={resetHoveredMenu}
                    className="fixed top-20 left-16 w-52 bg-slate-900 border border-slate-700 shadow-lg py-2 z-50"
                  >
                    <ul className="space-y-1 text-sm">
                      <Link href={"/live-actions/activity/calls"}>
                        <li className="hover:bg-slate-700 px-3 py-2 cursor-pointer">
                          Live Calls
                        </li>
                      </Link>
                      <Link href={"/call-details/call-logs/"}>
                        <li className="hover:bg-slate-800 rounded p-2 cursor-pointer">
                          Call Logs
                        </li>
                      </Link>
                      <Link href={"/call-details/call-stats"}>
                        <li className="hover:bg-slate-700 px-3 py-2 cursor-pointer">
                          Call Statistics
                        </li>
                      </Link>
                    </ul>
                  </div>
                )}
              </li>
              <li className="relative">
                <Link
                  href={"/user-management"}
                  className="flex items-center w-full p-2 rounded-md hover:bg-slate-800"
                >
                  <User size={20} />
                  {isOpen && <span className="ml-3">User Management</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}