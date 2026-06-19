import type { TransportType } from "@/modules/quotations/types";

export type TemplateCategory = "REMINDER" | "TRANSMISSION";

export interface EmailTemplate {
  id:             number;
  name:           string;
  transportType:  TransportType;
  reminderNumber: number;
  category:       TemplateCategory;
  subject:        string;
  subjectEn:      string;
  body:           string;
  bodyEn:         string;
  isActive:       boolean;
  createdAt:      Date;
  updatedAt:      Date;
}
