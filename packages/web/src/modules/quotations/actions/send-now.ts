"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import nodemailer from "nodemailer";

const REMINDER_SCHEDULE: Record<string, Array<{ reminderNumber: number; delayHours: number }>> = {
  AIR:  [{ reminderNumber: 1, delayHours: 24 },  { reminderNumber: 2, delayHours: 48 },  { reminderNumber: 3, delayHours: 72 }],
  SEA:  [{ reminderNumber: 1, delayHours: 48 },  { reminderNumber: 2, delayHours: 96 },  { reminderNumber: 3, delayHours: 168 }],
  ROAD: [{ reminderNumber: 1, delayHours: 48 },  { reminderNumber: 2, delayHours: 96 },  { reminderNumber: 3, delayHours: 168 }],
};

function resolveVars(text: string, quotationId: string, libelle: string, clientCode: string): string {
  return text
    .replace(/\{\{quote\.id\}\}/g,      quotationId)
    .replace(/\{\{quote\.libelle\}\}/g,  libelle || quotationId)
    .replace(/\{\{quote\.client\}\}/g,   clientCode)
    .replace(/\{\{user\.fullName\}\}/g,  process.env.SMTP_SENDER_NAME ?? "Service Cotations")
    .replace(/\{\{user\.phone\}\}/g,     process.env.SMTP_SENDER_PHONE ?? "");
}

function textToHtml(text: string): string {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222;">${
    text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")
      .replace(/^/, "<p>").replace(/$/, "</p>")
      .replace(/---/g, '<hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">')
  }</div>`;
}

export async function sendReminderNowAction(
  quotationId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!quotation) return { success: false, error: "Cotation introuvable." };
    if (quotation.status !== "ACTIVE") return { success: false, error: "La cotation n'est plus active." };
    if (quotation.currentReminder >= 3) return { success: false, error: "Toutes les relances ont déjà été envoyées." };

    const nextReminderNumber = (quotation.currentReminder + 1) as 1 | 2 | 3;

    // Anti-doublon
    const alreadySent = await prisma.emailLog.findFirst({
      where: { quotationId: quotation.id, reminderNumber: nextReminderNumber, status: { in: ["SENT", "PENDING"] } },
    });
    if (alreadySent) return { success: false, error: `La relance #${nextReminderNumber} a déjà été envoyée.` };

    const template = await prisma.emailTemplate.findFirst({
      where: { transportType: quotation.transportType, reminderNumber: nextReminderNumber, isActive: true },
    });
    if (!template) return { success: false, error: `Aucun template actif pour la relance #${nextReminderNumber}.` };

    // Config SMTP
    const config = await prisma.workerConfig.findFirst();
    const host   = config?.smtpHost   || process.env.SMTP_HOST   || "";
    const port   = config?.smtpPort   || Number(process.env.SMTP_PORT) || 587;
    const secure = config?.smtpSecure ?? false;
    const user   = config?.smtpUser   || process.env.SMTP_USER   || "";
    const pass   = (config as any)?.smtpPass
      ? decrypt((config as any).smtpPass)
      : (process.env.SMTP_PASS || "");
    const from   = config?.smtpFrom   || process.env.SMTP_FROM   || user;

    if (!host || !user || !pass) return { success: false, error: "Configuration SMTP incomplète." };

    const libelle = (quotation as any).libelle || quotation.clientCode;
    const subject = resolveVars(template.subject, quotation.quotationId, libelle, quotation.clientCode);
    const html    = textToHtml(resolveVars(template.body, quotation.quotationId, libelle, quotation.clientCode));

    // Log PENDING
    const log = await prisma.emailLog.create({
      data: {
        quotationId:    quotation.id,
        reminderNumber: nextReminderNumber,
        templateId:     template.id,
        recipientEmail: quotation.clientEmail,
        status:         "PENDING",
      },
    });

    // Envoi
    const transporter = nodemailer.createTransport({
      host, port, secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    } as any);

    try {
      await transporter.sendMail({ from, to: quotation.clientEmail, subject, html });

      const schedule = REMINDER_SCHEDULE[quotation.transportType];
      const nextSchedule = schedule?.find((s) => s.reminderNumber === nextReminderNumber + 1);

      await prisma.$transaction([
        prisma.emailLog.update({
          where: { id: log.id },
          data: { status: "SENT", sentAt: new Date() },
        }),
        prisma.quotation.update({
          where: { id: quotation.id },
          data: {
            currentReminder: nextReminderNumber,
            status:          nextReminderNumber === 3 ? "COMPLETED" : "ACTIVE",
            nextReminderAt:  nextSchedule
              ? new Date(new Date(quotation.transmissionDate).getTime() + nextSchedule.delayHours * 3600000)
              : null,
          },
        }),
      ]);

      revalidatePath(`/quotations/${quotationId}`);
      return { success: true };
    } catch (err) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "FAILED", errorMessage: err instanceof Error ? err.message : String(err) },
      });
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
