import { useEffect } from 'react';
import { Task } from '../types/task';
import {
  scheduleTaskReminder,
  cancelTaskReminder,
  ReminderPreset,
} from '../notifications/taskReminders';

/**
 * Hook that keeps local reminders in sync with the latest tasks list.
 * MVP: schedules an "AT_DUE" reminder for every incomplete task that has a future dueDate.
 * If the task is completed or removed, the reminder is cancelled.
 */
export default function useTaskReminders(tasks: Task[]) {
  useEffect(() => {
    const sync = async () => {
      const upcomingTasks = tasks.filter(
        (t) => !t.completed && t.dueDate && new Date(t.dueDate).getTime() > Date.now()
      );
      // Schedule reminders for upcoming tasks
      await Promise.all(
        upcomingTasks.map((t) =>
          scheduleTaskReminder(t.id, t.title, t.dueDate!, 'AT_DUE' as ReminderPreset)
        )
      );

      // Cancel reminders for tasks that are completed or no longer due
      const completedOrPast = tasks.filter(
        (t) =>
          !t.dueDate ||
          t.completed ||
          new Date(t.dueDate).getTime() <= Date.now()
      );
      await Promise.all(completedOrPast.map((t) => cancelTaskReminder(t.id)));
    };

    sync();
  }, [tasks]);
}
