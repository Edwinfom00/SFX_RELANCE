import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Check, X, RefreshCw } from "lucide-react";
import { SfxCard, Pill, TransportBadge } from "@/components/sfx-ui";
import prisma from "@/lib/prisma";

async function getRecentLogs() {
  return prisma.emailLog.findMany({
    where: { status: { in: ["SENT", "FAILED"] } },
    include: {
      quotation: { select: { quotationId: true, clientCode: true, transportType: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

async function getUpcomingReminders() {
  return prisma.quotation.findMany({
    where: { status: "ACTIVE", nextReminderAt: { not: null } },
    orderBy: { nextReminderAt: "asc" },
    take: 5,
  });
}

function timeAgo(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

function formatCountdown(date: Date) {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "maintenant";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const transportTypeLabel: Record<string, string> = {
  AIR: "Aérien",
  SEA: "Maritime",
  ROAD: "Route",
};

export async function RecentActivity() {
  const [recentLogs, upcoming] = await Promise.all([getRecentLogs(), getUpcomingReminders()]);

  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
      {/* Activity feed */}
      <SfxCard padding={false}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
          <div>
            <div className="text-sm font-semibold text-[#0a2540] tracking-tight">Activité récente</div>
            <div className="text-xs text-[#697386] mt-0.5">Évènements du worker · temps réel</div>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-[#0e9f6e] font-semibold">
            <span className="w-1.5 h-1.5 bg-[#0e9f6e] rounded-full" style={{ boxShadow: "0 0 0 2.5px #defbe6" }} />
            LIVE
          </div>
        </div>

        {/* Rows */}
        {recentLogs.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[#8898aa]">Aucune activité récente</div>
        ) : (
          recentLogs.map((log, i) => {
            const isSent = log.status === "SENT";
            const isFailed = log.status === "FAILED";
            return (
              <div
                key={log.id}
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: i < recentLogs.length - 1 ? "1px solid #e6ebf1" : "none" }}
              >
                <div
                  className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0"
                  style={{
                    background: isFailed ? "#ffe1e6" : "#e7efff",
                    color: isFailed ? "#cd3d64" : "#0057ff",
                  }}
                >
                  {isFailed ? <X className="h-3.5 w-3.5" strokeWidth={2} /> : <Send className="h-3.5 w-3.5" strokeWidth={2} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-[550] text-[#0a2540]">
                    {isFailed ? "Bounce détecté" : `Relance #${log.reminderNumber} envoyée`}
                  </div>
                  <div className="text-[12px] text-[#697386] mt-px">
                    {log.quotation?.quotationId ?? `#${log.quotationId}`}
                    {log.quotation?.clientCode && ` · ${log.quotation.clientCode}`}
                    {log.quotation?.transportType && ` · ${transportTypeLabel[log.quotation.transportType] ?? log.quotation.transportType}`}
                  </div>
                </div>
                {log.quotation?.transportType && (
                  <TransportBadge type={log.quotation.transportType} />
                )}
                <span className="text-[11px] text-[#8898aa] font-mono min-w-[68px] text-right">
                  {timeAgo(new Date(log.createdAt))}
                </span>
              </div>
            );
          })
        )}
      </SfxCard>

      {/* Queue */}
      <SfxCard padding={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
          <div>
            <div className="text-sm font-semibold text-[#0a2540] tracking-tight">File d'attente</div>
            <div className="text-xs text-[#697386] mt-0.5">Prochaines relances programmées</div>
          </div>
          <Pill tone="blue">{upcoming.length} en attente</Pill>
        </div>

        <div className="px-3 py-3.5 flex flex-col gap-1">
          {upcoming.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#8898aa]">Aucune relance planifiée</div>
          ) : (
            upcoming.map((q, i) => (
              <div
                key={q.id}
                className="flex items-center gap-3 px-2 py-2.5 rounded-[7px]"
                style={{
                  background: i === 0 ? "#f2f6ff" : "transparent",
                  border: i === 0 ? "1px solid #e7efff" : "1px solid transparent",
                }}
              >
                <div
                  className="min-w-[64px] text-[12px] font-mono font-semibold tabular-nums"
                  style={{ color: i === 0 ? "#0057ff" : "#0a2540" }}
                >
                  {q.nextReminderAt ? formatCountdown(new Date(q.nextReminderAt)) : "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-[550] text-[#0a2540]">{q.clientCode}</div>
                  <div className="text-[11px] text-[#697386] font-mono">
                    {q.quotationId} · Relance #{q.currentReminder + 1}
                  </div>
                </div>
                <TransportBadge type={q.transportType} />
              </div>
            ))
          )}
        </div>
      </SfxCard>
    </div>
  );
}
