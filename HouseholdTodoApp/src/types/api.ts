export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'ios' | 'android';
  appVersion: string;
}

export interface InviteQRData {
  type: 'household_invite';
  code: string;
  name: string;
  memberCount: number;
}
