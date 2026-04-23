import { z } from "zod";

export const cancelQuotationSchema = z.object({
  quotationId: z.number().int().positive(),
});

export const quotationFiltersSchema = z.object({
  status: z.enum(["ACTIVE", "CANCELLED", "COMPLETED"]).optional(),
  transportType: z.enum(["AIR", "SEA", "ROAD"]).optional(),
  search: z.string().optional(),
});

export type CancelQuotationInput = z.infer<typeof cancelQuotationSchema>;
export type QuotationFiltersInput = z.infer<typeof quotationFiltersSchema>;
