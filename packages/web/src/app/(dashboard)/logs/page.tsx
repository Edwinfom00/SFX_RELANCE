import { Suspense } from "react";
import { LogsView } from "@/modules/logs/components/logs-view";

interface LogsPageProps {
  searchParams?: Promise<{ status?: string; page?: string }>;
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  return (
    <div className="px-7 py-6 pb-10">
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] m-0 text-[#0a2540]">Audit / Logs</h2>
        <p className="text-[13px] text-[#697386] mt-1">Historique complet des envois d'emails</p>
      </div>
      <Suspense>
        <LogsView searchParams={params} />
      </Suspense>
    </div>
  );
}
