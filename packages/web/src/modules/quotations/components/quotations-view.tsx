import { Suspense } from "react";
import { getQuotations } from "../models";
import { QuotationsTable } from "./quotations-table";
import { QuotationsFilters } from "./quotations-filters";
import { SfxPagination } from "@/components/sfx-pagination";
import type { QuotationFilters } from "../types";

interface QuotationsViewProps {
  searchParams?: {
    status?: string;
    transportType?: string;
    search?: string;
    reminder?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  };
}

async function QuotationsList({ filters, page }: { filters: QuotationFilters; page: number }) {
  const { quotations, total, pageCount, pageSize } = await getQuotations(filters, page);
  return (
    <>
      <QuotationsTable
        quotations={quotations as any}
        page={page}
        pageSize={pageSize}
        total={total}
      />
      {pageCount > 1 && (
        <SfxPagination page={page} pageCount={pageCount} />
      )}
    </>
  );
}

function QuotationsTableSkeleton() {
  return (
    <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden sfx-shadow-sm animate-pulse">
      <div className="h-11 bg-[#fafbfc] border-b border-[#e6ebf1]" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14.5 border-b border-[#e6ebf1] last:border-0" />
      ))}
    </div>
  );
}

export function QuotationsView({ searchParams = {} }: QuotationsViewProps) {
  const filters: QuotationFilters = {
    ...(searchParams.status        && { status:        searchParams.status as any }),
    ...(searchParams.transportType && { transportType: searchParams.transportType as any }),
    ...(searchParams.search        && { search:        searchParams.search }),
    ...(searchParams.reminder      && { reminder:      Number(searchParams.reminder) }),
    ...(searchParams.dateFrom      && { dateFrom:      searchParams.dateFrom }),
    ...(searchParams.dateTo        && { dateTo:        searchParams.dateTo }),
  };

  const page = Math.max(1, Number(searchParams.page ?? 1));

  return (
    <div className="flex flex-col gap-3.5">
      <QuotationsFilters />
      <Suspense fallback={<QuotationsTableSkeleton />}>
        <QuotationsList filters={filters} page={page} />
      </Suspense>
    </div>
  );
}
