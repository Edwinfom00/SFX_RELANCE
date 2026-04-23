import { QuotationsView } from "@/modules/quotations/components/quotations-view";

interface QuotationsPageProps {
  searchParams?: Promise<{
    status?: string;
    transportType?: string;
    search?: string;
  }>;
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const params = await searchParams;
  return (
    <div className="px-7 py-6 pb-10">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] m-0 text-[#0a2540]">Cotations</h2>
          <p className="text-[13px] text-[#697386] mt-1">Suivi des relances en cours</p>
        </div>
      </div>
      <QuotationsView searchParams={params} />
    </div>
  );
}
