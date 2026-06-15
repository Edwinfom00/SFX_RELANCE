import prisma from "@/lib/prisma";
import type { QuotationFilters } from "../types";

const PAGE_SIZE = 25;

export async function getQuotations(filters: QuotationFilters = {}, page = 1) {
  const where = {
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
  };

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.quotation.count({ where }),
  ]);

  return {
    quotations,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.ceil(total / PAGE_SIZE),
  };
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
