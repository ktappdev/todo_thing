export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  deviceId: string;
  householdId: string;
  createdAt: string;
  updatedAt: string;
  lastSeen?: string;
  isActive: boolean;
}

export interface CreateHouseholdRequest {
  name: string;
}

export interface JoinHouseholdRequest {
  name: string;
  deviceId: string;
}