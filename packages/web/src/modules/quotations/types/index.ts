export type TransportType = "AIR" | "SEA" | "ROAD";
export type QuotationStatus = "ACTIVE" | "CANCELLED" | "COMPLETED";

export interface Quotation {
  id: number;
  quotationId: string;
  clientCode: string;
  clientEmail: string;
  libelle: string;
  transmissionDate: Date;
  transportType: TransportType;
  status: QuotationStatus;
  currentReminder: number;
  nextReminderAt: Date | null;
  cancelledById: number | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotationFilters {
  status?: QuotationStatus;
  transportType?: TransportType;
  search?: string;
}
