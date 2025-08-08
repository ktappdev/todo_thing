import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure foreground notification display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permissions from the user.
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/**
 * Ensure an Android notification channel exists.
 */
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/**
 * Schedules a local notification after `delaySeconds` seconds.
 * If delaySeconds is 0, sends immediately.
 */
export async function scheduleLocalNotification(delaySeconds = 0) {
  const granted = await requestNotificationPermission();
  if (!granted) {
    throw new Error('Notification permission not granted');
  }
  await ensureAndroidChannel();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Household Todo',
      body: delaySeconds
        ? `⏰ Reminder (in ${delaySeconds}s)`
        : '🔔 Test notification!',
      sound: 'default',
    },
    trigger: delaySeconds ? { seconds: delaySeconds } : null,
  });
  return id;
}

/**
 * Cancels a scheduled notification by ID.
 */
export function cancelNotification(id: string) {
  return Notifications.cancelScheduledNotificationAsync(id);
}
