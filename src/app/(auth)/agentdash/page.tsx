"use client"

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboardlayout';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { MdPhoneCallback, MdPhoneMissed } from 'react-icons/md';
import { FaUsers, FaUser } from 'react-icons/fa';
import { TbPhoneCheck } from 'react-icons/tb';
import { GiReceiveMoney } from 'react-icons/gi';
import { BiTime } from 'react-icons/bi';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { useAgentStats } from '@/hooks/useAgentStats';
import { useCall } from '@/context/callContext';
import useCallStore from '@/stores/callStore';

const AgentDashboard: React.FC = () => {
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { stats, loading, error, refresh } = useAgentStats(authUser?.id || '');
  const { isConnected, callStatus } = useCall();
  const { callStats: storeCallStats, currentCallState } = useCallStore();
  const [showAnsweredTooltip, setShowAnsweredTooltip] = useState(false);
  const [showUnansweredTooltip, setShowUnansweredTooltip] = useState(false);

  // Use store stats if available, otherwise fall back to API stats
  const totalCalls = storeCallStats.totalCalls || stats?.total_calls || 0;
  const answeredCalls = storeCallStats.answeredCalls || stats?.answered_calls || 0;
  const unansweredCalls = storeCallStats.unansweredCalls || (stats ? stats.total_calls - stats.answered_calls : 0);
  const answeredPercentage = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;
  const unansweredPercentage = totalCalls > 0 ? Math.round((unansweredCalls / totalCalls) * 100) : 0;

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (!authUser || authUser.role !== 'agent') {
        router.push('/dashboard');
      }
    } else if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [authUser, isAuthenticated, authLoading, router]);

  if (authLoading || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  if (isAuthenticated && authUser.role !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="text-white">Access denied. Agent privileges required.</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="text-white">Redirecting to sign in...</div>
      </div>
    );
  }

  if (loading && !storeCallStats.totalCalls) { // Only show loading if we don't have store data
    return (
      <DashboardLayout title="Agent Dashboard">
        <div className="min-h-screen text-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !storeCallStats.totalCalls) { // Only show error if we don't have store data
    return (
      <DashboardLayout title="Agent Dashboard">
        <div className="min-h-screen text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading dashboard data: {error}</p>
            <Button onClick={refresh} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agent Dashboard">
      <div className="p-6 space-y-6">
        {/* Call Status */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  callStatus === 'connected' ? 'bg-green-500' : 
                  callStatus === 'calling' ? 'bg-yellow-500' : 
                  'bg-gray-500'
                }`}></div>
                <span className="text-sm">
                  Call Status: 
                  <span className={`ml-1 ${
                    callStatus === 'connected' ? 'text-green-400' : 
                    callStatus === 'calling' ? 'text-yellow-400' : 
                    'text-gray-400'
                  }`}>
                    {callStatus ? callStatus.charAt(0).toUpperCase() + callStatus.slice(1) : 'Idle'}
                  </span>
                </span>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-sm">
                  Service: 
                  <span className={`ml-1 ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>
                    {isConnected ? 'Connected' : 'Ready'}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              {currentCallState !== 'idle' && (
                <div className="flex items-center bg-blue-900/50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm">Active Call: {currentCallState}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 min-h-[140px] items-stretch">
          {/* Left Panel - Agent Stats */}
          <div className="w-full md:w-1/4 bg-slate-800 border-slate-700 p-3 flex flex-col">
            <span className="text-sm text-green-400">Live Data</span>
            <div className="flex flex-col md:flex-row justify-center bg-slate-900 gap-0.5 min-h-[115px] border border-green-300">
              {/* Card 1: TOTAL CALLS (like "Total Dialed Calls") */}
              <div className="relative flex items-center justify-center bg-slate-800 w-full">
                <span className="text-sm text-slate-300 sm:absolute top-1 left-1/2 transform -translate-x-1/2 md:self-start">
                  MY CALLS
                </span>
                <div className="flex flex-col items-center pt-2">
                  <div className="flex items-center gap-2">
                    <MdPhoneCallback className="w-8 h-8 text-blue-400" />
                    <p className="text-4xl tracking-wide">{totalCalls}</p>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">TOTAL CALLS</p>
                </div>
              </div>

              {/* Card 2: ANSWERED & UNANSWERED + Percentage Bar */}
              <div className="relative flex items-center justify-center bg-slate-800 w-full">
                <span className="text-sm text-slate-300 sm:absolute top-1 left-1/2 transform -translate-x-1/2 md:self-start">
                  CALL OUTCOME
                </span>
                <div className="flex flex-col items-center pt-2">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <TbPhoneCheck className="text-green-400 w-5 h-5" />
                        <p className="text-xl font-bold text-green-400">{answeredCalls}</p>
                      </div>
                      <p className="text-[11px] text-slate-300 tracking-wider">ANSWERED</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <MdPhoneMissed className="text-red-400 w-5 h-5" />
                        <p className="text-xl font-bold text-red-400">{unansweredCalls}</p>
                      </div>
                      <p className="text-[11px] text-slate-300 tracking-wider">UNANSWERED</p>
                    </div>
                  </div>

                  {/* Percentage bar below the two stats */}
                  <div className="relative flex w-full h-4 mt-2">
                    <div
                      className="flex-1 bg-green-500 flex items-center justify-center group relative"
                      onMouseEnter={() => setShowAnsweredTooltip(true)}
                      onMouseLeave={() => setShowAnsweredTooltip(false)}
                    >
                      <span className="text-xs text-white">{answeredPercentage}%</span>
                      {showAnsweredTooltip && (
                        <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          Answered {answeredPercentage}%
                        </div>
                      )}
                    </div>
                    <div
                      className="flex-[0.33] bg-red-400 flex items-center justify-center group relative"
                      onMouseEnter={() => setShowUnansweredTooltip(true)}
                      onMouseLeave={() => setShowUnansweredTooltip(false)}
                    >
                      <span className="text-xs text-white">{unansweredPercentage}%</span>
                      {showUnansweredTooltip && (
                        <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          Unanswered {unansweredPercentage}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Metrics Grid */}
          <div className="w-full md:w-3/4 bg-slate-800 border-slate-900 p-3 flex flex-col">
            <span className="text-sm text-cyan-500">Since last database update</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 bg-slate-900 gap-0.5 text-center border border-cyan-400">
              <div className="flex flex-col items-center px-1 pt-2 bg-slate-800">
                <div className="flex items-center gap-2">
                  <FaUsers className="w-6 h-6 text-purple-400" />
                  <p className="text-3xl tracking-wide">0</p>
                </div>
                <p className="text-slate-400 text-xs">PTP CUSTOMERS</p>
              </div>
              <div className="flex flex-col items-center px-1 pt-2 bg-slate-800">
                <div className="flex items-center gap-2">
                  <GiReceiveMoney className="w-6 h-6 text-yellow-400" />
                  <p className="text-3xl tracking-wide">0K</p>
                </div>
                <p className="text-slate-400 text-xs">PTP AMOUNT</p>
              </div>
              <div className="flex flex-col items-center px-1 pt-2 bg-slate-800">
                <div className="flex items-center gap-2">
                  <GiReceiveMoney className="w-6 h-6 text-green-400" />
                  <p className="text-3xl tracking-wide">0K</p>
                </div>
                <p className="text-slate-400 text-xs">COLLECTED</p>
              </div>
              <div className="flex flex-col items-center px-1 pt-2 bg-slate-800">
                <div className="flex items-center gap-2">
                  <BiTime className="w-6 h-6 text-blue-400" />
                  <p className="text-3xl tracking-wide">0:00</p>
                </div>
                <p className="text-slate-400 text-xs">AVG TALK TIME</p>
              </div>
              <div className="flex flex-col items-center px-1 pt-2 bg-slate-800">
                <div className="flex items-center gap-2">
                  <BiTime className="w-6 h-6 text-orange-400" />
                  <p className="text-3xl tracking-wide">0:00</p>
                </div>
                <p className="text-slate-400 text-xs">LONGEST TALK</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;