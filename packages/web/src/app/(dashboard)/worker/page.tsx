import { Suspense } from "react";
import { WorkerTabs } from "@/modules/worker/components/worker-tabs";
import { WorkerStatsRail } from "@/modules/worker/components/worker-stats-rail";
import { WorkerControlBanner } from "@/modules/worker/components/worker-control-banner";
import { getWorkerConfig } from "@/modules/worker/models";

function WorkerStatsRailSkeleton() {
  return (
    <div className="flex flex-col gap-3.5 animate-pulse">
      <div className="h-30 bg-white border border-[#e6ebf1] rounded-xl" />
      <div className="h-50 bg-white border border-[#e6ebf1] rounded-xl" />
      <div className="h-45 bg-white border border-[#e6ebf1] rounded-xl" />
    </div>
  );
}

export default async function WorkerPage() {
  const config = await getWorkerConfig();

  return (
    <div className="px-7 py-5 pb-10 overflow-auto">
      <WorkerControlBanner />
      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 320px" }}>
        <WorkerTabs config={config} />
        <Suspense fallback={<WorkerStatsRailSkeleton />}>
          <WorkerStatsRail />
        </Suspense>
      </div>
    </div>
  );
}
