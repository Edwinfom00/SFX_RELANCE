export interface ReminderScheduleEntry {
  reminderNumber: 1 | 2 | 3;
  delayHours: number;
}

export interface WorkerConfig {
  id: number;
  intervalMinutes: number;
  sendWindowStart: number;
  sendWindowEnd: number;
  activeDays: number[]; // 1=lundi … 7=dimanche
  sendDelaySeconds: number;
  cadenceAir: ReminderScheduleEntry[];
  cadenceSea: ReminderScheduleEntry[];
  cadenceRoad: ReminderScheduleEntry[];
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  timezone: string;
  updatedAt: Date;
}

export interface WorkerStats {
  totalActive: number;
  totalCompleted: number;
  emailsSentToday: number;
  emailsFailedTotal: number;
  pendingReminders: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
}
