import prisma from "@/lib/prisma";
import type { QuotationFilters } from "../types";

export async function getQuotations(filters: QuotationFilters = {}) {
  return prisma.quotation.findMany({
    where: {
      ...(filters.status        && { status: filters.status }),
      ...(filters.transportType && { transportType: filters.transportType }),
      ...(filters.reminder !== undefined && { currentReminder: filters.reminder }),
      ...(filters.search && {
        OR: [
          { quotationId: { contains: filters.search } },
          { clientCode:  { contains: filters.search } },
          { clientEmail: { contains: filters.search } },
          { libelle:     { contains: filters.search } },
        ],
      }),
      ...((filters.dateFrom || filters.dateTo) && {
        transmissionDate: {
          ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
          ...(filters.dateTo   && { lte: new Date(filters.dateTo + "T23:59:59") }),
        },
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
