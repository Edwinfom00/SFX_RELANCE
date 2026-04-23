import prisma from "@/lib/prisma";
import type { LogFilters } from "../types";

export async function getLogs(filters: LogFilters = {}) {
  return prisma.emailLog.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.quotationId && { quotationId: filters.quotationId }),
    },
    include: {
      quotation: {
        select: { quotationId: true, clientCode: true, transportType: true },
      },
      template: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
