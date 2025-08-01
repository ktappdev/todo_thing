import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Household, User } from '../types';

const TASKS_KEY = 'offline_tasks';
const HOUSEHOLD_KEY = 'offline_household';
const USER_KEY = 'offline_user';
const PENDING_CHANGES_KEY = 'pending_changes';

interface PendingChange {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'TASK' | 'USER' | 'HOUSEHOLD';
  data: any;
  timestamp: number;
}

export class OfflineService {
  // Save tasks to local storage
  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to local storage:', error);
    }
  }

  // Get tasks from local storage
  static async getTasks(): Promise<Task[] | null> {
    try {
      const tasksJson = await AsyncStorage.getItem(TASKS_KEY);
      return tasksJson ? JSON.parse(tasksJson) : null;
    } catch (error) {
      console.error('Error getting tasks from local storage:', error);
      return null;
    }
  }

  // Save household to local storage
  static async saveHousehold(household: Household): Promise<void> {
    try {
      await AsyncStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(household));
    } catch (error) {
      console.error('Error saving household to local storage:', error);
    }
  }

  // Get household from local storage
  static async getHousehold(): Promise<Household | null> {
    try {
      const householdJson = await AsyncStorage.getItem(HOUSEHOLD_KEY);
      return householdJson ? JSON.parse(householdJson) : null;
    } catch (error) {
      console.error('Error getting household from local storage:', error);
      return null;
    }
  }

  // Save user to local storage
  static async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to local storage:', error);
    }
  }

  // Get user from local storage
  static async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting user from local storage:', error);
      return null;
    }
  }

  // Save pending changes to local storage
  static async savePendingChanges(changes: PendingChange[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
    } catch (error) {
      console.error('Error saving pending changes to local storage:', error);
    }
  }

  // Get pending changes from local storage
  static async getPendingChanges(): Promise<PendingChange[] | null> {
    try {
      const changesJson = await AsyncStorage.getItem(PENDING_CHANGES_KEY);
      return changesJson ? JSON.parse(changesJson) : null;
    } catch (error) {
      console.error('Error getting pending changes from local storage:', error);
      return null;
    }
  }

  // Add a pending change
  static async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<void> {
    try {
      const changes = (await this.getPendingChanges()) || [];
      const newChange: PendingChange = {
        ...change,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      changes.push(newChange);
      await this.savePendingChanges(changes);
    } catch (error) {
      console.error('Error adding pending change:', error);
    }
  }

  // Remove a pending change
  static async removePendingChange(changeId: string): Promise<void> {
    try {
      const changes = (await this.getPendingChanges()) || [];
      const updatedChanges = changes.filter(change => change.id !== changeId);
      await this.savePendingChanges(updatedChanges);
    } catch (error) {
      console.error('Error removing pending change:', error);
    }
  }

  // Clear all local data
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        TASKS_KEY,
        HOUSEHOLD_KEY,
        USER_KEY,
        PENDING_CHANGES_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }

  // Check if device is online
  static isOnline(): boolean {
    // This is a simple check. In a real app, you might want to use NetInfo
    // or implement a more sophisticated check
    // For now, we'll just return true as a placeholder
    return true;
  }

  // Sync pending changes with the server
  static async syncPendingChanges(): Promise<void> {
    if (!this.isOnline()) {
      return;
    }

    try {
      const changes = await this.getPendingChanges();
      if (!changes || changes.length === 0) {
        return;
      }

      // Process changes in order
      for (const change of changes) {
        try {
          // In a real app, you would make API calls here based on the change type
          console.log('Processing change:', change);
          
          // Remove the change after successful sync
          await this.removePendingChange(change.id);
        } catch (error) {
          console.error('Error syncing change:', change.id, error);
          // Continue with other changes even if one fails
        }
      }
    } catch (error) {
      console.error('Error syncing pending changes:', error);
    }
  }
}