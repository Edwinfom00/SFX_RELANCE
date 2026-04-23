"use server";

import { revalidatePath } from "next/cache";
import { createTemplate, updateTemplate, deleteTemplate } from "../models";
import { templateSchema } from "../validators";
import prisma from "@/lib/prisma";

export async function createTemplateAction(data: unknown) {
  const parsed = templateSchema.parse(data);
  await createTemplate(parsed);
  revalidatePath("/templates");
}

export async function updateTemplateAction(id: number, data: unknown) {
  const parsed = templateSchema.partial().parse(data);
  await updateTemplate(id, parsed);
  revalidatePath("/templates");
}

export async function deleteTemplateAction(id: number) {
  await deleteTemplate(id);
  revalidatePath("/templates");
}

export async function toggleTemplateActiveAction(id: number, isActive: boolean) {
  await prisma.emailTemplate.update({ where: { id }, data: { isActive } });
  revalidatePath("/templates");
}

/** Stats réelles par template depuis emailLog */
export async function getTemplateStats(templateId: number) {
  const [sent, completed] = await Promise.all([
    prisma.emailLog.count({ where: { templateId, status: "SENT" } }),
    prisma.emailLog.count({ where: { templateId, status: { in: ["SENT", "FAILED"] } } }),
  ]);
  // Taux = cotations complétées après cet envoi / total envois
  // Approximation : on compte les quotations COMPLETED liées aux logs de ce template
  const completedQuotations = await prisma.emailLog.findMany({
    where: { templateId, status: "SENT" },
    select: { quotationId: true },
    distinct: ["quotationId"],
  });
  const quotationIds = completedQuotations.map((l) => l.quotationId);
  const responded = quotationIds.length > 0
    ? await prisma.quotation.count({ where: { id: { in: quotationIds }, status: "COMPLETED" } })
    : 0;

  const rate = sent > 0 ? Math.round((responded / sent) * 100) : 0;
  return { sent, rate };
}
