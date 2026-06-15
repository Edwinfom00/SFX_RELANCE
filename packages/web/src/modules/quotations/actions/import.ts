import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface ImportedRow {
  quotationId: string;
  clientCode: string;
  clientEmail: string;
  libelle: string;
  transmissionDate: string; // ISO String
  transportType: "AIR" | "SEA" | "ROAD";
  paysCode: string;
  agenceCode: string;
}

export async function importQuotationsAction(rows: ImportedRow[]): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: "Aucune donnée à importer." };
    }

    // 1. Récupérer les délais de configuration du worker
    const config = await prisma.workerConfig.findFirst({
      select: { cadenceAir: true, cadenceSea: true, cadenceRoad: true },
    });

    const parseDelay = (jsonStr?: string, defaultDelay: number = 24) => {
      try {
        if (!jsonStr) return defaultDelay;
        const arr = JSON.parse(jsonStr);
        return arr[0]?.delayHours ?? defaultDelay;
      } catch {
        return defaultDelay;
      }
    };

    const delays: Record<string, number> = {
      AIR: parseDelay(config?.cadenceAir, 24),
      SEA: parseDelay(config?.cadenceSea, 48),
      ROAD: parseDelay(config?.cadenceRoad, 48),
    };

    // 2. Vider les tables actuelles de relances et de cotations
    await prisma.emailLog.deleteMany({});
    await prisma.quotation.deleteMany({});

    // 3. Créer la liste des opérations de création
    const operations = rows.map((row) => {
      const transmissionDate = new Date(row.transmissionDate);
      const delayHours = delays[row.transportType] ?? 24;
      const nextReminderAt = new Date(transmissionDate.getTime() + delayHours * 3600 * 1000);

      return prisma.quotation.create({
        data: {
          quotationId: row.quotationId,
          clientCode: row.clientCode,
          clientEmail: row.clientEmail,
          libelle: row.libelle ?? "",
          transmissionDate,
          transportType: row.transportType,
          status: "ACTIVE",
          currentReminder: 0,
          nextReminderAt,
          paysCode: row.paysCode || "TGO",
          agenceCode: row.agenceCode || "LOM",
        },
      });
    });

    // 4. Exécuter l'import dans une transaction unique
    await prisma.$transaction(operations);

    revalidatePath("/quotations");
    return { success: true };
  } catch (err: any) {
    console.error("[Import] Erreur lors de l'importation:", err);
    return { success: false, error: err.message || "Une erreur est survenue lors de l'importation." };
  }
}
