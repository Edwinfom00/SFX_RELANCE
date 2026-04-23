export const REMINDER_SCHEDULE: Record<string, Array<{ reminderNumber: number; delayHours: number }>> = {
  AIR:  [{ reminderNumber: 1, delayHours: 24 }, { reminderNumber: 2, delayHours: 48 }, { reminderNumber: 3, delayHours: 72 }],
  SEA:  [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 }, { reminderNumber: 3, delayHours: 168 }],
  ROAD: [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 }, { reminderNumber: 3, delayHours: 168 }],
};
