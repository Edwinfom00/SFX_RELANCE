import { Send, Clock, TrendingUp, X } from "lucide-react";
import { Sparkline } from "@/components/sfx-charts";
import { SfxCard } from "@/components/sfx-ui";
import { getDashboardStats } from "../models";

const PERIOD_LABEL: Record<number, string> = {
  1: "24h", 7: "7j", 30: "30j", 90: "90j",
};

interface KPICardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaDir?: "up" | "down";
  sparkData?: number[];
  sparkColor?: string;
  icon: React.ElementType;
  iconBg: string;
  iconFg: string;
  periodLabel: string;
}

function KPICard({
  label, value, delta, deltaDir = "up",
  sparkData, sparkColor = "#0057ff",
  icon: Icon, iconBg, iconFg, periodLabel,
}: KPICardProps) {
  return (
    <SfxCard padding={false} className="p-4.5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
            style={{ background: iconBg, color: iconFg }}>
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
          <span className="text-[12.5px] text-[#425466] font-[550]">{label}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2.5">
        <div>
          <div className="text-[28px] font-semibold tracking-tight text-[#0a2540] leading-none font-mono tabular-nums">
            {value}
          </div>
          {delta && (
            <div className="text-[12px] mt-1.5 flex items-center gap-1 font-semibold"
              style={{ color: deltaDir === "up" ? "#0e9f6e" : "#cd3d64" }}>
              {deltaDir === "up" ? "↑" : "↓"} {delta}
              <span className="text-[#8898aa] font-medium ml-0.5">vs. {periodLabel}</span>
            </div>
          )}
        </div>
        {sparkData && <Sparkline data={sparkData} color={sparkColor} w={90} h={36} />}
      </div>
    </SfxCard>
  );
}

export async function DashboardStats({ period = 30 }: { period?: number; stats?: any }) {
  // Période courante et période précédente pour calculer les deltas
  const [current, previous] = await Promise.all([
    getDashboardStats(period),
    getDashboardStats(period * 2), // double la fenêtre = période précédente incluse
  ]);

  // Delta = différence entre la période courante et la précédente
  const prevSent = previous.emailsSentToday - current.emailsSentToday;
  const prevFailed = previous.emailsFailed - current.emailsFailed;

  function pctDelta(curr: number, prev: number): string | undefined {
    if (prev === 0) return undefined;
    const pct = Math.round(((curr - prev) / prev) * 100);
    return `${pct > 0 ? "+" : ""}${pct}%`;
  }

  const sentDelta = pctDelta(current.emailsSentToday, prevSent);
  const failedDelta = pctDelta(current.emailsFailed, prevFailed);

  // Taux de réponse = completed / (active + completed)
  const totalTracked = current.totalActive + current.totalCompleted;
  const responseRate = totalTracked > 0
    ? `${Math.round((current.totalCompleted / totalTracked) * 100)}%`
    : "—";

  const periodLabel = PERIOD_LABEL[period] ?? `${period}j`;

  return (
    <div className="grid grid-cols-4 gap-3.5">
      <KPICard
        label="Relances envoyées"
        value={current.emailsSentToday}
        delta={sentDelta}
        deltaDir={current.emailsSentToday >= prevSent ? "up" : "down"}
        sparkColor="#0057ff"
        icon={Send}
        iconBg="#e7efff"
        iconFg="#0057ff"
        periodLabel={periodLabel}
      />
      <KPICard
        label="En attente de réponse"
        value={current.totalActive}
        sparkColor="#c28b00"
        icon={Clock}
        iconBg="#fff3d6"
        iconFg="#c28b00"
        periodLabel={periodLabel}
      />
      <KPICard
        label="Taux de réponse"
        value={responseRate}
        sparkColor="#0e9f6e"
        icon={TrendingUp}
        iconBg="#defbe6"
        iconFg="#0e9f6e"
        periodLabel={periodLabel}
      />
      <KPICard
        label="Erreurs / bounces"
        value={current.emailsFailed}
        delta={failedDelta}
        deltaDir={current.emailsFailed <= prevFailed ? "down" : "up"}
        sparkColor="#cd3d64"
        icon={X}
        iconBg="#ffe1e6"
        iconFg="#cd3d64"
        periodLabel={periodLabel}
      />
    </div>
  );
}
