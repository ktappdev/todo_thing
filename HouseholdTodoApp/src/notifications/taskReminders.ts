import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleLocalNotification, cancelNotification } from './notifications';
import { Platform } from 'react-native';

const STORAGE_KEY = 'household_todo_reminders_map';

export type ReminderPreset = 'NONE' | 'AT_DUE' | '5M_BEFORE' | '1H_BEFORE' | '1D_BEFORE';

interface ReminderMap {
  [taskId: string]: string; // notificationId
}

async function loadMap(): Promise<ReminderMap> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : {};
  } catch (e) {
    console.error('Failed to load reminder map', e);
    return {};
  }
}

async function saveMap(map: ReminderMap) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save reminder map', e);
  }
}

function computeDelaySeconds(dueDateISO: string, preset: ReminderPreset): number {
  const due = new Date(dueDateISO).getTime();
  let triggerMs = due;
  switch (preset) {
    case '5M_BEFORE':
      triggerMs -= 5 * 60 * 1000;
      break;
    case '1H_BEFORE':
      triggerMs -= 60 * 60 * 1000;
      break;
    case '1D_BEFORE':
      triggerMs -= 24 * 60 * 60 * 1000;
      break;
    case 'AT_DUE':
    default:
      break;
  }
  const delay = Math.max(0, Math.floor((triggerMs - Date.now()) / 1000));
  return delay;
}

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  dueDateISO: string | undefined,
  preset: ReminderPreset,
) {
  if (!dueDateISO || preset === 'NONE') return;
  const delaySeconds = computeDelaySeconds(dueDateISO, preset);
  if (delaySeconds <= 0) return; // Past time
  const notificationId = await scheduleLocalNotification(delaySeconds);
  const map = await loadMap();
  map[taskId] = notificationId;
  await saveMap(map);
}

export async function cancelTaskReminder(taskId: string) {
  const map = await loadMap();
  const id = map[taskId];
  if (id) {
    await cancelNotification(id);
    delete map[taskId];
    await saveMap(map);
  }
}
