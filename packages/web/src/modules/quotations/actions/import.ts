import prisma from "@/lib/prisma";
import { triggerTickAction } from "../../worker/actions/control";
import { revalidatePath } from "next/cache";

export async function syncFromExcelFileAction(): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Basculer la source de synchronisation sur EXCEL dans la configuration
    const config = await prisma.workerConfig.findFirst();
    const id = config?.id ?? 1;
    await prisma.workerConfig.upsert({
      where: { id },
      update: { syncSource: "EXCEL" },
      create: { syncSource: "EXCEL" },
    });

    // 2. Déclencher le tick du worker de synchronisation
    const res = await triggerTickAction("sync");
    if (!res.success) {
      return { success: false, error: res.error || "Le worker de synchronisation n'a pas pu être déclenché (vérifiez s'il est en pause)." };
    }

    revalidatePath("/quotations");
    revalidatePath("/worker");
    return { success: true };
  } catch (err: any) {
    console.error("[Excel Sync Action] Erreur:", err);
    return { success: false, error: err.message || "Une erreur est survenue lors de la synchronisation." };
  }
}
