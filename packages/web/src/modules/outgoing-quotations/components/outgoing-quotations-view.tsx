import { Suspense } from "react";
import { getOutgoingQuotations } from "../models";
import { OutgoingQuotationsTable } from "./outgoing-quotations-table";
import { OutgoingQuotationsFilters } from "./outgoing-quotations-filters";
import { SfxPagination } from "@/components/sfx-pagination";
import type { OutgoingQuotationFilters } from "../types";

interface OutgoingQuotationsViewProps {
  searchParams?: {
    transportType?: string;
    search?:        string;
    page?:          string;
  };
}

async function OutgoingList({ filters, page }: { filters: OutgoingQuotationFilters; page: number }) {
  const { quotations, total, pageCount, pageSize } = await getOutgoingQuotations(filters, page);
  return (
    <>
      <OutgoingQuotationsTable
        quotations={quotations as any}
        page={page}
        pageSize={pageSize}
        total={total}
      />
      {pageCount > 1 && <SfxPagination page={page} pageCount={pageCount} />}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden sfx-shadow-sm animate-pulse">
      <div className="h-11 bg-[#fafbfc] border-b border-[#e6ebf1]" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 border-b border-[#e6ebf1] last:border-0" />
      ))}
    </div>
  );
}

export function OutgoingQuotationsView({ searchParams = {} }: OutgoingQuotationsViewProps) {
  const filters: OutgoingQuotationFilters = {
    ...(searchParams.transportType && { transportType: searchParams.transportType }),
    ...(searchParams.search        && { search:        searchParams.search }),
  };
  const page = Math.max(1, Number(searchParams.page ?? 1));

  return (
    <div className="flex flex-col gap-3.5">
      <OutgoingQuotationsFilters />
      <Suspense fallback={<TableSkeleton />}>
        <OutgoingList filters={filters} page={page} />
      </Suspense>
    </div>
  );
}
