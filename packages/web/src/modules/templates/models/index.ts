import prisma from "@/lib/prisma";
import type { TemplateInput } from "../validators";

export async function getTemplates() {
  return prisma.emailTemplate.findMany({
    orderBy: [{ transportType: "asc" }, { reminderNumber: "asc" }],
  });
}

/** Templates + stats d'utilisation réelles */
export async function getTemplatesWithStats() {
  const templates = await getTemplates();

  const stats = await Promise.all(
    templates.map(async (t) => {
      const sent = await prisma.emailLog.count({
        where: { templateId: t.id, status: "SENT" },
      });
      const quotationIds = sent > 0
        ? (await prisma.emailLog.findMany({
            where: { templateId: t.id, status: "SENT" },
            select: { quotationId: true },
            distinct: ["quotationId"],
          })).map((l) => l.quotationId)
        : [];
      const responded = quotationIds.length > 0
        ? await prisma.quotation.count({
            where: { id: { in: quotationIds }, status: "COMPLETED" },
          })
        : 0;
      return {
        templateId: t.id,
        sent,
        rate: sent > 0 ? Math.round((responded / sent) * 100) : 0,
      };
    })
  );

  return templates.map((t) => ({
    ...t,
    stats: stats.find((s) => s.templateId === t.id) ?? { sent: 0, rate: 0 },
  }));
}

export async function getTemplateById(id: number) {
  return prisma.emailTemplate.findUnique({ where: { id } });
}

export async function createTemplate(data: TemplateInput) {
  return prisma.emailTemplate.create({ data });
}

export async function updateTemplate(id: number, data: Partial<TemplateInput>) {
  return prisma.emailTemplate.update({ where: { id }, data });
}

export async function deleteTemplate(id: number) {
  return prisma.emailTemplate.delete({ where: { id } });
}
