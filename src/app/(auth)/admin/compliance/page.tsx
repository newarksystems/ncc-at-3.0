"use client"

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboardlayout';
import { LiveCallsTable } from '@/components/livecalls';
import CallsRatePerHour from '@/components/callratesperhour';
import { AgentPerformanceDash } from '@/components/agents/agentperformancedash';
import { useDashboardContext } from '@/context/dashboardContext';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { FaUsers, FaHandshake } from 'react-icons/fa';
import { TfiHeadphoneAlt } from 'react-icons/tfi';
import { BsFillPhoneVibrateFill, BsTelephoneForwardFill } from 'react-icons/bs';
import { ImPhoneHangUp } from 'react-icons/im';
import { MdPhoneCallback, MdOutlineSupportAgent, MdPhoneMissed } from 'react-icons/md';
import { TbPhoneCheck, TbRefreshAlert, TbRefreshDot } from 'react-icons/tb';
import { HiPhoneArrowUpRight } from 'react-icons/hi2';
import { BiSolidPhoneCall } from 'react-icons/bi';
import { GiReceiveMoney } from 'react-icons/gi';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

const ComplianceAdminDashboard: React.FC = () => {
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if user is not authenticated or not a compliance admin
    if (!authLoading && isAuthenticated) {
      if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'super-admin') || 
          (authUser.role === 'admin' && authUser.designation !== 'compliance-admin')) {
        if (authUser?.role === 'admin' && authUser.designation) {
          switch(authUser.designation) {
            case 'call-center-admin':
              router.push('/admin/callcenter');
              break;
            case 'marketing-admin':
              router.push('/admin/marketing');
              break;
            default:
              router.push('/admin/callcenter');
          }
        } else if (authUser?.role === 'super-admin') {
          router.push('/admin/superadmin');
        } else {
          router.push('/dashboard');
        }
      }
    } else if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [authUser, isAuthenticated, authLoading, router]);

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  // Show not authorized if user is authenticated but not a compliance admin
  if (isAuthenticated && 
      (!authUser || (authUser.role !== 'admin' && authUser.role !== 'super-admin') || 
       (authUser.role === 'admin' && authUser.designation !== 'compliance-admin'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="text-white">Access denied. Compliance admin privileges required.</div>
      </div>
    );
  }

  // Show not authenticated if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="text-white">Redirecting to sign in...</div>
      </div>
    );
  }

  const { dashboardData } = useDashboardContext();
  const { stats, liveCalls, callStats, agents, loading, error, refresh } = dashboardData;
  const [showAnsweredTooltip, setShowAnsweredTooltip] = useState(false);
  const [showUnansweredTooltip, setShowUnansweredTooltip] = useState(false);
  const [showPassedSlaTooltip, setShowPassedSlaTooltip] = useState(false);
  const [showFailedSlaTooltip, setShowFailedSlaTooltip] = useState(false);

  if (loading) {
    return (
      <DashboardLayout title="Compliance Dashboard">
        <div className="min-h-screen text-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Compliance Dashboard">
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

  if (!stats) {
    return (
      <DashboardLayout title="Compliance Dashboard">
        <div className="min-h-screen text-white flex items-center justify-center">
          <p>No dashboard data available</p>
        </div>
      </DashboardLayout>
    );
  }

  const answeredPercentage = stats.total_dialed_calls > 0 
    ? Math.round((stats.connected_calls / stats.total_dialed_calls) * 100) 
    : 0;
  const unansweredPercentage = 100 - answeredPercentage;
  const passedSlaPercentage = stats.passed_sla;
  const failedSlaPercentage = stats.failed_sla;

  return (
    <DashboardLayout title="Compliance Dashboard">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 min-h-[140px] items-stretch">
          <div className="w-full md:w-1/4 bg-slate-800 border-slate-700 p-3 flex flex-col">
            <span className="text-sm text-green-400">Live data</span>
            <div className="flex flex-col md:flex-row justify-center bg-slate-900 gap-0.5 min-h-[115px] border border-green-300">
              <div className="relative flex items-center justify-center bg-slate-800 w-full">
                <span className="text-sm text-slate-300 sm:absolute top-1 left-1/2 transform -translate-x-1/2 md:self-start">CALLS</span>
                <div className="flex items-center justify-center md:mt-3 gap-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <TfiHeadphoneAlt className="w-6 h-6" />
                      <span className="text-2xl lg:text-3xl font-bold text-green-400">{stats.active_calls}</span>
                    </div>
                    <span className="text-slate-400">TALKING</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <BsFillPhoneVibrateFill className="w-6 h-6" />
                      <span className="text-2xl lg:text-3xl font-bold text-blue-400">{stats.calling_agents}</span>
                    </div>
                    <span className="text-slate-400">CALLING</span>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-center bg-slate-800 gap-4 w-full">
                <span className="text-sm text-slate-300 sm:absolute top-1 left-1/2 transform -translate-x-0.75 md:self-start">AGENTS</span>
                <div className="flex items-center md:mt-3 gap-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <FaUsers className="w-6 h-6" />
                      <span className="text-2xl lg:text-3xl font-bold text-green-400">{stats.total_agents}</span>
                    </div>
                    <span className="text-slate-400">ALL</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <ImPhoneHangUp className="w-6 h-6" />
                      <span className="text-2xl lg:text-3xl font-bold text-slate-400">{stats.available_agents}</span>
                    </div>
                    <span className="text-slate-400">AVAILABLE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-3/4 bg-slate-800 border-slate-900 p-3 flex flex-col">
            <span className="text-sm text-cyan-500">Since last database update</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 bg-slate-900 gap-0.5 text-center border border-cyan-400">
              <div className="flex flex-col items-center px-1 pt-2 bg-slate-800 px-2">
                <div className="flex items-center gap-2">
                  <MdPhoneCallback className="w-8 h-8 text-blue-400" />
                  <p className="text-4xl tracking-wide">{stats.total_dialed_calls}</p>
                </div>
                <p className="text-slate-400">TOTAL DIALED CALLS</p>
                <div className="relative flex w-full h-4 mt-2 md:top-4">
                  <div 
                    className="flex-1 bg-green-500 flex items-center justify-center group relative"
                    onClick={() => setShowAnsweredTooltip((prev) => !prev)}
                    onMouseEnter={() => setShowAnsweredTooltip(true)}
                    onMouseLeave={() => setShowAnsweredTooltip(false)}
                  >
                    <span className="text-xs text-white">{answeredPercentage}%</span>
                    {showAnsweredTooltip && (
                      <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Connected Calls {answeredPercentage}%
                      </div>
                    )}
                  </div>
                  <div 
                    className="flex-[0.33] bg-red-400 flex items-center justify-center group relative"
                    onClick={() => setShowUnansweredTooltip((prev) => !prev)}
                    onMouseEnter={() => setShowUnansweredTooltip(true)}
                    onMouseLeave={() => setShowUnansweredTooltip(false)}
                  >
                    <span className="text-xs text-white">{unansweredPercentage}%</span>
                    {showUnansweredTooltip && (
                      <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Disconnected Calls {unansweredPercentage}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 bg-slate-800 py-1">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-end">
                    <TbPhoneCheck className="text-green-400" />
                    <p className="text-xl">{stats.connected_calls}</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">CONNECTED</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <HiPhoneArrowUpRight className="text-red-400" />
                    <p className="text-xl">{stats.follow_up_calls}</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">TO FOLLOW-UP</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-end">
                    <MdPhoneMissed className="text-red-400" />
                    <p className="text-xl">{stats.disconnected_calls}</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">DISCONNECTED</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <TbRefreshAlert className="text-[#b9a000ec]" />
                    <p className="text-xl">{stats.callbacks}</p>
                  </div>
                  <p className="text-[11px] tracking-wider">CALLBACKS</p>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center bg-slate-800 px-1">
                <div className="flex justify-center items-center gap-2">
                  <FaHandshake className="w-8 h-8 text-blue-300" />
                  <p className="text-3xl">{stats.service_level}%</p>
                </div>
                <p className="text-[17px] text-slate-400">SERVICE LEVEL</p>
                <div className="relative flex w-full h-4 mt-2 md:top-3">
                  <div 
                    className="flex-1 bg-green-500 flex items-center justify-center group relative"
                    onClick={() => setShowPassedSlaTooltip((prev) => !prev)}
                    onMouseEnter={() => setShowPassedSlaTooltip(true)}
                    onMouseLeave={() => setShowPassedSlaTooltip(false)}
                  >
                    <span className="text-xs text-white">{passedSlaPercentage}%</span>
                    {showPassedSlaTooltip && (
                      <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Passed SLA {passedSlaPercentage}%
                      </div>
                    )}
                  </div>
                  <div 
                    className="flex-[0.30] bg-red-400 flex items-center justify-center group relative"
                    onClick={() => setShowFailedSlaTooltip((prev) => !prev)}
                    onMouseEnter={() => setShowFailedSlaTooltip(true)}
                    onMouseLeave={() => setShowFailedSlaTooltip(false)}
                  >
                    <span className="text-xs text-white">{failedSlaPercentage}%</span>
                    {showFailedSlaTooltip && (
                      <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Failed SLA {failedSlaPercentage}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 bg-slate-800 py-1">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-end">
                    <MdOutlineSupportAgent className="w-6 h-6 text-green-400" />
                    <p className="text-xl">{stats.fcr}%</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">FCR</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-end">
                    <MdOutlineSupportAgent className="w-6 h-6 text-green-400" />
                    <p className="text-xl">{stats.far}%</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">FAR</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-end">
                    <BsTelephoneForwardFill className="w-6 h-4 text-yellow-400" />
                    <p className="text-xl">{stats.right_party_contact_rate}%</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">RIGHT PARTY CONTACT RATE</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-end">
                    <TbRefreshDot className="w-6 h-4 text-yellow-400" />
                    <p className="text-xl">{stats.ptp_fulfillment}%</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">PTP FULFILLMENT</p>
                </div>
              </div>
              <div className="grid grid-cols-2 bg-slate-800 py-1">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-end">
                    <MdOutlineSupportAgent className="w-6 h-6 text-indigo-400" />
                    <p className="text-xl">{stats.average_talk_time}</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">AVERAGE TALK TIME</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-end">
                    <BiSolidPhoneCall className="w-6 h-5 text-yellow-400" />
                    <p className="text-xl">{stats.longest_talk_time}</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">LONGEST TALK TIME</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-end">
                    <MdOutlineSupportAgent className="w-6 h-6 text-indigo-400" />
                    <p className="text-xl">{stats.avg_call_attempt_duration}</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">AVG CALL ATTEMPT DURATION</p>
                </div>
                <div className="flex flex-col items-center mt-2">
                  <div className="flex items-center gap-1 justify-end">
                    <GiReceiveMoney className="w-6 h-6 text-yellow-400" />
                    <p className="text-xl">{stats.total_collected.toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] text-slate-300 tracking-wider">TOTAL COLLECTED</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6">
          <LiveCallsTable />
          <CallsRatePerHour />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 px-6 gap-6">
          <AgentPerformanceDash />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ComplianceAdminDashboard;