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

interface WebSocketMessage {
  type: string;
  data?: any;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners: Map<keyof SocketEvents, Function[]> = new Map();

  constructor() {
    // Initialize event listeners map
    const events: (keyof SocketEvents)[] = [
      'task:created', 'task:updated', 'task:deleted', 'task:completed', 'task:assigned', 'task:unassigned',
      'household:updated', 'household:member_joined', 'household:member_left', 'household:invite_code_refreshed',
      'user:updated', 'connect', 'disconnect', 'reconnect', 'connect_error'
    ];
    
    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    try {
      const token = await storage.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create native WebSocket connection to /ws endpoint (remove /api prefix)
      const baseUrl = API_BASE_URL.replace('/api', '').replace('http', 'ws');
      const wsUrl = baseUrl + '/ws?token=' + encodeURIComponent(token);
      console.warn('🔌 Connecting to WebSocket:', wsUrl);
      
      this.socket = new WebSocket(wsUrl);
      this.setupEventListeners();
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.emitToListeners('connect_error', error as Error);
      
      // Retry connection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
      }
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection opened
    this.socket.onopen = () => {
      console.warn('🔥 WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emitToListeners('connect');
    };

    // Connection closed
    this.socket.onclose = (event) => {
      console.warn('🔥 WebSocket disconnected:', event.reason || 'Unknown reason');
      this.emitToListeners('disconnect', event.reason || 'Connection closed');
      
      // Auto-reconnect if not intentionally closed
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
      }
    };

    // Error occurred
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emitToListeners('connect_error', new Error('WebSocket error'));
    };

    // Message received
    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.warn('🔥 WebSocket message received:', message);
        
        // Emit the event to listeners
        if (message.type && this.eventListeners.has(message.type as keyof SocketEvents)) {
          this.emitToListeners(message.type as keyof SocketEvents, message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  get status(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }

  async joinHousehold(householdId: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('Cannot join household: WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'join:household',
      data: { householdId }
    };

    this.socket?.send(JSON.stringify(message));
    console.warn('🏠 Sent join household message:', householdId);
  }

  leaveHousehold(householdId: string): void {
    if (!this.isConnected) {
      console.warn('Cannot leave household: WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'leave:household',
      data: { householdId }
    };

    this.socket?.send(JSON.stringify(message));
    console.warn('🏠 Sent leave household message:', householdId);
  }

  on<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener as Function);
    this.eventListeners.set(event, listeners);
  }

  off<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener as Function);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  private emitToListeners<K extends keyof SocketEvents>(event: K, ...args: any[]): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in WebSocket event listener for ${event}:`, error);
      }
    });
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
