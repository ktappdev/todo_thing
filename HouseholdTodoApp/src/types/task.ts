import { User } from './household';

export type TaskCategory = 'CHORES' | 'SHOPPING' | 'WORK' | 'GENERAL';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  dueDate?: string;
  completed: boolean;
  creatorId: string;
  creator: User;
  householdId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
  assignments: TaskAssignment[];
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  user: User;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  category: TaskCategory;
  dueDate?: string;
  creatorId: string;
  assignedTo: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category?: TaskCategory;
  dueDate?: string;
  assignedTo?: string[];
}

export interface AssignTaskRequest {
  userIds: string[];
}

export interface ToggleTaskRequest {
  userId: string;
}