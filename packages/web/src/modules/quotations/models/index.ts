import prisma from "@/lib/prisma";
import type { QuotationFilters } from "../types";

export async function getQuotations(filters: QuotationFilters = {}) {
  return prisma.quotation.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.transportType && { transportType: filters.transportType }),
      ...(filters.search && {
        OR: [
          { quotationId: { contains: filters.search } },
          { clientCode: { contains: filters.search } },
          { clientEmail: { contains: filters.search } },
        ],
      }),
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getQuotationById(id: number) {
  return prisma.quotation.findUnique({ where: { id } });
}

export async function cancelQuotation(id: number, userId: number) {
  return prisma.quotation.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledById: userId,
      cancelledAt: new Date(),
      nextReminderAt: null,
    },
  });
}
