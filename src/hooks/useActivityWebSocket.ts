// src/hooks/useActivityWebSocket.ts
import { useEffect, useRef } from 'react';
import { useActivityStore } from '@/stores/activityStore';
import { useUserStore } from '@/stores/userStore';
import { LiveCall, Agent } from '@/types';

interface WebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export const useActivityWebSocket = ({ url, onMessage, onError, onOpen, onClose }: WebSocketOptions) => {
  const {
    updateLiveCalls,
    addLiveCall,
    removeLiveCall,
    updateLiveCall,
    updateActiveAgents,
    addActiveAgent,
    removeActiveAgent,
    updateActiveAgent,
    setWsConnected,
    setWsError
  } = useActivityStore();
  const { user } = useUserStore();
  
  // Using useRef to store WebSocket instance to avoid reconnections on prop changes
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectIntervalRef = useRef<number>(1000); // Start with 1 second

  useEffect(() => {
    if (!user) return;

    const connect = () => {
      // Clear any existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      try {
        // Include user ID in the WebSocket URL to identify the connection
        const userSpecificUrl = user.id ? `${url}?userId=${user.id}` : url;
        wsRef.current = new WebSocket(userSpecificUrl);

        wsRef.current.onopen = () => {
          console.log('Activity WebSocket connected for user:', user.id);
          setWsConnected(true);
          setWsError(null);
          if (onOpen) onOpen();
          // Reset reconnect interval on successful connection
          reconnectIntervalRef.current = 1000;
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle different types of activity updates
            switch(data.type) {
              case 'live_call_update':
                if (data.call) {
                  updateLiveCall(data.call.id, data.call);
                }
                break;
              case 'new_live_call':
                if (data.call) {
                  addLiveCall(data.call);
                }
                break;
              case 'end_live_call':
                if (data.callId) {
                  removeLiveCall(data.callId);
                }
                break;
              case 'update_agent_status':
                if (data.agent) {
                  updateActiveAgent(data.agent.id, data.agent);
                }
                break;
              case 'agent_login':
                if (data.agent) {
                  addActiveAgent(data.agent);
                }
                break;
              case 'agent_logout':
                if (data.agentId) {
                  removeActiveAgent(data.agentId);
                }
                break;
              case 'full_call_list':
                if (Array.isArray(data.calls)) {
                  updateLiveCalls(data.calls);
                }
                break;
              case 'full_agent_list':
                if (Array.isArray(data.agents)) {
                  updateActiveAgents(data.agents);
                }
                break;
              default:
                // For any other message types, let the parent handle it
                if (onMessage) onMessage(data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('Activity WebSocket closed:', event.code, event.reason);
          setWsConnected(false);
          if (onClose) onClose();
          
          // Attempt to reconnect with exponential backoff (max 30 seconds)
          const maxReconnectInterval = 30000;
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect to WebSocket...');
            connect();
            reconnectIntervalRef.current = Math.min(reconnectIntervalRef.current * 2, maxReconnectInterval);
          }, reconnectIntervalRef.current);
        };

        wsRef.current.onerror = (error) => {
          console.error('Activity WebSocket error:', error);
          setWsError('WebSocket connection error');
          if (onError) onError(error as Event);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setWsError('Failed to establish WebSocket connection');
        if (onError) onError(error as Event);
      }
    };

    connect();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [url, user?.id, 
    updateLiveCalls, addLiveCall, removeLiveCall, updateLiveCall,
    updateActiveAgents, addActiveAgent, removeActiveAgent, updateActiveAgent,
    setWsConnected, setWsError, onMessage, onError, onOpen, onClose]);
};