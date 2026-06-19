import prisma from "@/lib/prisma";
import type { OutgoingQuotationFilters } from "../types";

const PAGE_SIZE = 25;

export async function getOutgoingQuotations(filters: OutgoingQuotationFilters = {}, page = 1) {
  const where = {
    ...(filters.transportType && { transportType: filters.transportType }),
    ...(filters.search && {
      OR: [
        { noPiece:    { contains: filters.search } },
        { clientCode: { contains: filters.search } },
        { clientName: { contains: filters.search } },
        { dossierRef: { contains: filters.search } },
        { libelle:    { contains: filters.search } },
      ],
    }),
  };

  const [quotations, total] = await Promise.all([
    prisma.outgoingQuotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.outgoingQuotation.count({ where }),
  ]);

  return {
    quotations,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getOutgoingQuotationById(id: number) {
  return prisma.outgoingQuotation.findUnique({ where: { id } });
}
