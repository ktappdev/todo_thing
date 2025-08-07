import { API_BASE_URL } from '@env';
import axios, { AxiosInstance } from 'axios';
import { storage } from '../utils/storage';
import { Household, User, Task, CreateHouseholdRequest, JoinHouseholdRequest, CreateTaskRequest, UpdateTaskRequest, AssignTaskRequest } from '../types';


class ApiService {
  private api: AxiosInstance;
  /**
   * Extract householdId encoded in the stored JWT token.
   * Returns null if no token is found or token cannot be decoded.
   */
  private async getHouseholdIdFromToken(): Promise<string | null> {
    const token = await storage.getToken();
    if (!token) return null;
    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) return null;
      const json = globalThis.atob ? globalThis.atob(payloadSegment) : Buffer.from(payloadSegment, 'base64').toString('utf-8');
      const payload = JSON.parse(json);
      return payload.householdId || null;
    } catch (err) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.warn('Failed to decode token payload', err);
      return null;
    }
  }

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include JWT token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await storage.getToken();
        if (token) {
          // Ensure we preserve existing headers object without overwriting (important for React Native)
          if (!config.headers) {
            config.headers = {} as any;
          }
          (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('Adding Authorization header', (config.headers as any).Authorization);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Household API
  async createHousehold(data: CreateHouseholdRequest): Promise<{ household: Household; user: User }> {
    const response = await this.api.post('/households', data);
    const { token, household, user } = response.data;
    if (token) {
      await storage.saveToken(token);
    }
    if (user) {
      await storage.saveUser(user);
    }
    return { household, user };
  }

  async getHouseholdByCode(code: string): Promise<Household> {
    const response = await this.api.get(`/households/code/${code}`);
    return response.data;
  }

  async joinHousehold(code: string, data: JoinHouseholdRequest): Promise<User> {
    const response = await this.api.post(`/households/code/${code}/join`, data);
    const { token, user } = response.data;
    if (token) {
      await storage.saveToken(token);
    }
    return user;
  }

  async getHouseholdUsers(householdId?: string): Promise<User[]> {
    const tokenId = await this.getHouseholdIdFromToken();
    const resolvedId = tokenId ?? householdId;
    if (!resolvedId) throw new Error('Household ID not available');
    const response = await this.api.get(`/households/${resolvedId}/users`);
    return response.data;
  }

  async getInviteCode(householdId?: string): Promise<{ inviteCode: string }> {
    const tokenId = await this.getHouseholdIdFromToken();
    const resolvedId = tokenId ?? householdId;
    if (!resolvedId) throw new Error('Household ID not available');
    const response = await this.api.get(`/households/${resolvedId}/invite`);
    return response.data;
  }

  async refreshInviteCode(householdId?: string): Promise<{ inviteCode: string }> {
    const tokenId = await this.getHouseholdIdFromToken();
    const resolvedId = tokenId ?? householdId;
    if (!resolvedId) throw new Error('Household ID not available');
    const response = await this.api.post(`/households/${resolvedId}/invite/refresh`);
    return response.data;
  }

  // Task API
  async getHouseholdTasks(householdId?: string): Promise<Task[]> {
    const tokenId = await this.getHouseholdIdFromToken();
    const resolvedId = tokenId ?? householdId;
    if (!resolvedId) throw new Error('Household ID not available');
    const response = await this.api.get(`/households/${resolvedId}/tasks`);
    return response.data;
  }

  async createTask(householdId: string | undefined, data: CreateTaskRequest): Promise<Task> {
    const tokenId = await this.getHouseholdIdFromToken();
    const resolvedId = tokenId ?? householdId;
    if (!resolvedId) throw new Error('Household ID not available');
    const response = await this.api.post(`/households/${resolvedId}/tasks`, data);
    return response.data;
  }

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await this.api.put(`/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(taskId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/tasks/${taskId}`);
    return response.data;
  }

  async toggleTaskCompletion(taskId: string): Promise<Task> {
    // Backend ignores request body and infers user from JWT
    const response = await this.api.patch(`/tasks/${taskId}/toggle`, {});
    return response.data;
  }

  async assignTask(taskId: string, data: AssignTaskRequest): Promise<Task> {
    const response = await this.api.post(`/tasks/${taskId}/assign`, data);
    return response.data;
  }

  async unassignTask(taskId: string, userId: string): Promise<Task> {
    const response = await this.api.delete(`/tasks/${taskId}/assign/${userId}`);
    return response.data;
  }

  // User API
  async updateUser(userId: string, data: { name: string }): Promise<User> {
    const response = await this.api.put(`/users/${userId}`, data);
    return response.data;
  }

  async leaveHousehold(userId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  // Bootstrap API
  async getMe(): Promise<{ user: User; household: Household }> {
    const response = await this.api.get('/me');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    // Health endpoint is at root level, not under /api
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.data;
  }
}

export default new ApiService();