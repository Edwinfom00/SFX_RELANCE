import prisma from "../utils/prisma";
import { sendMail } from "./mailer.service";
import { addHours } from "../utils/date";
import { REMINDER_SCHEDULE, MAX_RETRY } from "../config/reminder.config";
import type { TransportType } from "../types";

/** Remplace les variables {{quote.x}} et {{user.x}} dans subject/body */
function resolveTemplate(
  text: string,
  quotation: { quotationId: string; clientCode: string; clientEmail: string; libelle: string },
  libelle: string,
): string {
  return text
    .replace(/\{\{quote\.id\}\}/g,      quotation.quotationId)
    .replace(/\{\{quote\.libelle\}\}/g,  libelle)
    .replace(/\{\{quote\.client\}\}/g,   quotation.clientCode)
    .replace(/\{\{user\.fullName\}\}/g,  process.env.SMTP_SENDER_NAME ?? "Service Cotations")
    .replace(/\{\{user\.phone\}\}/g,     process.env.SMTP_SENDER_PHONE ?? "");
}

/** Convertit le texte brut en HTML simple */
function textToHtml(text: string): string {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222;">${
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>")
      .replace(/---/g, '<hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">')
  }</div>`;
}

/**
 * Vérifie si l'heure actuelle est dans la plage d'envoi autorisée.
 * Lit sendWindowStart / sendWindowEnd depuis la config worker en DB.
 * Fallback : 8h–19h si pas de config.
 */
async function isWithinSendWindow(): Promise<boolean> {
  try {
    const config = await prisma.workerConfig.findFirst({
      select: { sendWindowStart: true, sendWindowEnd: true, activeDays: true, timezone: true },
    });

    const tz = (config as any)?.timezone ?? "Africa/Douala";

    // Heure locale dans le fuseau configuré
    const now = new Date();
    const localTime = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      weekday: "short",
      hour12: false,
    }).formatToParts(now);

    const hour = parseInt(localTime.find((p) => p.type === "hour")?.value ?? "0", 10);
    const weekdayStr = localTime.find((p) => p.type === "weekday")?.value ?? "Mon";
    const weekdayMap: Record<string, number> = {
      Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
    };
    const dow = weekdayMap[weekdayStr] ?? 1;

    const start = config?.sendWindowStart ?? 8;
    const end   = config?.sendWindowEnd   ?? 19;
    const days: number[] = (config as any)?.activeDays
      ? JSON.parse((config as any).activeDays)
      : [1, 2, 3, 4, 5];

    if (!days.includes(dow)) {
      console.log(`[Reminder] Hors jour ouvré (${weekdayStr}, jour ${dow}) [${tz}] — envois suspendus`);
      return false;
    }
    if (hour < start || hour >= end) {
      console.log(`[Reminder] Hors plage horaire (${hour}h, plage ${start}h–${end}h) [${tz}] — envois suspendus`);
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export async function processReminders(): Promise<void> {
  // ── Vérification plage horaire ──────────────────────────────────────────
  const withinWindow = await isWithinSendWindow();
  if (!withinWindow) return;

  // ── Cotations dont la prochaine relance est due ─────────────────────────
  const now = new Date();
  const quotations = await prisma.quotation.findMany({
    where: {
      status: "ACTIVE",
      nextReminderAt: { lte: now },
      currentReminder: { lt: 3 },
    },
  });

  if (quotations.length === 0) {
    console.log("[Reminder] Aucune relance due.");
    return;
  }

  console.log(`[Reminder] ${quotations.length} relance(s) à traiter.`);

  for (const quotation of quotations) {
    const nextReminderNumber = (quotation.currentReminder + 1) as 1 | 2 | 3;

    // ── Vérification anti-doublon : déjà un log SENT ou PENDING pour ce numéro ?
    const alreadySent = await prisma.emailLog.findFirst({
      where: {
        quotationId:    quotation.id,
        reminderNumber: nextReminderNumber,
        status:         { in: ["SENT", "PENDING"] },
      },
    });
    if (alreadySent) {
      console.warn(
        `[Reminder] Doublon détecté — ${quotation.quotationId} relance #${nextReminderNumber} déjà envoyée (log #${alreadySent.id}), ignorée`
      );
      continue;
    }

    const template = await prisma.emailTemplate.findFirst({
      where: {
        transportType:  quotation.transportType,
        reminderNumber: nextReminderNumber,
        isActive:       true,
      },
    });

    if (!template) {
      console.warn(
        `[Reminder] Aucun template actif pour ${quotation.transportType} relance #${nextReminderNumber} — ${quotation.quotationId} ignorée`
      );
      continue;
    }

    const libelle = (quotation as any).libelle || quotation.clientCode;

    const resolvedSubject = resolveTemplate(template.subject, { ...quotation, libelle }, libelle);
    const resolvedBody    = resolveTemplate(template.body,    { ...quotation, libelle }, libelle);
    const htmlBody        = textToHtml(resolvedBody);

    const log = await prisma.emailLog.create({
      data: {
        quotationId:    quotation.id,
        reminderNumber: nextReminderNumber,
        templateId:     template.id,
        recipientEmail: quotation.clientEmail,
        status:         "PENDING",
      },
    });

    let success = false;
    let errorMsg: string | undefined;

    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        await sendMail({ to: quotation.clientEmail, subject: resolvedSubject, html: htmlBody });
        success = true;
        break;
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
        if (attempt < MAX_RETRY) {
          await prisma.emailLog.update({
            where: { id: log.id },
            data: { status: "RETRIED", retryCount: attempt + 1 },
          });
        }
      }
    }

    const schedule     = REMINDER_SCHEDULE[quotation.transportType as TransportType];
    const nextSchedule = schedule.find((s) => s.reminderNumber === nextReminderNumber + 1);

    await prisma.$transaction([
      prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status:       success ? "SENT" : "FAILED",
          sentAt:       success ? new Date() : null,
          errorMessage: errorMsg ?? null,
        },
      }),
      prisma.quotation.update({
        where: { id: quotation.id },
        data: {
          currentReminder: nextReminderNumber,
          status:          nextReminderNumber === 3 ? "COMPLETED" : "ACTIVE",
          nextReminderAt:  nextSchedule
            ? addHours(quotation.transmissionDate, nextSchedule.delayHours)
            : null,
        },
      }),
    ]);

    console.log(
      `[Reminder] ${success ? "✓" : "✗"} ${quotation.quotationId} — relance #${nextReminderNumber} → ${quotation.clientEmail}`
    );
  }
}
