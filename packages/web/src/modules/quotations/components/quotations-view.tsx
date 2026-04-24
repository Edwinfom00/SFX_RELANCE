import { Suspense } from "react";
import { getQuotations } from "../models";
import { QuotationsTable } from "./quotations-table";
import { QuotationsFilters } from "./quotations-filters";
import type { QuotationFilters } from "../types";

interface QuotationsViewProps {
  searchParams?: {
    status?: string;
    transportType?: string;
    search?: string;
  };
}

async function QuotationsList({ filters }: { filters: QuotationFilters }) {
  const quotations = await getQuotations(filters);
  return <QuotationsTable quotations={quotations as any} />;
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
    ...(searchParams.status && { status: searchParams.status as any }),
    ...(searchParams.transportType && { transportType: searchParams.transportType as any }),
    ...(searchParams.search && { search: searchParams.search }),
  };

  return (
    <div className="flex flex-col gap-3.5">
      <QuotationsFilters />
      <Suspense fallback={<QuotationsTableSkeleton />}>
        <QuotationsList filters={filters} />
      </Suspense>
    </div>
  );
}
