import { useEffect, useRef, useState, useCallback } from "react";
import { useUserStore } from "@/stores/userStore";

interface WebSocketHookOptions {
  url: string;
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  subscriptions?: string[];
}

// WebSocket singleton manager to prevent multiple connections
class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, WebSocket> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private userIds: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public connect(connectionId: string, url: string, userId: string, subscriptions: string[] = []): void {
    // Close existing connection if it exists
    if (this.connections.has(connectionId)) {
      this.disconnect(connectionId);
    }

    try {
      const ws = new WebSocket(url); // Use provided URL directly
      this.connections.set(connectionId, ws);
      this.listeners.set(connectionId, new Set());
      this.reconnectAttempts.set(connectionId, 0);
      this.userIds.set(connectionId, userId);

      ws.onopen = () => {
        console.log("WebSocket connected:", url);
        this.reconnectAttempts.set(connectionId, 0);
        
        // Notify listeners about connection
        const listeners = this.listeners.get(connectionId);
        if (listeners) {
          listeners.forEach((listener) => {
            listener({ type: "ws_open" });
          });
        }
        
        // Subscribe to channels after a small delay to ensure connection is ready
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            subscriptions.forEach((subscription) => {
              ws.send(JSON.stringify({ type: "subscribe", subscription_type: subscription }));
            });
          }
        }, 100);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const listeners = this.listeners.get(connectionId);
          if (listeners) {
            listeners.forEach((listener) => {
              listener(data);
            });
          }
        } catch (err) {
          console.error("WebSocket message parsing error:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        console.error("WebSocket URL:", url);
        console.error("WebSocket readyState:", ws.readyState);
        const listeners = this.listeners.get(connectionId);
        if (listeners) {
          listeners.forEach((listener) => {
            listener({ type: "ws_error", error });
          });
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", url, event.code, event.reason);
        console.log("Close event details:", { code: event.code, reason: event.reason, wasClean: event.wasClean });
        
        // Don't reconnect if connection was manually closed (code 1000)
        if (event.code === 1000) {
          return;
        }
        
        // Only attempt to reconnect if the user hasn't changed
        const currentUserId = this.userIds.get(connectionId);
        if (currentUserId === userId) {
          const attempts = this.reconnectAttempts.get(connectionId) || 0;
          if (attempts < this.maxReconnectAttempts) {
            // Exponential backoff to prevent excessive reconnection attempts
            const delay = this.reconnectInterval * Math.pow(2, attempts);
            setTimeout(() => {
              const newAttempts = attempts + 1;
              this.reconnectAttempts.set(connectionId, newAttempts);
              console.log(`Reconnecting WebSocket, attempt ${newAttempts} after ${delay}ms...`);
              this.connect(connectionId, url, userId, subscriptions);
            }, delay);
          } else {
            console.error("Max reconnect attempts reached for", connectionId);
            const listeners = this.listeners.get(connectionId);
            if (listeners) {
              listeners.forEach((listener) => {
                listener({ type: "ws_max_reconnect_attempts", connectionId });
              });
            }
          }
        }
      };
    } catch (err) {
      console.error("Failed to establish WebSocket connection:", err);
    }
  }

  public addListener(connectionId: string, listener: (data: any) => void): void {
    const listeners = this.listeners.get(connectionId);
    if (listeners) {
      listeners.add(listener);
    } else {
      this.listeners.set(connectionId, new Set([listener]));
    }
  }

  public removeListener(connectionId: string, listener: (data: any) => void): void {
    const listeners = this.listeners.get(connectionId);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  public disconnect(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close(1000, "Component unmounted");
    }
    this.connections.delete(connectionId);
    this.listeners.delete(connectionId);
    this.reconnectAttempts.delete(connectionId);
    this.userIds.delete(connectionId);
    console.log("WebSocket disconnected:", connectionId);
  }

  public isConnected(connectionId: string): boolean {
    const ws = this.connections.get(connectionId);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }

  public send(connectionId: string, data: any): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not open, cannot send message for", connectionId);
    }
  }
}

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function useWebSocket({ url, onMessage, onError, onOpen, onClose, subscriptions = [] }: WebSocketHookOptions) {
  const { user, loading } = useUserStore();
  const [userId, setUserId] = useState<string | null>(null);
  const connectionIdRef = useRef<string>(`ws_${Math.random().toString(36).substr(2, 9)}`);
  const wsManagerRef = useRef(WebSocketManager.getInstance());
  const mountedRef = useRef(true);

  // Create a stable reference for the onMessage callback
  const stableOnMessage = useRef(onMessage);
  useEffect(() => {
    stableOnMessage.current = onMessage;
  }, [onMessage]);

  // Set user ID from Zustand store
  useEffect(() => {
    if (user && user.id !== userId) {
      setUserId(user.id);
    } else if (!user && !loading && userId !== "anonymous") {
      setUserId("anonymous");
    }
  }, [user, loading, userId]);

  // Connect to WebSocket when user ID is available
  useEffect(() => {
    if (!userId || !url) return;

    // Check if token is expired before connecting
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          console.warn('Token expired, WebSocket connection skipped');
          onError?.(new Event('Token expired'));
          return;
        }
      } catch (e) {
        console.warn('Invalid token format');
        onError?.(new Event('Invalid token'));
        return;
      }
    }

    const connectionId = connectionIdRef.current;
    
    // Don't create new connection if one already exists and is open
    if (wsManagerRef.current.isConnected(connectionId)) {
      console.log('WebSocket already connected, skipping');
      return;
    }

    const handleMessage = (data: any) => {
      if (data.type === "ws_error") {
        onError?.(data.error);
      } else if (data.type === "ws_open") {
        onOpen?.();
      } else if (data.type === "ws_close") {
        onClose?.();
      } else if (data.type === "ws_max_reconnect_attempts") {
        console.error("Max reconnect attempts reached");
        onError?.(new Event("Max reconnect attempts reached"));
      } else {
        stableOnMessage.current(data);
      }
    };

    wsManagerRef.current.connect(connectionId, url, userId, subscriptions);
    wsManagerRef.current.addListener(connectionId, handleMessage);

    return () => {
      mountedRef.current = false;
      wsManagerRef.current.removeListener(connectionId, handleMessage);
      wsManagerRef.current.disconnect(connectionId);
    };
  }, [userId, url]); // Removed subscriptions from dependency array

  const send = useCallback((data: any) => {
    if (mountedRef.current && userId) {
      wsManagerRef.current.send(connectionIdRef.current, data);
    }
  }, [userId]);

  return { send };
}