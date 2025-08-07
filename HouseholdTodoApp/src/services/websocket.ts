import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@env';
import { storage } from '../utils/storage';
import { Task, Household, User } from '../types';

export interface SocketEvents {
  // Task events
  'task:created': (data: { task: Task; householdId: string }) => void;
  'task:updated': (data: { task: Task; householdId: string }) => void;
  'task:deleted': (data: { taskId: string; householdId: string }) => void;
  'task:completed': (data: { task: Task; householdId: string; completedBy: User }) => void;
  'task:assigned': (data: { task: Task; householdId: string; assignedTo: User }) => void;
  'task:unassigned': (data: { task: Task; householdId: string; unassignedFrom: User }) => void;
  
  // Household events
  'household:updated': (data: { household: Household }) => void;
  'household:member_joined': (data: { user: User; household: Household }) => void;
  'household:member_left': (data: { userId: string; household: Household }) => void;
  'household:invite_code_refreshed': (data: { inviteCode: string; household: Household }) => void;
  
  // User events
  'user:updated': (data: { user: User; householdId: string }) => void;
  
  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'reconnect': () => void;
  'connect_error': (error: Error) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners: Map<keyof SocketEvents, Function[]> = new Map();

  constructor() {
    // Initialize event listeners map
    Object.keys({} as SocketEvents).forEach(event => {
      this.eventListeners.set(event as keyof SocketEvents, []);
    });
  }

  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = await storage.getToken();
      if (!token) {
        console.warn('No token available for WebSocket connection');
        this.isConnecting = false;
        return;
      }

      // Convert HTTP URL to WebSocket URL
      const wsUrl = API_BASE_URL.replace(/^https?:/, 'ws:').replace(/^http:/, 'ws:');
      
      this.socket = io(wsUrl, {
        auth: {
          token
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
      });

      this.setupEventHandlers();
      this.isConnecting = false;

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emitToListeners('connect');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.emitToListeners('disconnect', reason);
    });

    this.socket.on('reconnect', () => {
      console.log('WebSocket reconnected');
      this.reconnectAttempts = 0;
      this.emitToListeners('reconnect');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emitToListeners('connect_error', error);
    });

    // Task events
    this.socket.on('task:created', (data) => {
      console.log('Task created:', data);
      this.emitToListeners('task:created', data);
    });

    this.socket.on('task:updated', (data) => {
      console.log('Task updated:', data);
      this.emitToListeners('task:updated', data);
    });

    this.socket.on('task:deleted', (data) => {
      console.log('Task deleted:', data);
      this.emitToListeners('task:deleted', data);
    });

    this.socket.on('task:completed', (data) => {
      console.log('Task completed:', data);
      this.emitToListeners('task:completed', data);
    });

    this.socket.on('task:assigned', (data) => {
      console.log('Task assigned:', data);
      this.emitToListeners('task:assigned', data);
    });

    this.socket.on('task:unassigned', (data) => {
      console.log('Task unassigned:', data);
      this.emitToListeners('task:unassigned', data);
    });

    // Household events
    this.socket.on('household:updated', (data) => {
      console.log('Household updated:', data);
      this.emitToListeners('household:updated', data);
    });

    this.socket.on('household:member_joined', (data) => {
      console.log('Household member joined:', data);
      this.emitToListeners('household:member_joined', data);
    });

    this.socket.on('household:member_left', (data) => {
      console.log('Household member left:', data);
      this.emitToListeners('household:member_left', data);
    });

    this.socket.on('household:invite_code_refreshed', (data) => {
      console.log('Household invite code refreshed:', data);
      this.emitToListeners('household:invite_code_refreshed', data);
    });

    // User events
    this.socket.on('user:updated', (data) => {
      console.log('User updated:', data);
      this.emitToListeners('user:updated', data);
    });
  }

  private emitToListeners<K extends keyof SocketEvents>(
    event: K, 
    ...args: Parameters<SocketEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in WebSocket listener for ${event}:`, error);
      }
    });
  }

  // Public method to add event listeners
  on<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }

  // Public method to remove event listeners
  off<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  // Join a household room for receiving updates
  async joinHousehold(householdId: string): Promise<void> {
    if (!this.socket?.connected) {
      await this.connect();
    }
    
    if (this.socket?.connected) {
      this.socket.emit('join:household', { householdId });
      console.log('Joined household room:', householdId);
    }
  }

  // Leave a household room
  leaveHousehold(householdId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave:household', { householdId });
      console.log('Left household room:', householdId);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Get connection status
  getStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (this.socket?.connected) return 'connected';
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return 'error';
    return 'disconnected';
  }
}

export default new WebSocketService();
