import React, { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react';
import { AppState } from 'react-native';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMe } from '../hooks/useApi';

interface WebSocketContextType {
  isConnected: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  connect: () => Promise<void>;
  disconnect: () => void;
  joinHousehold: (householdId: string) => Promise<void>;
  leaveHousehold: (householdId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const { data: meData } = useMe();
  const householdId = meData?.household?.id;
  
  // Stable callback functions
  const onTaskCreated = useCallback((_data: any) => {
    // noop
  }, []);
  
  const onTaskUpdated = useCallback((_data: any) => {
    // noop
  }, []);
  
  const onTaskCompleted = useCallback((_data: any) => {
    // noop
  }, []);
  
  const onMemberJoined = useCallback((_data: any) => {
    // noop
  }, []);
  
  const onMemberLeft = useCallback((_data: any) => {
    // noop
  }, []);
  
  if (householdId) {
    console.warn('🔌 WebSocketProvider: Initializing WebSocket with householdId:', householdId);
  }
  
  const websocket = useWebSocket({
    householdId,
    autoConnect: !!householdId,
    onTaskCreated,
    onTaskUpdated,
    onTaskCompleted,
    onMemberJoined,
    onMemberLeft,
  });

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground - attempting WebSocket reconnect');
        if (householdId) {
          websocket.connect();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('App going to background - disconnecting WebSocket');
        websocket.disconnect();
      }
      setAppState(nextAppState as any);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState, websocket, householdId]);

  // Join household room when user/household data changes
  useEffect(() => {
    if (householdId && websocket.isConnected) {
      console.warn('🏠 WebSocketProvider: Joining household room:', householdId);
      websocket.joinHousehold(householdId);
    }
  }, [householdId, websocket]);

  const contextValue: WebSocketContextType = useMemo(() => ({
    isConnected: websocket.isConnected,
    status: websocket.status,
    connect: websocket.connect,
    disconnect: websocket.disconnect,
    joinHousehold: websocket.joinHousehold,
    leaveHousehold: websocket.leaveHousehold,
  }), [
    websocket.isConnected,
    websocket.status,
    websocket.connect,
    websocket.disconnect,
    websocket.joinHousehold,
    websocket.leaveHousehold,
  ]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
