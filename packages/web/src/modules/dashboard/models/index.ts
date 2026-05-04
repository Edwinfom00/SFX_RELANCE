import prisma from "@/lib/prisma";

export async function getDashboardStats(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [totalActive, totalCompleted, totalClosed, totalCancelled, emailsSentPeriod, emailsFailed, pendingReminders] =
    await Promise.all([
      prisma.quotation.count({ where: { status: "ACTIVE" } }),
      prisma.quotation.count({ where: { status: "COMPLETED" } }), // client a répondu
      prisma.quotation.count({ where: { status: "CLOSED" } }),    // 3 relances sans réponse
      prisma.quotation.count({ where: { status: "CANCELLED" } }),
      prisma.emailLog.count({ where: { status: "SENT", sentAt: { gte: since } } }),
      prisma.emailLog.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
      prisma.quotation.count({ where: { status: "ACTIVE", nextReminderAt: { lte: new Date() } } }),
    ]);

  return { totalActive, totalCompleted, totalClosed, totalCancelled, emailsSentToday: emailsSentPeriod, emailsFailed, pendingReminders };
}


export async function getDailyActivity(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [sentLogs, respondedQuotations] = await Promise.all([
    prisma.emailLog.findMany({
      where: { status: "SENT", sentAt: { gte: since } },
      select: { sentAt: true },
    }),
    // COMPLETED = client a répondu — c'est ça le vrai taux de réponse
    prisma.quotation.findMany({
      where: { status: "COMPLETED", updatedAt: { gte: since } },
      select: { updatedAt: true },
    }),
  ]);

  const sentByDay      = new Array(days).fill(0);
  const respondedByDay = new Array(days).fill(0);
  const now = Date.now();

  for (const log of sentLogs) {
    if (!log.sentAt) continue;
    const daysAgo = Math.floor((now - new Date(log.sentAt).getTime()) / 86400000);
    const idx = (days - 1) - daysAgo;
    if (idx >= 0 && idx < days) sentByDay[idx]++;
  }
  for (const q of respondedQuotations) {
    const daysAgo = Math.floor((now - new Date(q.updatedAt).getTime()) / 86400000);
    const idx = (days - 1) - daysAgo;
    if (idx >= 0 && idx < days) respondedByDay[idx]++;
  }

  const step = Math.max(1, Math.floor(days / 10));
  const sampledSent      = sentByDay.filter((_, i) => i % step === 0);
  const sampledResponded = respondedByDay.filter((_, i) => i % step === 0);
  const labels = sampledSent.map((_, i) => String(i * step + 1));

  return {
    sentByDay:      sampledSent,
    completedByDay: sampledResponded, // renommé pour compatibilité avec les charts
    totalSent:      sentLogs.length,
    totalCompleted: respondedQuotations.length,
    labels,
  };
}


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


export async function getResponseRateByTransport(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [sent, responded] = await Promise.all([
    prisma.emailLog.findMany({
      where: { status: "SENT", sentAt: { gte: since } },
      include: { quotation: { select: { transportType: true } } },
    }),
    // COMPLETED = client a répondu (disparu de BrainOpx)
    // CLOSED = 3 relances sans réponse — ne compte PAS comme réponse
    prisma.quotation.findMany({
      where: { status: "COMPLETED", updatedAt: { gte: since } },
      select: { transportType: true },
    }),
  ]);

  const sentCount: Record<string, number>      = { AIR: 0, SEA: 0, ROAD: 0 };
  const respondedCount: Record<string, number> = { AIR: 0, SEA: 0, ROAD: 0 };

  for (const log of sent) {
    const t = log.quotation?.transportType ?? "AIR";
    sentCount[t] = (sentCount[t] ?? 0) + 1;
  }
  for (const q of responded) {
    respondedCount[q.transportType] = (respondedCount[q.transportType] ?? 0) + 1;
  }

  const rate = (t: string) => {
    const s = sentCount[t] ?? 0;
    const r = respondedCount[t] ?? 0;
    return s > 0 ? Math.round((r / s) * 100) : 0;
  };

  return { AIR: rate("AIR"), SEA: rate("SEA"), ROAD: rate("ROAD") };
}

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
