import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import websocketService, { SocketEvents } from '../services/websocket';
import { storage } from '../utils/storage';
import { Task, Household, User } from '../types';

interface UseWebSocketOptions {
  householdId?: string;
  autoConnect?: boolean;
  onTaskCreated?: (data: { task: Task; householdId: string }) => void;
  onTaskUpdated?: (data: { task: Task; householdId: string }) => void;
  onTaskDeleted?: (data: { taskId: string; householdId: string }) => void;
  onTaskCompleted?: (data: { task: Task; householdId: string; completedBy: User }) => void;
  onHouseholdUpdated?: (data: { household: Household }) => void;
  onMemberJoined?: (data: { user: User; household: Household }) => void;
  onMemberLeft?: (data: { userId: string; household: Household }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    householdId,
    autoConnect = true,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskCompleted,
    onHouseholdUpdated,
    onMemberJoined,
    onMemberLeft,
  } = options;

  const queryClient = useQueryClient();
  const listenersRef = useRef<Array<{ event: keyof SocketEvents; listener: Function }>>([]);
  const callbacksRef = useRef({ 
    onTaskCreated, 
    onTaskUpdated, 
    onTaskDeleted, 
    onTaskCompleted, 
    onHouseholdUpdated, 
    onMemberJoined, 
    onMemberLeft 
  });
  
  // State for reactive connection status
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');

  // Update callback refs when callbacks change
  useEffect(() => {
    callbacksRef.current = { 
      onTaskCreated, 
      onTaskUpdated, 
      onTaskDeleted, 
      onTaskCompleted, 
      onHouseholdUpdated, 
      onMemberJoined, 
      onMemberLeft 
    };
  });

  // Clean up function
  const cleanupListeners = useCallback(() => {
    listenersRef.current.forEach(({ event, listener }) => {
      websocketService.off(event, listener as any);
    });
    listenersRef.current = [];
  }, []);

  // Setup listeners
  const setupListeners = useCallback(() => {
    cleanupListeners();

    // Task events - automatically invalidate React Query cache
    const taskCreatedListener = (data: { task: Task; householdId: string }) => {
      console.log('WebSocket: Task created', data);
      
      // Invalidate and update cache
      queryClient.invalidateQueries({ queryKey: ['tasks', data.householdId] });
      
      // Update cache directly with new task
      queryClient.setQueryData(['tasks', data.householdId], (oldData: Task[] | undefined) => {
        if (oldData) {
          return [data.task, ...oldData];
        }
        return [data.task];
      });

      callbacksRef.current.onTaskCreated?.(data);
    };

    const taskUpdatedListener = (data: { task: Task; householdId: string }) => {
      console.log('WebSocket: Task updated', data);
      
      // Update cache directly
      queryClient.setQueryData(['tasks', data.householdId], (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.map(task => task.id === data.task.id ? data.task : task);
        }
        return [data.task];
      });

      callbacksRef.current.onTaskUpdated?.(data);
    };

    const taskDeletedListener = (data: { taskId: string; householdId: string }) => {
      console.log('WebSocket: Task deleted', data);
      
      // Update cache directly
      queryClient.setQueryData(['tasks', data.householdId], (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.filter(task => task.id !== data.taskId);
        }
        return [];
      });

      callbacksRef.current.onTaskDeleted?.(data);
    };

    const taskCompletedListener = (data: { task: Task; householdId: string; completedBy: User }) => {
      console.warn('🔥 WebSocket: Task completed', data);
      console.warn('🔥 Updating cache for householdId:', data.householdId);
      
      // Update cache directly
      queryClient.setQueryData(['tasks', data.householdId], (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.map(task => task.id === data.task.id ? data.task : task);
        }
        return [data.task];
      });

      callbacksRef.current.onTaskCompleted?.(data);
    };

    const taskAssignedListener = (data: { task: Task; householdId: string; assignedTo: User }) => {
      console.log('WebSocket: Task assigned', data);
      
      // Update cache directly
      queryClient.setQueryData(['tasks', data.householdId], (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.map(task => task.id === data.task.id ? data.task : task);
        }
        return [data.task];
      });
    };

    const taskUnassignedListener = (data: { task: Task; householdId: string; unassignedFrom: User }) => {
      console.log('WebSocket: Task unassigned', data);
      
      // Update cache directly
      queryClient.setQueryData(['tasks', data.householdId], (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.map(task => task.id === data.task.id ? data.task : task);
        }
        return [data.task];
      });
    };

    // Household events
    const householdUpdatedListener = (data: { household: Household }) => {
      console.log('WebSocket: Household updated', data);
      
      // Invalidate household-related queries
      queryClient.invalidateQueries({ queryKey: ['household', data.household.id] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      
      callbacksRef.current.onHouseholdUpdated?.(data);
    };

    const memberJoinedListener = (data: { user: User; household: Household }) => {
      console.log('WebSocket: Member joined', data);
      
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: ['household', data.household.id, 'users'] });
      
      callbacksRef.current.onMemberJoined?.(data);
    };

    const memberLeftListener = (data: { userId: string; household: Household }) => {
      console.log('WebSocket: Member left', data);
      
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: ['household', data.household.id, 'users'] });
      
      callbacksRef.current.onMemberLeft?.(data);
    };

    const userUpdatedListener = (data: { user: User; householdId: string }) => {
      console.log('WebSocket: User updated', data);
      
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['household', data.householdId, 'users'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    };

    const inviteCodeRefreshedListener = (data: { inviteCode: string; household: Household }) => {
      console.log('WebSocket: Invite code refreshed', data);
      
      // Invalidate invite code query
      queryClient.invalidateQueries({ queryKey: ['household', data.household.id, 'invite'] });
    };

    // Connection events
    const connectListener = () => {
      console.log('WebSocket: Connected');
      setIsConnected(true);
      setStatus('connected');
      
      // Rejoin household if we have one
      if (householdId) {
        websocketService.joinHousehold(householdId);
      }
      
      // Refresh all queries to ensure we have latest data
      queryClient.invalidateQueries();
    };

    const disconnectListener = (reason: string) => {
      console.log('WebSocket: Disconnected', reason);
      setIsConnected(false);
      setStatus('disconnected');
    };

    const reconnectListener = () => {
      console.log('WebSocket: Reconnected');
      setIsConnected(true);
      setStatus('connected');
      
      // Rejoin household and refresh data
      if (householdId) {
        websocketService.joinHousehold(householdId);
      }
      queryClient.invalidateQueries();
    };
    
    const connectErrorListener = (error: Error) => {
      console.error('WebSocket: Connection error', error);
      setIsConnected(false);
      setStatus('error');
    };

    // Register all listeners
    const listeners = [
      { event: 'task:created' as const, listener: taskCreatedListener },
      { event: 'task:updated' as const, listener: taskUpdatedListener },
      { event: 'task:deleted' as const, listener: taskDeletedListener },
      { event: 'task:completed' as const, listener: taskCompletedListener },
      { event: 'task:assigned' as const, listener: taskAssignedListener },
      { event: 'task:unassigned' as const, listener: taskUnassignedListener },
      { event: 'household:updated' as const, listener: householdUpdatedListener },
      { event: 'household:member_joined' as const, listener: memberJoinedListener },
      { event: 'household:member_left' as const, listener: memberLeftListener },
      { event: 'user:updated' as const, listener: userUpdatedListener },
      { event: 'household:invite_code_refreshed' as const, listener: inviteCodeRefreshedListener },
      { event: 'connect' as const, listener: connectListener },
      { event: 'disconnect' as const, listener: disconnectListener },
      { event: 'reconnect' as const, listener: reconnectListener },
      { event: 'connect_error' as const, listener: connectErrorListener },
    ];

    listeners.forEach(({ event, listener }) => {
      websocketService.on(event, listener as any);
    });

    listenersRef.current = listeners;
  }, [queryClient, householdId, cleanupListeners]);

  // Initialize WebSocket connection
  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      if (!autoConnect) return;

      try {
        const token = await storage.getToken();
        if (!token || !mounted) return;

        setStatus('connecting');
        setupListeners();
        await websocketService.connect();

        if (householdId && mounted) {
          await websocketService.joinHousehold(householdId);
        }
      } catch (error) {
        console.error('Failed to initialize WebSocket connection:', error);
        if (mounted) {
          setStatus('error');
          setIsConnected(false);
        }
      }
    };

    initializeConnection();

    return () => {
      mounted = false;
      cleanupListeners();
      if (householdId) {
        websocketService.leaveHousehold(householdId);
      }
    };
  }, [autoConnect, householdId, setupListeners, cleanupListeners]);

  // Methods to control connection
  const connect = useCallback(async () => {
    setupListeners();
    await websocketService.connect();
    if (householdId) {
      await websocketService.joinHousehold(householdId);
    }
  }, [setupListeners, householdId]);

  const disconnect = useCallback(() => {
    cleanupListeners();
    if (householdId) {
      websocketService.leaveHousehold(householdId);
    }
    websocketService.disconnect();
  }, [cleanupListeners, householdId]);

  const joinHousehold = useCallback(async (newHouseholdId: string) => {
    if (householdId && householdId !== newHouseholdId) {
      websocketService.leaveHousehold(householdId);
    }
    await websocketService.joinHousehold(newHouseholdId);
  }, [householdId]);

  const leaveHousehold = useCallback((householdIdToLeave: string) => {
    websocketService.leaveHousehold(householdIdToLeave);
  }, []);

  return useMemo(() => ({
    connect,
    disconnect,
    joinHousehold,
    leaveHousehold,
    isConnected,
    status,
  }), [connect, disconnect, joinHousehold, leaveHousehold, isConnected, status]);
}
