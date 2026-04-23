export type EmailStatus = "PENDING" | "SENT" | "FAILED" | "RETRIED";

export interface EmailLog {
  id: number;
  quotationId: number;
  reminderNumber: number;
  sentAt: Date | null;
  status: EmailStatus;
  retryCount: number;
  templateId: number;
  recipientEmail: string;
  errorMessage: string | null;
  createdAt: Date;
  quotation?: {
    quotationId: string;
    clientCode: string;
    transportType: string;
  };
}

export interface LogFilters {
  status?: EmailStatus;
  quotationId?: number;
}
