import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play, Users, Settings, MoreHorizontal, Wifi, WifiOff } from 'lucide-react';
import { useDashboardContext } from '@/context/dashboardContext';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import useWebSocket from '@/hooks/useWebSocket';

export const DashboardLayout: React.FC<{
  children: React.ReactNode;
  title: string;
}> = ({ children, title }) => {
  const { dashboardData } = useDashboardContext();
  const { user } = useAuth();
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');

  const handleWsMessage = React.useCallback((data: any) => {
    if (data.type === 'connection') {
      setWsConnected(true);
      setWsError(null);
      // Note: We can't access 'send' here directly due to closure, so subscriptions are handled elsewhere
    } else if (!isPaused && (data.type === 'call_update' || data.type === 'agent_update' || data.type === 'dashboard_update')) {
      // Process live data updates when not paused
      console.log("Live data received:", data);
      dashboardData.refresh();
    }
  }, [isPaused, dashboardData]);

  const handleWsError = React.useCallback((error: Event) => {
    console.error("WebSocket error:", error);
    setWsError("Connection lost");
    setWsConnected(false);
  }, []);

  const handleWsOpen = React.useCallback(() => {
    console.log("Dashboard WebSocket opened");
    // Connection confirmation will come via onMessage
  }, []);

  const handleWsClose = React.useCallback(() => {
    console.log("Dashboard WebSocket disconnected");
    setWsConnected(false);
  }, []);

  // WebSocket connection for live data - connecting to the backend WebSocket endpoint
  // Usually the backend runs on port 8000
  const wsProtocol = typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') : 'ws://';
  // Use the backend host for WebSocket connections
  let backendHost = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000';
  // Remove trailing '/api' if present for WebSocket connections
  if (backendHost.endsWith('/api')) {
    backendHost = backendHost.slice(0, -4);
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const { send } = useWebSocket({
    url: user ? `${wsProtocol}${backendHost}/api/ws/live-calls?designation=${encodeURIComponent(user.designation || '')}&token=${encodeURIComponent(token || '')}` : `${wsProtocol}${backendHost}/api/ws/live-calls`,
    onMessage: handleWsMessage,
    onError: handleWsError,
    onOpen: handleWsOpen,
    onClose: handleWsClose,
    // Note: The specific WebSocket endpoints handle their own subscriptions to Redis channels
  });

  const handlePauseToggle = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    // Send pause/resume command to WebSocket
    if (send && wsConnected) {
      send({
        type: newPausedState ? "pause_updates" : "resume_updates",
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(newPausedState ? "Live data paused" : "Live data resumed");
  };

  const handleDesignationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const designation = event.target.value;
    setSelectedDesignation(designation);
    
    if (user?.role === 'super-admin') {
      // Navigate to the appropriate admin dashboard based on designation
      switch (designation) {
        case 'super-admin':
          router.push('/admin/super-admin');
          break;
        case 'call-center-admin':
          router.push('/admin/callcenter');
          break;
        case 'marketing-admin':
          router.push('/admin/marketing');
          break;
        case 'compliance-admin':
          router.push('/admin/compliance');
          break;
        default:
          router.push('/admin/super-admin');
          break;
      }
    }
  };

  const handleQueuesClick = () => {
    // Toggle queue visibility or open queue management
    console.log("Queues button clicked");
  };

  const handleSettingsClick = () => {
    // Open dashboard settings
    console.log("Settings button clicked");
  };

  const handleMoreClick = () => {
    // Open additional options menu
    console.log("More options clicked");
  };

  // Set initial designation based on user
  useEffect(() => {
    if (user?.role === 'super-admin') {
      // Default to empty string for super-admin's own dashboard
      setSelectedDesignation('');
    } else if (user?.designation) {
      setSelectedDesignation(user.designation);
    }
  }, [user?.role, user?.designation]);

  return (
    <div className="min-h-screen text-white">
      {/* Navigation Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 min-w-full">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-white whitespace-nowrap">Queues</span>
            <span className="text-slate-400 whitespace-nowrap">&gt;</span>
            <span className="text-white whitespace-nowrap">Live</span>
            <span className="text-slate-400 whitespace-nowrap">&gt;</span>
            <span className="text-white whitespace-nowrap truncate max-w-[80px] sm:max-w-[150px] md:max-w-[200px]">{title}</span>
            
            {/* Super Admin Designation Selector */}
            {user?.role === 'super-admin' && (
              <select 
                className="bg-slate-700 border border-slate-600 rounded px-2  text-sm text-white w-full  sm:ml-2"
                value={selectedDesignation}
                onChange={handleDesignationChange}
              >
                <option value="">
                  {selectedDesignation ? 'Super Admin' : 'Select Designation'}
                </option>
                {selectedDesignation !== 'call-center-admin' && (
                  <option value="call-center-admin">Call Center Admin</option>
                )}
                {selectedDesignation !== 'marketing-admin' && (
                  <option value="marketing-admin">Marketing Admin</option>
                )}
                {selectedDesignation !== 'compliance-admin' && (
                  <option value="compliance-admin">Compliance Admin</option>
                )}
              </select>
            )}
          </div>
          
          {/* Spacer to push controls to the far right */}
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              {wsConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-slate-400">
                {wsError ? wsError : wsConnected ? "LIVE DATA" : "CONNECTING"}
              </span>
            </div>
            
            {/* Pause/Resume Button */}
            <Button
              variant="outline"
              size="sm"
              className={`border-slate-600 text-white hover:bg-slate-700 bg-transparent transition-colors px-2 sm:px-3 ${
                isPaused ? 'border-orange-500 text-orange-400 hover:bg-orange-900/20' : 'border-green-500 text-green-400 hover:bg-green-900/20'
              }`}
              onClick={handlePauseToggle}
              disabled={!wsConnected}
            >
              {isPaused ? (
                <>
                  <Play className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  <span className="">Pause</span>
                </>
              )}
            </Button>
            
            {/* Queues Button */}
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-white hover:bg-slate-700 bg-transparent px-2 sm:px-3"
              onClick={handleQueuesClick}
            >
              <Users className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
              <span className="sm:inline">Queues</span>
            </Button>
            
            {/* Settings Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-400 hover:text-white hover:bg-slate-700 px-2 sm:px-3"
              onClick={handleSettingsClick}
            >
              <Settings className="w-3 sm:w-4 h-3 sm:h-4" />
            </Button>
            
            {/* More Options Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-400 hover:text-white hover:bg-slate-700 px-2 sm:px-3"
              onClick={handleMoreClick}
            >
              <MoreHorizontal className="w-3 sm:w-4 h-3 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Paused Overlay */}
      {isPaused && (
        <div className="bg-orange-900/20 border-b border-orange-500/30 px-4 sm:px-6 py-2">
          <div className="flex items-center justify-center gap-2 text-orange-400">
            <Pause className="w-4 h-4" />
            <span className="text-sm">Live data updates paused</span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};