import { OutgoingQuotationsView } from "@/modules/outgoing-quotations/components/outgoing-quotations-view";

interface PageProps {
  searchParams?: Promise<{
    transportType?: string;
    search?:        string;
    page?:          string;
  }>;
}

export default async function OutgoingQuotationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <div className="px-6 py-6 max-w-[1280px] mx-auto">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-semibold text-[#0a2540] tracking-[-0.02em]">
          Cotations à transmettre
        </h1>
        <p className="text-[13px] text-[#697386] mt-0.5">
          Cotations validées et approuvées en attente de transmission au client via email.
        </p>
      </div>

      <OutgoingQuotationsView searchParams={params} />
    </div>
  );
}
