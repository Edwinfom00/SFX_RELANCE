export const TransportType = {
  AIR: "AIR",
  SEA: "SEA",
  ROAD: "ROAD",
} as const;
export type TransportType = (typeof TransportType)[keyof typeof TransportType];

export const QuotationStatus = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;
export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export const EmailStatus = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
  RETRIED: "RETRIED",
} as const;
export type EmailStatus = (typeof EmailStatus)[keyof typeof EmailStatus];

export interface ReminderSchedule {
  reminderNumber: 1 | 2 | 3;
  delayHours: number;
}

export interface ReminderConfig {
  [key: string]: ReminderSchedule[];
}
