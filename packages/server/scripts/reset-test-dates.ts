/**
 * Script de test — remet les dates de transmission à NOW dans BrainOpx
 * et réinitialise les cotations locales pour repartir de zéro.
 *
 * Usage :
 *   npx tsx packages/server/scripts/reset-test-dates.ts
 *
 * Options :
 *   --hours <n>   Décaler la date de transmission de -N heures (défaut: 0 = maintenant)
 *   --quotation <id>  Cibler une cotation spécifique (défaut: toutes)
 *   --dry-run     Afficher sans modifier
 */

import "dotenv/config";
import sql from "mssql";
import prisma from "../src/utils/prisma";

const args = process.argv.slice(2);
const hoursBack  = Number(args[args.indexOf("--hours")      + 1] ?? 0);
const targetId   = args[args.indexOf("--quotation")  + 1] ?? null;
const dryRun     = args.includes("--dry-run");
const brainOpxDb = process.env.BRAINOPX_DATABASE ?? "BopxFMT";

async function main() {
  console.log(`\n🔧 Reset dates de transmission — ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`   Décalage : -${hoursBack}h depuis maintenant`);
  if (targetId) console.log(`   Cotation ciblée : ${targetId}`);
  console.log("");

  const newDate = new Date(Date.now() - hoursBack * 3600 * 1000);
  console.log(`   Nouvelle date de transmission : ${newDate.toISOString()}`);

  // ── 1. Récupérer les cotations locales ACTIVE ──────────────────────────
  const localQuotations = await prisma.quotation.findMany({
    where: {
      status: "ACTIVE",
      ...(targetId ? { quotationId: targetId } : {}),
    },
    select: { id: true, quotationId: true, transportType: true, currentReminder: true },
  });

  if (localQuotations.length === 0) {
    console.log("⚠️  Aucune cotation ACTIVE trouvée localement.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n📋 ${localQuotations.length} cotation(s) à réinitialiser :\n`);
  for (const q of localQuotations) {
    console.log(`   • ${q.quotationId} (${q.transportType}) — relance actuelle : #${q.currentReminder}`);
  }

  if (dryRun) {
    console.log("\n✅ Dry run — aucune modification effectuée.");
    await prisma.$disconnect();
    return;
  }

  // ── 2. Modifier les dates dans BrainOpx ───────────────────────────────
  console.log("\n🔄 Mise à jour BrainOpx...");
  const pool = await sql.connect({
    server:   "localhost",
    database: brainOpxDb,
    user:     process.env.DB_USER     ?? "prisma_user",
    password: process.env.DB_PASSWORD ?? "Prisma@2024!Strong",
    options:  { trustServerCertificate: true, encrypt: false },
  });

  for (const q of localQuotations) {
    const request = pool.request();
    request.input("newDate", sql.DateTime, newDate);
    request.input("numPiece", sql.NVarChar, q.quotationId);

    const result = await request.query(`
      UPDATE [${brainOpxDb}].[dbo].[tn_Pieces_Ventes]
      SET [Date Transmission] = @newDate
      WHERE [Num Piece Vente] = @numPiece
    `);
    console.log(`   ✓ BrainOpx — ${q.quotationId} : ${result.rowsAffected[0]} ligne(s) modifiée(s)`);
  }
  await pool.close();

  // ── 3. Réinitialiser les cotations locales ────────────────────────────
  console.log("\n🔄 Réinitialisation locale (SFX_Relance)...");

  // Supprimer les logs existants pour repartir proprement
  const ids = localQuotations.map((q) => q.id);
  const deletedLogs = await prisma.emailLog.deleteMany({
    where: { quotationId: { in: ids } },
  });
  console.log(`   ✓ ${deletedLogs.count} log(s) supprimé(s)`);

  // Recalculer nextReminderAt depuis la nouvelle date de transmission
  const { REMINDER_SCHEDULE } = await import("../src/config/reminder.config");
  const { addHours } = await import("../src/utils/date");

  for (const q of localQuotations) {
    const schedule = REMINDER_SCHEDULE[q.transportType as keyof typeof REMINDER_SCHEDULE];
    const firstDelay = schedule?.[0]?.delayHours ?? 24;
    const nextReminderAt = addHours(newDate, firstDelay);

    await prisma.quotation.update({
      where: { id: q.id },
      data: {
        transmissionDate: newDate,
        currentReminder:  0,
        status:           "ACTIVE",
        nextReminderAt,
      },
    });
    console.log(
      `   ✓ Local — ${q.quotationId} : remis à 0, prochaine relance à ${nextReminderAt.toISOString()}`
    );
  }

  console.log("\n✅ Terminé. Relancez le worker pour tester.\n");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
