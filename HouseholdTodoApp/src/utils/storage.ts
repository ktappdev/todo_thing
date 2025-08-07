import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Household } from '../types';

const STORAGE_KEYS = {
  USER: 'household_todo_user',
  HOUSEHOLD: 'household_todo_household',
  DEVICE_ID: 'household_todo_device_id',
  AUTH_TOKEN: 'household_todo_auth_token',
};

export const storage = {
  // User storage
  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  },

  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting user from storage:', error);
      return null;
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  },

  // Household storage
  async saveHousehold(household: Household): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HOUSEHOLD, JSON.stringify(household));
    } catch (error) {
      console.error('Error saving household to storage:', error);
    }
  },

  async getHousehold(): Promise<Household | null> {
    try {
      const householdJson = await AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLD);
      return householdJson ? JSON.parse(householdJson) : null;
    } catch (error) {
      console.error('Error getting household from storage:', error);
      return null;
    }
  },

  async removeHousehold(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.HOUSEHOLD);
    } catch (error) {
      console.error('Error removing household from storage:', error);
    }
  },

  // Device ID storage
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      
      if (!deviceId) {
        // Generate a new device ID if none exists
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID from storage:', error);
      // Fallback to a generated ID
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },

  // Auth token storage
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving auth token to storage:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token from storage:', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing auth token from storage:', error);
    }
  },

  // Clear specific data
  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.AUTH_TOKEN,
      ]);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  },

  async clearHousehold(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.HOUSEHOLD);
    } catch (error) {
      console.error('Error clearing household data:', error);
    }
  },

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.HOUSEHOLD,
        STORAGE_KEYS.AUTH_TOKEN,
        // Keep device ID as it should persist
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};