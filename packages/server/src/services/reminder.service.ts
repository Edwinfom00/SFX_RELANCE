import prisma from "../utils/prisma";
import { sendMail } from "./mailer.service";
import { addHours } from "../utils/date";
import { MAX_RETRY } from "../config/reminder.config";
import type { TransportType } from "../types";

type ReminderSchedule = Array<{ reminderNumber: number; delayHours: number }>;
type ReminderConfig   = Record<string, ReminderSchedule>;

const DEFAULT_SCHEDULE: ReminderConfig = {
  AIR:  [{ reminderNumber: 1, delayHours: 24 }, { reminderNumber: 2, delayHours: 48 }, { reminderNumber: 3, delayHours: 72  }],
  SEA:  [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 }, { reminderNumber: 3, delayHours: 168 }],
  ROAD: [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 }, { reminderNumber: 3, delayHours: 168 }],
};

async function getReminderSchedule(): Promise<ReminderConfig> {
  try {
    const config = await prisma.workerConfig.findFirst({
      select: { cadenceAir: true, cadenceSea: true, cadenceRoad: true },
    });
    if (!config) return DEFAULT_SCHEDULE;
    return {
      AIR:  JSON.parse(config.cadenceAir),
      SEA:  JSON.parse(config.cadenceSea),
      ROAD: JSON.parse(config.cadenceRoad),
    };
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

function resolveTemplate(
  text: string,
  quotation: { quotationId: string; clientCode: string; libelle: string },
): string {
  return text
    .replace(/\{\{quote\.id\}\}/g,      quotation.quotationId)
    .replace(/\{\{quote\.libelle\}\}/g,  quotation.libelle || quotation.quotationId)
    .replace(/\{\{quote\.client\}\}/g,   quotation.clientCode)
    .replace(/\{\{user\.fullName\}\}/g,  process.env.SMTP_SENDER_NAME  ?? "Service Cotations")
    .replace(/\{\{user\.phone\}\}/g,     process.env.SMTP_SENDER_PHONE ?? "");
}

function textToHtml(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a202c;font-weight:600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:#4a5568;">$1</em>')
    .replace(/---/g, '</p><hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;"><p style="margin:0 0 16px;color:#4a5568;">')
    .replace(/\n\n/g, '</p><p style="margin:0 0 16px;color:#4a5568;">')
    .replace(/\n/g, "<br>")
    .replace(/^/, '<p style="margin:0 0 16px;color:#4a5568;">')
    .replace(/$/, "</p>")
    .replace(/<p[^>]*><\/p>/g, "");

  return `<div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#4a5568;max-width:100%;">${html}</div>`;
}

/** Vérifie si l'heure courante est dans la plage d'envoi configurée. */
async function isWithinSendWindow(): Promise<boolean> {
  try {
    const config = await prisma.workerConfig.findFirst({
      select: { sendWindowStart: true, sendWindowEnd: true, activeDays: true, timezone: true },
    });

    const tz    = (config as any)?.timezone ?? "Africa/Douala";
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour: "numeric", weekday: "short", hour12: false,
    }).formatToParts(new Date());

    const hour       = parseInt(parts.find((p) => p.type === "hour")?.value    ?? "0",   10);
    const weekdayStr =           parts.find((p) => p.type === "weekday")?.value ?? "Mon";
    const dowMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    const dow  = dowMap[weekdayStr] ?? 1;

    const start = config?.sendWindowStart ?? 8;
    const end   = config?.sendWindowEnd   ?? 19;
    const days: number[] = (config as any)?.activeDays
      ? JSON.parse((config as any).activeDays)
      : [1, 2, 3, 4, 5];

    if (!days.includes(dow)) {
      console.log(`[Reminder] Hors jour ouvré (${weekdayStr}) [${tz}]`);
      return false;
    }
    if (hour < start || hour >= end) {
      console.log(`[Reminder] Hors plage (${hour}h, plage ${start}h–${end}h) [${tz}]`);
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Traite les relances dues pour un numéro de relance spécifique.
 * Utilise un verrou BD (status → PROCESSING) pour éviter les doublons
 * entre workers concurrents.
 *
 * @param reminderNumber  1 | 2 | 3 — le worker qui appelle cette fonction
 */
export async function processReminders(reminderNumber: 1 | 2 | 3): Promise<void> {
  if (!(await isWithinSendWindow())) return;

  const REMINDER_SCHEDULE = await getReminderSchedule();
  const tag = `[R${reminderNumber}]`;

  // Sélectionner les cotations dont c'est le tour pour CE numéro de relance
  // currentReminder = reminderNumber - 1 signifie que la prochaine relance est reminderNumber
  const candidates = await prisma.quotation.findMany({
    where: {
      status:          "ACTIVE",
      currentReminder: reminderNumber - 1,
      nextReminderAt:  { lte: new Date() },
    },
  });

  if (candidates.length === 0) {
    console.log(`${tag} Aucune relance due.`);
    return;
  }

  console.log(`${tag} ${candidates.length} cotation(s) à traiter.`);

  for (const quotation of candidates) {
    // ── Verrou BD : tente de passer status → PROCESSING atomiquement ──────
    // Si un autre worker a déjà pris cette cotation, updateMany retourne 0
    const locked = await prisma.quotation.updateMany({
      where: {
        id:              quotation.id,
        status:          "ACTIVE",
        currentReminder: reminderNumber - 1,
      },
      data: { status: "PROCESSING" },
    });

    if (locked.count === 0) {
      console.warn(`${tag} ${quotation.quotationId} déjà prise par un autre worker — ignorée`);
      continue;
    }

    try {
      await sendReminder(quotation, reminderNumber, REMINDER_SCHEDULE, tag);
    } catch (err) {
      // En cas d'erreur inattendue, on remet ACTIVE pour ne pas bloquer la cotation
      await prisma.quotation.update({
        where: { id: quotation.id },
        data:  { status: "ACTIVE" },
      });
      console.error(`${tag} Erreur inattendue sur ${quotation.quotationId}:`, err);
    }
  }
}

async function sendReminder(
  quotation: Awaited<ReturnType<typeof prisma.quotation.findMany>>[0],
  reminderNumber: 1 | 2 | 3,
  schedule: ReminderConfig,
  tag: string,
): Promise<void> {
  // Anti-doublon sur emailLog (sécurité supplémentaire)
  const alreadySent = await prisma.emailLog.findFirst({
    where: { quotationId: quotation.id, reminderNumber, status: { in: ["SENT", "PENDING"] } },
  });
  if (alreadySent) {
    console.warn(`${tag} Doublon emailLog — ${quotation.quotationId} #${reminderNumber} ignorée`);
    // Remettre ACTIVE car on n'a pas envoyé
    await prisma.quotation.update({ where: { id: quotation.id }, data: { status: "ACTIVE" } });
    return;
  }

  const template = await prisma.emailTemplate.findFirst({
    where: { transportType: quotation.transportType, reminderNumber, isActive: true },
    select: { id: true, subject: true, subjectEn: true, body: true, bodyEn: true },
  });
  if (!template) {
    console.warn(`${tag} Pas de template pour ${quotation.transportType} #${reminderNumber}`);
    await prisma.quotation.update({ where: { id: quotation.id }, data: { status: "ACTIVE" } });
    return;
  }

  const libelle  = (quotation as any).libelle         || quotation.clientCode;
  const lang     = (quotation as any).clientLanguage   ?? "FR";
  const isEn     = lang !== "FR" && lang !== "fr";

  // Utiliser le template EN si la langue du client n'est pas FR
  const subjectTpl = isEn && template.subjectEn ? template.subjectEn : template.subject;
  const bodyTpl    = isEn && template.bodyEn    ? template.bodyEn    : template.body;

  const subject = resolveTemplate(subjectTpl, { ...quotation, libelle });
  const html    = textToHtml(resolveTemplate(bodyTpl, { ...quotation, libelle }));

  const log = await prisma.emailLog.create({
    data: {
      quotationId:    quotation.id,
      reminderNumber,
      templateId:     template.id,
      recipientEmail: quotation.clientEmail,
      status:         "PENDING",
    },
  });

  let success  = false;
  let errorMsg: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    try {
      await sendMail({ to: quotation.clientEmail, subject, html });
      success = true;
      break;
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_RETRY) {
        await prisma.emailLog.update({
          where: { id: log.id },
          data:  { status: "RETRIED", retryCount: attempt + 1 },
        });
      }
    }
  }

  const transportSchedule = schedule[quotation.transportType as TransportType];
  const nextSchedule      = transportSchedule?.find((s) => s.reminderNumber === reminderNumber + 1);

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
        currentReminder: reminderNumber,
        // Libère le verrou : PROCESSING → CLOSED (fin des relances sans réponse) ou ACTIVE
        status:          reminderNumber === 3 ? "CLOSED" : "ACTIVE",
        nextReminderAt:  nextSchedule
          ? addHours(quotation.transmissionDate, nextSchedule.delayHours)
          : null,
      },
    }),
  ]);

  console.log(`${tag} ${success ? "✓" : "✗"} ${quotation.quotationId} → ${quotation.clientEmail}`);
}
