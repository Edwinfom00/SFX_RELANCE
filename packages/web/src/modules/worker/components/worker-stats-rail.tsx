import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SfxCard } from "@/components/sfx-ui";
import { Sparkline } from "@/components/sfx-charts";
import { getWorkerStats, getRecentWorkerLogs } from "../models";

export async function WorkerStatsRail() {
  const [stats, logs] = await Promise.all([
    getWorkerStats(),
    getRecentWorkerLogs(12),
  ]);

  const lastRunAt = stats.lastRunAt;
  const cpuData = [1.2, 2.1, 1.8, 4.5, 2.3, 1.9, 2.0, 3.2, 2.8, 2.4, 2.5, 2.4];

  const statRows = [
    { l: "Cotations actives",    v: String(stats.totalActive),       color: undefined },
    { l: "Cotations terminées",  v: String(stats.totalCompleted),     color: undefined },
    { l: "Relances envoyées (aujourd'hui)", v: String(stats.emailsSentToday), color: undefined },
    { l: "Clients ayant répondu", v: String(stats.totalCompleted),   color: "#0e9f6e" },
    { l: "Erreurs totales",      v: String(stats.emailsFailedTotal),  color: stats.emailsFailedTotal > 0 ? "#cd3d64" : "#0e9f6e" },
  ];

  // Build log lines for the terminal
  const logLines = logs.slice(0, 6).map((log) => {
    const ts = new Date(log.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const qid = log.quotation?.quotationId ?? `#${log.quotationId}`;
    if (log.status === "SENT") return { ts, text: `mail.send ${qid} ok`, color: undefined };
    if (log.status === "FAILED") return { ts, text: `mail.send ${qid} FAILED`, color: "#cd3d64" };
    return { ts, text: `scan.tick · ${qid}`, color: undefined };
  });

  return (
    <div className="flex flex-col gap-3.5">
      {/* Next run */}
      <SfxCard className="p-4.5">
        <div className="text-[12px] font-semibold text-[#697386] tracking-[0.04em] uppercase mb-2.5">
          Dernière exécution
        </div>
        <div className="text-[22px] font-semibold text-[#0a2540] tracking-[-0.03em] font-mono tabular-nums">
          {lastRunAt
            ? formatDistanceToNow(new Date(lastRunAt), { addSuffix: true, locale: fr })
            : "Jamais"}
        </div>
        <div className="text-[12px] text-[#697386] mt-1">
          {lastRunAt
            ? new Date(lastRunAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
            : "Aucune exécution enregistrée"}
        </div>
        <div className="mt-3.5 h-1 bg-[#e6ebf1] rounded-full overflow-hidden">
          <div className="w-[62%] h-full bg-[#0057ff] rounded-full" />
        </div>
      </SfxCard>

      {/* Stats */}
      <SfxCard className="p-4.5">
        <div className="text-[12px] font-semibold text-[#697386] tracking-[0.04em] uppercase mb-3">
          Statistiques globales
        </div>
        {statRows.map((s) => (
          <div key={s.l} className="flex justify-between items-center py-1.75 border-t border-[#e6ebf1]">
            <span className="text-[12.5px] text-[#425466]">{s.l}</span>
            <span
              className="text-[13px] font-semibold font-mono tabular-nums"
              style={{ color: s.color ?? "#0a2540" }}
            >
              {s.v}
            </span>
          </div>
        ))}
      </SfxCard>

      {/* CPU + logs */}
      <SfxCard className="p-4.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[12px] font-semibold text-[#697386] tracking-[0.04em] uppercase">
            Activité récente
          </div>
          <span className="text-[12px] font-semibold text-[#0a2540] font-mono">
            {stats.emailsSentToday} envois
          </span>
        </div>
        <Sparkline
          data={cpuData}
          color="#0057ff"
          w={272}
          h={48}
        />
        <div
          className="mt-3 p-2.5 rounded-lg text-[11.5px] text-[#425466] font-mono leading-[1.6]"
          style={{ background: "#f6f8fa", border: "1px solid #e6ebf1" }}
        >
          {logLines.length === 0 ? (
            <span className="text-[#8898aa]">Aucun log disponible</span>
          ) : (
            logLines.map((line, i) => (
              <div key={i}>
                <span className="text-[#8898aa]">[{line.ts}]</span>{" "}
                <span style={{ color: line.color ?? "#425466" }}>{line.text}</span>
              </div>
            ))
          )}
        </div>
      </SfxCard>
    </div>
  );
}
