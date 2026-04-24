import type { ReminderConfig } from "../types";

export const REMINDER_SCHEDULE: ReminderConfig = {
  AIR:  [{ reminderNumber: 1, delayHours: 24 }, { reminderNumber: 2, delayHours: 48 },  { reminderNumber: 3, delayHours: 72  }],
  SEA:  [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 },  { reminderNumber: 3, delayHours: 168 }],
  ROAD: [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 },  { reminderNumber: 3, delayHours: 168 }],
};

export const WORKER_INTERVAL_MS = 30 * 60 * 1000;
export const MAX_RETRY = 1;
