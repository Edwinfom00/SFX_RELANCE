import prisma from "@/lib/prisma";
import type { LogFilters } from "../types";

const PAGE_SIZE = 25;

export async function getLogs(filters: LogFilters = {}, page = 1) {
  const where = {
    ...(filters.status     && { status:      filters.status }),
    ...(filters.quotationId && { quotationId: filters.quotationId }),
  };

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      include: {
        quotation: { select: { quotationId: true, clientCode: true, transportType: true } },
        template:  { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * PAGE_SIZE,
      take:  PAGE_SIZE,
    }),
    prisma.emailLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.ceil(total / PAGE_SIZE),
  };
}
