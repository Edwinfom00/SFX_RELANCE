import prisma from "../utils/prisma";
import { addHours } from "../utils/date";
import { REMINDER_SCHEDULE } from "../config/reminder.config";
import type { TransportType } from "../types";

interface BrainOpxRow {
  quotation_id: string;
  libelle: string;
  client_code: string;
  client_email: string;
  transmission_date: Date;
  transport_type: "AIR" | "SEA" | "ROAD";
}

/**
 * Lit les cotations actives depuis la vue cross-database v_sfx_active_quotations
 * (créée dans SFX_Relance, lit BopxFMT via cross-db reference).
 * Utilise Prisma — pas de connexion mssql séparée.
 */
async function fetchFromBrainOpx(): Promise<BrainOpxRow[]> {
  const brainOpxDb = process.env.BRAINOPX_DATABASE ?? "BopxFMT";
  const rows = await prisma.$queryRawUnsafe<BrainOpxRow[]>(`
    SELECT
      quotation_id,
      libelle,
      client_code,
      client_email,
      transmission_date,
      transport_type
    FROM [${brainOpxDb}].[dbo].[v_sfx_active_quotations]
  `);

  return rows;
}

/**
 * Synchronise BrainOpx → SFX_Relance.
 *
 * 1. Cotation présente dans BrainOpx mais absente localement → CREATE (ACTIVE)
 *    nextReminderAt = Date Transmission + délai relance #1
 *
 * 2. Cotation ACTIVE localement mais absente de BrainOpx
 *    → client a répondu (statut changé dans BrainOpx)
 *    → on marque COMPLETED et on efface nextReminderAt
 */
export async function syncQuotations(): Promise<void> {
  console.log("[BrainOpx] Syncing quotations...");

  const brainOpxRows = await fetchFromBrainOpx();
  const brainOpxIds = new Set(brainOpxRows.map((r) => r.quotation_id));

  // ── 1. Marquer COMPLETED les cotations disparues de BrainOpx ────────────
  const localActive = await prisma.quotation.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, quotationId: true },
  });

  const toComplete = localActive.filter((q) => !brainOpxIds.has(q.quotationId));

  if (toComplete.length > 0) {
    await prisma.quotation.updateMany({
      where: { id: { in: toComplete.map((q) => q.id) } },
      data: { status: "COMPLETED", nextReminderAt: null },
    });
    console.log(`[BrainOpx] ${toComplete.length} cotation(s) → COMPLETED (client a répondu)`);
  }

  // ── 2. Créer les nouvelles cotations + mettre à jour le libelle des existantes ──
  const existingMap = new Map(
    (await prisma.quotation.findMany({ select: { quotationId: true, id: true, libelle: true } }))
      .map((q) => [q.quotationId, q])
  );

  const newRows = brainOpxRows.filter((r) => !existingMap.has(r.quotation_id));

  // Mettre à jour le libelle des cotations existantes si vide
  for (const row of brainOpxRows) {
    const existing = existingMap.get(row.quotation_id);
    if (existing && !existing.libelle && row.libelle) {
      await prisma.quotation.update({
        where: { id: existing.id },
        data: { libelle: row.libelle },
      });
    }
  }

  let created = 0;
  let skipped = 0;

  for (const row of newRows) {
    const transportType = row.transport_type as TransportType;
    const schedule = REMINDER_SCHEDULE[transportType];

    if (!schedule?.length) {
      console.warn(`[BrainOpx] Type transport inconnu "${transportType}" pour ${row.quotation_id} — ignoré`);
      skipped++;
      continue;
    }

    const nextReminderAt = addHours(
      new Date(row.transmission_date),
      schedule[0].delayHours
    );

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
        nextReminderAt,
      },
    });
    created++;
  }

  console.log(
    `[BrainOpx] Sync terminée — ${created} créée(s), ${toComplete.length} complétée(s), ${skipped} ignorée(s)`
  );
}
