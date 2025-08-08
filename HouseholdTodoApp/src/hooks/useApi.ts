import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import apiService from '../services/api';
import { storage } from '../utils/storage';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types';

// Query Keys
export const queryKeys = {
  me: ['me'] as const,
  tasks: (householdId: string) => ['tasks', householdId] as const,
  household: (householdId: string) => ['household', householdId] as const,
  householdUsers: (householdId: string) => ['household', householdId, 'users'] as const,
  inviteCode: (householdId: string) => ['household', householdId, 'invite'] as const,
};

// User/Household Queries
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: apiService.getMe,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useHouseholdUsers(householdId: string) {
  return useQuery({
    queryKey: queryKeys.householdUsers(householdId),
    queryFn: () => apiService.getHouseholdUsers(householdId),
    enabled: !!householdId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useInviteCode(householdId: string) {
  return useQuery({
    queryKey: queryKeys.inviteCode(householdId),
    queryFn: () => apiService.getInviteCode(householdId),
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Task Queries
export function useTasks(householdId: string) {
  return useQuery({
    queryKey: queryKeys.tasks(householdId),
    queryFn: () => apiService.getHouseholdTasks(householdId),
    enabled: !!householdId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

// Task Mutations
export function useCreateTask(householdId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTaskRequest) => apiService.createTask(householdId, data),
    onSuccess: (newTask) => {
      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.tasks(householdId), (oldData: Task[] | undefined) => {
        if (oldData) {
          return [newTask, ...oldData];
        }
        return [newTask];
      });
      
      Alert.alert('Success', 'Task created successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to create task'
      );
    },
  });
}

export function useUpdateTask(householdId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequest }) => 
      apiService.updateTask(taskId, data),
    onSuccess: (updatedTask) => {
      // Update the cache
      queryClient.setQueryData(queryKeys.tasks(householdId), (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.map(task => task.id === updatedTask.id ? updatedTask : task);
        }
        return [updatedTask];
      });
      
      Alert.alert('Success', 'Task updated successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to update task'
      );
    },
  });
}

export function useDeleteTask(householdId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taskId: string) => apiService.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      // Remove from cache
      queryClient.setQueryData(queryKeys.tasks(householdId), (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.filter(task => task.id !== taskId);
        }
        return [];
      });
      
      Alert.alert('Success', 'Task deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to delete task'
      );
    },
  });
}

export function useToggleTaskCompletion(householdId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taskId: string) => apiService.toggleTaskCompletion(taskId),
    onSuccess: (updatedTask) => {
      // Update the cache
      queryClient.setQueryData(queryKeys.tasks(householdId), (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.map(task => task.id === updatedTask.id ? updatedTask : task);
        }
        return [updatedTask];
      });
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to update task'
      );
    },
  });
}

export function useAssignTask(householdId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) => 
      apiService.assignTask(taskId, { userId }),
    onSuccess: (updatedTask) => {
      // Update the cache
      queryClient.setQueryData(queryKeys.tasks(householdId), (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.map(task => task.id === updatedTask.id ? updatedTask : task);
        }
        return [updatedTask];
      });
      
      Alert.alert('Success', 'Task assigned successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to assign task'
      );
    },
  });
}

export function useUnassignTask(householdId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) => 
      apiService.unassignTask(taskId, userId),
    onSuccess: (updatedTask) => {
      // Update the cache
      queryClient.setQueryData(queryKeys.tasks(householdId), (oldData: Task[] | undefined) => {
        if (oldData) {
          return oldData.map(task => task.id === updatedTask.id ? updatedTask : task);
        }
        return [updatedTask];
      });
      
      Alert.alert('Success', 'Task unassigned successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to unassign task'
      );
    },
  });
}

// Household Mutations
export function useRefreshInviteCode(householdId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.refreshInviteCode(householdId),
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(queryKeys.inviteCode(householdId), data);
      
      Alert.alert('Success', 'Invite code refreshed successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to refresh invite code'
      );
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { name: string } }) => 
      apiService.updateUser(userId, data),
    onSuccess: () => {
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to update profile'
      );
    },
  });
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => apiService.leaveHousehold(userId),
    onSuccess: async () => {
      // Clear all cached data and reset storage
      queryClient.clear();
      await storage.clearUser();
      await storage.clearHousehold();
      
      Alert.alert('Success', 'Left household successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to leave household'
      );
    },
  });
}
