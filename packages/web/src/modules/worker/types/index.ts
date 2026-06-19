export interface ReminderScheduleEntry {
  reminderNumber: 1 | 2 | 3;
  delayHours: number;
}

export interface WorkerConfig {
  id: number;
  syncSource: "DB" | "EXCEL";
  intervalMinutes: number;
  intervalR1: number;
  intervalR2: number;
  intervalR3: number;
  sendWindowStart: number;
  sendWindowEnd: number;
  activeDays: number[];
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
  totalCompleted: number;  // client a répondu
  totalClosed: number;     // 3 relances sans réponse
  emailsSentToday: number;
  emailsFailedTotal: number;
  pendingReminders: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
}
