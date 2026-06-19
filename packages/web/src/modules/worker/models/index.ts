import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import type { WorkerConfig, WorkerStats } from "../types";

function parseConfig(raw: any): WorkerConfig {
  return {
    id:              raw.id,
    syncSource:      (raw.syncSource as "DB" | "EXCEL") ?? "DB",
    intervalMinutes: raw.intervalMinutes,
    intervalR1:      raw.intervalR1 ?? 30,
    intervalR2:      raw.intervalR2 ?? 30,
    intervalR3:      raw.intervalR3 ?? 60,
    sendWindowStart: raw.sendWindowStart,
    sendWindowEnd:   raw.sendWindowEnd,
    activeDays:      JSON.parse(raw.activeDays),
    sendDelaySeconds: raw.sendDelaySeconds,
    cadenceAir:      JSON.parse(raw.cadenceAir),
    cadenceSea:      JSON.parse(raw.cadenceSea),
    cadenceRoad:     JSON.parse(raw.cadenceRoad),
    smtpHost:        raw.smtpHost,
    smtpPort:        raw.smtpPort,
    smtpSecure:      raw.smtpSecure,
    smtpUser:        raw.smtpUser,
    smtpPass:        raw.smtpPass ? "••••••••" : "",
    smtpFrom:        raw.smtpFrom,
    timezone:        raw.timezone ?? "Africa/Douala",
    updatedAt:       raw.updatedAt,
  };
}

/** Récupère (ou crée) la config worker — toujours id=1 */
export async function getWorkerConfig(): Promise<WorkerConfig> {
  let raw = await prisma.workerConfig.findFirst();
  if (!raw) {
    raw = await prisma.workerConfig.create({
      data: {
        syncSource: "DB",
        intervalMinutes: 30,
        sendWindowStart: 8,
        sendWindowEnd: 19,
        activeDays: "[1,2,3,4,5]",
        sendDelaySeconds: 30,
        cadenceAir: '[{"reminderNumber":1,"delayHours":24},{"reminderNumber":2,"delayHours":48},{"reminderNumber":3,"delayHours":72}]',
        cadenceSea: '[{"reminderNumber":1,"delayHours":48},{"reminderNumber":2,"delayHours":96},{"reminderNumber":3,"delayHours":168}]',
        cadenceRoad: '[{"reminderNumber":1,"delayHours":48},{"reminderNumber":2,"delayHours":96},{"reminderNumber":3,"delayHours":168}]',
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: "",
        smtpFrom: "",
      },
    });
  }
  return parseConfig(raw);
}

export interface UpdateWorkerConfigInput {
  syncSource?: "DB" | "EXCEL";
  intervalMinutes?: number;
  intervalR1?: number;
  intervalR2?: number;
  intervalR3?: number;
  sendWindowStart?: number;
  sendWindowEnd?: number;
  activeDays?: number[];
  sendDelaySeconds?: number;
  cadenceAir?: Array<{ reminderNumber: number; delayHours: number }>;
  cadenceSea?: Array<{ reminderNumber: number; delayHours: number }>;
  cadenceRoad?: Array<{ reminderNumber: number; delayHours: number }>;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  timezone?: string;
}

export async function updateWorkerConfig(data: UpdateWorkerConfigInput): Promise<WorkerConfig> {
  const existing = await prisma.workerConfig.findFirst();
  const id = existing?.id ?? 1;

  const payload: Record<string, any> = {};
  if (data.syncSource      !== undefined) payload.syncSource      = data.syncSource;
  if (data.intervalMinutes !== undefined) payload.intervalMinutes = data.intervalMinutes;
  if (data.intervalR1      !== undefined) payload.intervalR1      = data.intervalR1;
  if (data.intervalR2      !== undefined) payload.intervalR2      = data.intervalR2;
  if (data.intervalR3      !== undefined) payload.intervalR3      = data.intervalR3;
  if (data.sendWindowStart !== undefined) payload.sendWindowStart = data.sendWindowStart;
  if (data.sendWindowEnd !== undefined) payload.sendWindowEnd = data.sendWindowEnd;
  if (data.activeDays !== undefined) payload.activeDays = JSON.stringify(data.activeDays);
  if (data.sendDelaySeconds !== undefined) payload.sendDelaySeconds = data.sendDelaySeconds;
  if (data.cadenceAir !== undefined) payload.cadenceAir = JSON.stringify(data.cadenceAir);
  if (data.cadenceSea !== undefined) payload.cadenceSea = JSON.stringify(data.cadenceSea);
  if (data.cadenceRoad !== undefined) payload.cadenceRoad = JSON.stringify(data.cadenceRoad);
  if (data.smtpHost !== undefined) payload.smtpHost = data.smtpHost;
  if (data.smtpPort !== undefined) payload.smtpPort = data.smtpPort;
  if (data.smtpSecure !== undefined) payload.smtpSecure = data.smtpSecure;
  if (data.smtpUser !== undefined) payload.smtpUser = data.smtpUser;
  // Chiffrer le mot de passe — on ne stocke jamais en clair
  if (data.smtpPass !== undefined && data.smtpPass !== "" && data.smtpPass !== "••••••••") {
    payload.smtpPass = encrypt(data.smtpPass);
  }
  if (data.smtpFrom !== undefined) payload.smtpFrom = data.smtpFrom;
  if (data.timezone !== undefined) payload.timezone = data.timezone;

  const raw = await prisma.workerConfig.upsert({
    where: { id },
    update: payload,
    create: {
      syncSource: data.syncSource ?? "DB",
      intervalMinutes: data.intervalMinutes ?? 30,
      sendWindowStart: data.sendWindowStart ?? 8,
      sendWindowEnd: data.sendWindowEnd ?? 19,
      activeDays: JSON.stringify(data.activeDays ?? [1, 2, 3, 4, 5]),
      sendDelaySeconds: data.sendDelaySeconds ?? 30,
      cadenceAir: JSON.stringify(data.cadenceAir ?? [{ reminderNumber: 1, delayHours: 24 }, { reminderNumber: 2, delayHours: 48 }, { reminderNumber: 3, delayHours: 72 }]),
      cadenceSea: JSON.stringify(data.cadenceSea ?? [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 }, { reminderNumber: 3, delayHours: 168 }]),
      cadenceRoad: JSON.stringify(data.cadenceRoad ?? [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 }, { reminderNumber: 3, delayHours: 168 }]),
      smtpHost: data.smtpHost ?? "",
      smtpPort: data.smtpPort ?? 587,
      smtpSecure: data.smtpSecure ?? false,
      smtpUser: data.smtpUser ?? "",
      smtpPass: data.smtpPass ? encrypt(data.smtpPass) : "",
      smtpFrom: data.smtpFrom ?? "",
      timezone: data.timezone ?? "Africa/Douala",
    },
  });
  return parseConfig(raw);
}

export async function getWorkerStats(): Promise<WorkerStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalActive, totalCompleted, totalClosed, emailsSentToday, emailsFailedTotal, pendingReminders, outgoingPending, lastLog] =
    await Promise.all([
      prisma.quotation.count({ where: { status: "ACTIVE" } }),
      prisma.quotation.count({ where: { status: "COMPLETED" } }),
      prisma.quotation.count({ where: { status: "CLOSED" } }),
      prisma.emailLog.count({ where: { status: "SENT", sentAt: { gte: today } } }),
      prisma.emailLog.count({ where: { status: "FAILED" } }),
      prisma.quotation.count({ where: { status: "ACTIVE", nextReminderAt: { lte: new Date() } } }),
      prisma.outgoingQuotation.count({ where: { status: "PENDING" } }),
      prisma.emailLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    ]);

  return {
    totalActive,
    totalCompleted,
    totalClosed,
    emailsSentToday,
    emailsFailedTotal,
    pendingReminders,
    outgoingPending,
    lastRunAt: lastLog?.createdAt ?? null,
    nextRunAt: null,
  };
}

export async function getRecentWorkerLogs(limit = 20) {
  return prisma.emailLog.findMany({
    include: {
      quotation: { select: { quotationId: true, clientCode: true, transportType: true } },
      template: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
