import axios, { AxiosInstance } from 'axios';
import { storage } from '../utils/storage';
import { Household, User, Task, CreateHouseholdRequest, JoinHouseholdRequest, CreateTaskRequest, UpdateTaskRequest, AssignTaskRequest, ToggleTaskRequest } from '../types';

const API_BASE_URL = 'http://localhost:8080';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL + '/api',
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
  async createHousehold(data: CreateHouseholdRequest): Promise<Household> {
    const response = await this.api.post('/households', data);
    const { token, household } = response.data;
    if (token) {
      await storage.saveToken(token);
    }
    return household;
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

  async getHouseholdUsers(householdId: string): Promise<User[]> {
    const response = await this.api.get(`/households/${householdId}/users`);
    return response.data;
  }

  async getInviteCode(householdId: string): Promise<{ inviteCode: string }> {
    const response = await this.api.get(`/households/${householdId}/invite`);
    return response.data;
  }

  async refreshInviteCode(householdId: string): Promise<{ inviteCode: string }> {
    const response = await this.api.post(`/households/${householdId}/invite/refresh`);
    return response.data;
  }

  // Task API
  async getHouseholdTasks(householdId: string): Promise<Task[]> {
    const response = await this.api.get(`/households/${householdId}/tasks`);
    return response.data;
  }

  async createTask(householdId: string, data: CreateTaskRequest): Promise<Task> {
    const response = await this.api.post(`/households/${householdId}/tasks`, data);
    return response.data;
  }

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await this.api.put(`/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.api.delete(`/tasks/${taskId}`);
  }

  async toggleTaskCompletion(taskId: string, data: ToggleTaskRequest): Promise<Task> {
    const response = await this.api.patch(`/tasks/${taskId}/toggle`, data);
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

  async leaveHousehold(userId: string): Promise<void> {
    await this.api.delete(`/users/${userId}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export default new ApiService();