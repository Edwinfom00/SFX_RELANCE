"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { triggerTickAction } from "../../worker/actions/control";

/**
 * Récupère la liste de tous les clients locaux.
 * Possibilité de filtrer par code ou par nom.
 */
export async function getClientsAction(search?: string, page = 1, limit = 15) {
  try {
    const whereClause = search
      ? {
          OR: [
            { code: { contains: search } },
            { name: { contains: search } },
          ],
        }
      : {};

    const total = await prisma.client.count({ where: whereClause });

    const clients = await prisma.client.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pageCount = Math.ceil(total / limit);

    return {
      success: true,
      data: clients,
      total,
      pageCount,
      page,
      pageSize: limit,
    };
  } catch (err: any) {
    console.error("[getClientsAction] Erreur:", err);
    return { success: false, error: err.message || "Impossible de récupérer les clients" };
  }
}

/**
 * Met à jour les emails d'un client et propage la modification
 * sur toutes ses cotations actives en cours de relance.
 */
export async function updateClientAction(id: number, emails: string) {
  try {
    // 1. Récupérer le client
    const client = await prisma.client.findUnique({
      where: { id },
    });
    if (!client) {
      return { success: false, error: "Client introuvable." };
    }

    const cleanEmails = emails
      .split(/[;,]/)
      .map((e) => e.trim())
      .filter((e) => e !== "")
      .join(", ");

    // 2. Mettre à jour le client et ses cotations actives dans une transaction unique
    await prisma.$transaction([
      prisma.client.update({
        where: { id },
        data: { emails: cleanEmails },
      }),
      prisma.quotation.updateMany({
        where: {
          clientCode: client.code,
          status: "ACTIVE",
        },
        data: {
          clientEmail: cleanEmails,
        },
      }),
    ]);

    revalidatePath("/clients");
    revalidatePath("/quotations");
    return { success: true };
  } catch (err: any) {
    console.error("[updateClientAction] Erreur:", err);
    return { success: false, error: err.message || "Une erreur est survenue lors de la mise à jour." };
  }
}

/**
 * Lance immédiatement la synchronisation des clients depuis le serveur.
 */
export async function triggerClientSyncAction() {
  try {
    const res = await triggerTickAction("client-sync");
    if (res.success) {
      revalidatePath("/clients");
      return { success: true };
    }
    return { success: false, error: res.error || "Impossible de déclencher le worker de synchronisation." };
  } catch (err: any) {
    console.error("[triggerClientSyncAction] Erreur:", err);
    return { success: false, error: err.message || "Une erreur est survenue." };
  }
}
