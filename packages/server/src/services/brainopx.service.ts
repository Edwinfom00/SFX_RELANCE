import prisma from "../utils/prisma";
import { addHours } from "../utils/date";
import type { TransportType } from "../types";

type ReminderSchedule = Array<{ reminderNumber: number; delayHours: number }>;


async function getFirstDelays(): Promise<Record<string, number>> {
  try {
    const config = await prisma.workerConfig.findFirst({
      select: { cadenceAir: true, cadenceSea: true, cadenceRoad: true },
    });
    if (!config) return { AIR: 24, SEA: 48, ROAD: 48 };
    const parse = (s: string) => (JSON.parse(s) as ReminderSchedule)[0]?.delayHours ?? 24;
    return { AIR: parse(config.cadenceAir), SEA: parse(config.cadenceSea), ROAD: parse(config.cadenceRoad) };
  } catch {
    return { AIR: 24, SEA: 48, ROAD: 48 };
  }
}

interface BrainOpxRow {
  quotation_id: string;
  libelle: string;
  client_code: string;
  client_email: string;
  transmission_date: Date;
  transport_type: "AIR" | "SEA" | "ROAD";
}


async function fetchFromBrainOpx(): Promise<BrainOpxRow[]> {
  const db = process.env.BRAINOPX_DATABASE ?? "BopxFMT";
  return prisma.$queryRawUnsafe<BrainOpxRow[]>(`
    SELECT quotation_id, libelle, client_code, client_email, transmission_date, transport_type
    FROM [${db}].[dbo].[v_sfx_active_quotations]
  `);
}


export async function syncQuotations(): Promise<void> {
  console.log("[BrainOpx] Syncing quotations...");

  const rows = await fetchFromBrainOpx();
  const remoteIds = new Set(rows.map((r) => r.quotation_id));

  const localActive = await prisma.quotation.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, quotationId: true },
  });

  const toComplete = localActive.filter((q) => !remoteIds.has(q.quotationId));
  if (toComplete.length > 0) {
    await prisma.quotation.updateMany({
      where: { id: { in: toComplete.map((q) => q.id) } },
      data: { status: "COMPLETED", nextReminderAt: null },
    });
    console.log(`[BrainOpx] ${toComplete.length} cotation(s) → COMPLETED`);
  }

  const existingMap = new Map(
    (await prisma.quotation.findMany({ select: { quotationId: true, id: true, libelle: true } }))
      .map((q) => [q.quotationId, q])
  );

  for (const row of rows) {
    const existing = existingMap.get(row.quotation_id);
    if (existing && !existing.libelle && row.libelle) {
      await prisma.quotation.update({ where: { id: existing.id }, data: { libelle: row.libelle } });
    }
  }

  const newRows = rows.filter((r) => !existingMap.has(r.quotation_id));
  const firstDelays = await getFirstDelays();
  let created = 0;
  let skipped = 0;

  for (const row of newRows) {
    const transportType = row.transport_type as TransportType;
    const firstDelay = firstDelays[transportType];

    if (firstDelay === undefined) {
      console.warn(`[BrainOpx] Transport inconnu "${transportType}" — ${row.quotation_id} ignoré`);
      skipped++;
      continue;
    }

    await prisma.quotation.create({
      data: {
        quotationId:      row.quotation_id,
        libelle:          row.libelle ?? "",
        clientCode:       row.client_code,
        clientEmail:      row.client_email,
        transmissionDate: new Date(row.transmission_date),
        transportType,
        status:           "ACTIVE",
        currentReminder:  0,
        nextReminderAt:   addHours(new Date(row.transmission_date), firstDelay),
      },
    });
    created++;
  }

  console.log(`[BrainOpx] Sync terminée — ${created} créée(s), ${toComplete.length} complétée(s), ${skipped} ignorée(s)`);
}
