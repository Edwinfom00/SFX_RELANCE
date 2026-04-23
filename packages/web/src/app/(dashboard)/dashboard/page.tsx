import { Suspense } from "react";
import { DashboardView } from "@/modules/dashboard/components/dashboard-view";
import { DashboardSkeleton } from "@/modules/dashboard/components/dashboard-skeleton";
import { DashboardGreeting } from "@/modules/dashboard/components/dashboard-greeting";
import { RefreshCw, Calendar } from "lucide-react";
import { SfxButton } from "@/components/sfx-ui";
import { PeriodSelector } from "@/modules/dashboard/components/period-selector";

type Period = "1" | "7" | "30" | "90";

interface DashboardPageProps {
  searchParams?: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const period = (["1", "7", "30", "90"].includes(params?.period ?? "") ? params!.period : "30") as Period;

  const now = new Date();
  const monthLabel = now.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });

  return (
    <div className="px-7 py-6 pb-10">
      {/* Greeting row */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <DashboardGreeting />
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] m-0 text-[#0a2540]">
            Vue d'ensemble
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <PeriodSelector current={period} />
          <SfxButton variant="secondary" size="sm" icon={Calendar}>
            {monthLabel}
          </SfxButton>
          <SfxButton variant="primary" size="sm" icon={RefreshCw}>
            Exécuter maintenant
          </SfxButton>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardView period={Number(period)} />
      </Suspense>
    </div>
  );
}
