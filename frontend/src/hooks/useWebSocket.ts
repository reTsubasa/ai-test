import { useEffect, useRef, useCallback, useState } from 'react';
import type { TrafficData, ActivityLogEntry, Alert, NodeStatus } from '../stores/dashboardStore';

// WebSocket message types
export type WebSocketMessage =
  | { type: 'traffic'; data: TrafficData }
  | { type: 'activity'; data: ActivityLogEntry }
  | { type: 'alert'; data: Alert }
  | { type: 'nodeStatus'; data: NodeStatus }
  | { type: 'ping' }
  | { type: 'error'; error: string };

// WebSocket connection state
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

// Configuration options
interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

// Return type
interface UseWebSocketReturn {
  connectionState: ConnectionState;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: unknown) => void;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Custom hook for managing WebSocket connections
 *
 * @param options - WebSocket configuration options
 * @returns WebSocket connection state and methods
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    enabled = true,
  } = options;

  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(
    null
  );

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  // Parse message and validate it
  const parseMessage = useCallback(
    (data: string): WebSocketMessage | null => {
      try {
        const message = JSON.parse(data) as WebSocketMessage;

        // Validate message type
        const validTypes: WebSocketMessage['type'][] = [
          'traffic',
          'activity',
          'alert',
          'nodeStatus',
          'ping',
          'error',
        ];

        if (!validTypes.includes(message.type)) {
          console.warn('Unknown WebSocket message type:', message.type);
          return null;
        }

        return message;
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        return null;
      }
    },
    []
  );

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const message = parseMessage(event.data);

      if (!message) return;

      setLastMessage(message);

      // Ignore ping messages
      if (message.type === 'ping') {
        // Respond with pong
        wsRef.current?.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      // Call custom message handler
      if (onMessage) {
        onMessage(message);
      }
    },
    [parseMessage, onMessage]
  );

  // Handle connection open
  const handleOpen = useCallback(() => {
    setConnectionState('connected');
    reconnectAttemptsRef.current = 0;
    onConnect?.();
  }, [onConnect]);

  // Handle connection close
  const handleClose = useCallback(
    (event: CloseEvent) => {
      setConnectionState('disconnected');
      onDisconnect?.();

      // Attempt to reconnect if enabled and connection wasn't intentionally closed
      if (shouldReconnectRef.current && enabled && event.code !== 1000) {
        if (
          maxReconnectAttempts === 0 ||
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      }
    },
    [enabled, reconnectInterval, maxReconnectAttempts, onDisconnect]
  );

  // Handle connection error
  const handleError = useCallback(
    (error: Event) => {
      setConnectionState('error');
      onError?.(error);
    },
    [onError]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState('connecting');

    try {
      const ws = new WebSocket(url);

      ws.addEventListener('open', handleOpen);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('close', handleClose);
      ws.addEventListener('error', handleError);

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState('error');
    }
  }, [url, handleOpen, handleMessage, handleClose, handleError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setConnectionState('disconnected');
  }, []);

  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  // Send message through WebSocket
  const sendMessage = useCallback(
    (message: unknown) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket is not connected. Cannot send message.');
      }
    },
    []
  );

  // Connect on mount if enabled
  useEffect(() => {
    if (enabled) {
      shouldReconnectRef.current = true;
      connect();
    }

    return () => {
      disconnect();
    };
    // Only run on mount and when enabled changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    lastMessage,
    sendMessage,
    disconnect,
    reconnect,
  };
}

/**
 * Hook specifically for monitoring dashboard WebSocket updates
 */
export function useMonitoringWebSocket(options: {
  enabled?: boolean;
}): UseWebSocketReturn {
  const wsUrl = `${
    import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
  }/api/monitoring/stream`;

  return useWebSocket({
    url: wsUrl,
    enabled: options.enabled ?? true,
  });
}