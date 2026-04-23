import prisma from "@/lib/prisma";
import Link from "next/link";

async function getWorkerStatus() {
  const [config, pendingCount, lastLog] = await Promise.all([
    prisma.workerConfig.findFirst({
      select: { intervalMinutes: true, sendWindowStart: true, sendWindowEnd: true },
    }),
    prisma.quotation.count({ where: { status: "ACTIVE", nextReminderAt: { lte: new Date() } } }),
    prisma.emailLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true },
    }),
  ]);

  const intervalMinutes = config?.intervalMinutes ?? 30;
  const intervalSeconds = intervalMinutes * 60;

  // Temps restant = combien de secondes avant le prochain tick
  // On calcule la position dans le cycle courant via modulo
  let nextInSeconds = intervalSeconds;
  if (lastLog?.createdAt) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(lastLog.createdAt).getTime()) / 1000);
    // Position dans le cycle courant (modulo pour gérer les cycles multiples)
    const positionInCycle = elapsedSeconds % intervalSeconds;
    nextInSeconds = intervalSeconds - positionInCycle;
  }

  const mm = Math.floor(nextInSeconds / 60);
  const ss = nextInSeconds % 60;
  const nextLabel = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  // Progression = position dans le cycle courant (0 = début, 100 = fin)
  const progress = lastLog?.createdAt
    ? Math.floor(((intervalSeconds - nextInSeconds) / intervalSeconds) * 100)
    : 0;

  const isActive = true; // Le worker tourne en tant que service séparé

  return { nextLabel, progress, pendingCount, intervalMinutes, isActive };
}

export async function WorkerStatusCard() {
  const { nextLabel, progress, pendingCount, isActive } = await getWorkerStatus();

  return (
    <Link href="/worker" className="block mx-3.5 mb-3.5 no-underline">
      <div className="p-3 bg-white border border-[#e6ebf1] rounded-[9px] hover:border-[#0057ff]/30 transition-colors cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.75 h-1.75 rounded-full"
              style={{
                background: isActive ? "#0e9f6e" : "#cd3d64",
                boxShadow: isActive ? "0 0 0 3px #defbe6" : "0 0 0 3px #ffe1e6",
              }}
            />
            <span className="text-xs font-semibold text-[#0a2540]">
              {isActive ? "Worker actif" : "Worker inactif"}
            </span>
          </div>
        </div>
        {pendingCount > 0 && (
            <span className="text-[10px] font-semibold text-[#c28b00] bg-[#fff3d6] px-1.5 py-0.5 rounded-full">
              {pendingCount} due{pendingCount > 1 ? "s" : ""}
            </span>
          )}
        <div className="text-[11px] text-[#697386] leading-[1.45]">
          Prochaine exécution dans{" "}
          <b className="text-[#0a2540] font-mono tabular-nums">{nextLabel}</b>
        </div>
        <div className="mt-2 h-0.75 bg-[#e6ebf1] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: isActive ? "#0e9f6e" : "#cd3d64",
            }}
          />
        </div>
      </div>
    </Link>
  );
}
