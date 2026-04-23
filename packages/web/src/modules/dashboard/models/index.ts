import prisma from "@/lib/prisma";

export async function getDashboardStats(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [totalActive, totalCompleted, totalCancelled, emailsSentPeriod, emailsFailed, pendingReminders] =
    await Promise.all([
      prisma.quotation.count({ where: { status: "ACTIVE" } }),
      prisma.quotation.count({ where: { status: "COMPLETED" } }),
      prisma.quotation.count({ where: { status: "CANCELLED" } }),
      prisma.emailLog.count({ where: { status: "SENT", sentAt: { gte: since } } }),
      prisma.emailLog.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
      prisma.quotation.count({ where: { status: "ACTIVE", nextReminderAt: { lte: new Date() } } }),
    ]);

  return { totalActive, totalCompleted, totalCancelled, emailsSentToday: emailsSentPeriod, emailsFailed, pendingReminders };
}

/** Activité jour par jour sur la période */
export async function getDailyActivity(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [sentLogs, completedQuotations] = await Promise.all([
    prisma.emailLog.findMany({
      where: { status: "SENT", sentAt: { gte: since } },
      select: { sentAt: true },
    }),
    prisma.quotation.findMany({
      where: { status: "COMPLETED", updatedAt: { gte: since } },
      select: { updatedAt: true },
    }),
  ]);

  const sentByDay = new Array(days).fill(0);
  const completedByDay = new Array(days).fill(0);
  const now = Date.now();

  for (const log of sentLogs) {
    if (!log.sentAt) continue;
    const daysAgo = Math.floor((now - new Date(log.sentAt).getTime()) / 86400000);
    const idx = (days - 1) - daysAgo;
    if (idx >= 0 && idx < days) sentByDay[idx]++;
  }
  for (const q of completedQuotations) {
    const daysAgo = Math.floor((now - new Date(q.updatedAt).getTime()) / 86400000);
    const idx = (days - 1) - daysAgo;
    if (idx >= 0 && idx < days) completedByDay[idx]++;
  }

  // Sous-échantillonner pour le graphe (~10 points max)
  const step = Math.max(1, Math.floor(days / 10));
  const sampledSent = sentByDay.filter((_, i) => i % step === 0);
  const sampledCompleted = completedByDay.filter((_, i) => i % step === 0);
  const labels = sampledSent.map((_, i) => String(i * step + 1));

  return {
    sentByDay: sampledSent,
    completedByDay: sampledCompleted,
    totalSent: sentLogs.length,
    totalCompleted: completedQuotations.length,
    labels,
  };
}

/** Répartition des cotations actives par type de transport */
export async function getTransportBreakdown() {
  const rows = await prisma.quotation.groupBy({
    by: ["transportType"],
    where: { status: "ACTIVE" },
    _count: { id: true },
  });

  const map: Record<string, number> = { AIR: 0, SEA: 0, ROAD: 0 };
  for (const r of rows) map[r.transportType] = r._count.id;
  const total = Object.values(map).reduce((a, b) => a + b, 0);

  return { air: map.AIR, sea: map.SEA, road: map.ROAD, total };
}

/** Taux de réponse par transport sur la période */
export async function getResponseRateByTransport(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [sent, completed] = await Promise.all([
    prisma.emailLog.findMany({
      where: { status: "SENT", sentAt: { gte: since } },
      include: { quotation: { select: { transportType: true } } },
    }),
    prisma.quotation.findMany({
      where: { status: "COMPLETED", updatedAt: { gte: since } },
      select: { transportType: true },
    }),
  ]);

  const sentCount: Record<string, number> = { AIR: 0, SEA: 0, ROAD: 0 };
  const completedCount: Record<string, number> = { AIR: 0, SEA: 0, ROAD: 0 };

  for (const log of sent) {
    const t = log.quotation?.transportType ?? "AIR";
    sentCount[t] = (sentCount[t] ?? 0) + 1;
  }
  for (const q of completed) {
    completedCount[q.transportType] = (completedCount[q.transportType] ?? 0) + 1;
  }

  const rate = (t: string) => {
    const s = sentCount[t] ?? 0;
    const c = completedCount[t] ?? 0;
    return s > 0 ? Math.round((c / s) * 100) : 0;
  };

  return { AIR: rate("AIR"), SEA: rate("SEA"), ROAD: rate("ROAD") };
}

/** Heatmap : densité d'envois par jour de semaine × heure sur la période */
export async function getHeatmapData(days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.emailLog.findMany({
    where: { status: "SENT", sentAt: { gte: since } },
    select: { sentAt: true },
  });

  // 7 lignes (0=lundi…6=dimanche), 24 colonnes (heures)
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  for (const log of logs) {
    if (!log.sentAt) continue;
    const d = new Date(log.sentAt);
    const dow = (d.getDay() + 6) % 7; // 0=lundi
    grid[dow][d.getHours()]++;
  }

  return grid;
}
