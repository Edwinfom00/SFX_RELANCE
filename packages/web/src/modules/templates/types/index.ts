import type { TransportType } from "@/modules/quotations/types";

export interface EmailTemplate {
  id: number;
  name: string;
  transportType: TransportType;
  reminderNumber: 1 | 2 | 3;
  subject: string;
  subjectEn: string;
  body: string;
  bodyEn: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
