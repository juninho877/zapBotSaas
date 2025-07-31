import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?token=${token}`;
    
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      toast.success('Real-time connection established');
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error occurred');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [isAuthenticated, token]);

  const handleMessage = (message: any) => {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket connection confirmed');
        break;
        
      case 'session_update':
        // Handle session status updates
        toast.success(`Session ${message.session_id} status: ${message.data.status}`);
        // Trigger page refresh or state update
        window.dispatchEvent(new CustomEvent('sessionUpdate', { detail: message }));
        break;
        
      case 'group_update':
        // Handle group updates
        window.dispatchEvent(new CustomEvent('groupUpdate', { detail: message }));
        break;
        
      case 'notification':
        toast.info(message.data.message || 'New notification');
        break;
        
      case 'pong':
        // Handle ping/pong
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const sendMessage = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  const value = {
    isConnected,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
</boltContext>