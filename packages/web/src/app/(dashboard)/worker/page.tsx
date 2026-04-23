import { Suspense } from "react";
import { Play, Pause, RefreshCw } from "lucide-react";
import { SfxButton, Pill } from "@/components/sfx-ui";
import { WorkerTabs } from "@/modules/worker/components/worker-tabs";
import { WorkerStatsRail } from "@/modules/worker/components/worker-stats-rail";
import { getWorkerConfig } from "@/modules/worker/models";

function WorkerStatsRailSkeleton() {
  return (
    <div className="flex flex-col gap-3.5 animate-pulse">
      <div className="h-[120px] bg-white border border-[#e6ebf1] rounded-xl" />
      <div className="h-[200px] bg-white border border-[#e6ebf1] rounded-xl" />
      <div className="h-[180px] bg-white border border-[#e6ebf1] rounded-xl" />
    </div>
  );
}

export default async function WorkerPage() {
  const config = await getWorkerConfig();

  return (
    <div className="px-7 py-5 pb-10 overflow-auto">
      {/* Status banner */}
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-xl mb-5 sfx-shadow-sm"
        style={{
          background: "linear-gradient(90deg, #fff 0%, #f2f6ff 100%)",
          border: "1px solid #e7efff",
        }}
      >
        <div className="relative w-11 h-11 rounded-[10px] bg-white flex items-center justify-center text-[#0e9f6e] sfx-shadow-sm shrink-0">
          <Play className="h-[18px] w-[18px]" strokeWidth={2.25} />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#0e9f6e] rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[#0a2540] tracking-[-0.01em]">
              Worker Windows Service · sfx-relance-worker
            </span>
            <Pill tone="green">En ligne</Pill>
            <Pill tone="neutral">v1.4.2</Pill>
          </div>
          <div className="text-[12.5px] text-[#697386] mt-0.5">
            Hôte :{" "}
            <span className="font-mono text-[#0a2540]">srv-prod-01.sfx.local</span>
            <span className="mx-2 text-[#8898aa]">·</span>
            Intervalle :{" "}
            <span className="font-mono text-[#0a2540]">{config.intervalMinutes} min</span>
            <span className="mx-2 text-[#8898aa]">·</span>
            Plage :{" "}
            <span className="font-mono text-[#0a2540]">
              {String(config.sendWindowStart).padStart(2, "0")}h–{String(config.sendWindowEnd).padStart(2, "0")}h
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <SfxButton variant="secondary" size="sm" icon={Pause}>Mettre en pause</SfxButton>
          <SfxButton variant="secondary" size="sm" icon={RefreshCw}>Redémarrer</SfxButton>
          <SfxButton variant="primary" size="sm" icon={Play}>Exécuter maintenant</SfxButton>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Left: tabs + forms */}
        <WorkerTabs config={config} />

        {/* Right: live stats */}
        <Suspense fallback={<WorkerStatsRailSkeleton />}>
          <WorkerStatsRail />
        </Suspense>
      </div>
    </div>
  );
}
