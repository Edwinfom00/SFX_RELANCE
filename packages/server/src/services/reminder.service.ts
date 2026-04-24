import prisma from "../utils/prisma";
import { sendMail } from "./mailer.service";
import { addHours } from "../utils/date";
import { MAX_RETRY } from "../config/reminder.config";
import type { TransportType } from "../types";

type ReminderSchedule = Array<{ reminderNumber: number; delayHours: number }>;
type ReminderConfig = Record<string, ReminderSchedule>;

const DEFAULT_SCHEDULE: ReminderConfig = {
  AIR:  [{ reminderNumber: 1, delayHours: 24 }, { reminderNumber: 2, delayHours: 48 },  { reminderNumber: 3, delayHours: 72  }],
  SEA:  [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 },  { reminderNumber: 3, delayHours: 168 }],
  ROAD: [{ reminderNumber: 1, delayHours: 48 }, { reminderNumber: 2, delayHours: 96 },  { reminderNumber: 3, delayHours: 168 }],
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
    .replace(/>/g, "&gt;");


  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1a202c; font-weight: 600;">$1</strong>');
 
  html = html.replace(/\*(.*?)\*/g, '<em style="color: #4a5568;">$1</em>');

  html = html
    .replace(/---/g, '</p><hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;"><p style="margin: 0 0 16px; color: #4a5568;">')
    .replace(/\n\n/g, '</p><p style="margin: 0 0 16px; color: #4a5568;">')
    .replace(/\n/g, "<br>")
    .replace(/^/, '<p style="margin: 0 0 16px; color: #4a5568;">')
    .replace(/$/, '</p>');

  html = html.replace(/<p[^>]*><\/p>/g, '');

  return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #4a5568; max-width: 100%;">
      ${html}
    </div>
  `.trim();
}


async function isWithinSendWindow(): Promise<boolean> {
  try {
    const config = await prisma.workerConfig.findFirst({
      select: { sendWindowStart: true, sendWindowEnd: true, activeDays: true, timezone: true },
    });

    const tz = (config as any)?.timezone ?? "Africa/Douala";
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour: "numeric", weekday: "short", hour12: false,
    }).formatToParts(new Date());

    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
    const dowMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    const dow = dowMap[weekdayStr] ?? 1;

    const start = config?.sendWindowStart ?? 8;
    const end   = config?.sendWindowEnd   ?? 19;
    const days: number[] = (config as any)?.activeDays ? JSON.parse((config as any).activeDays) : [1, 2, 3, 4, 5];

    if (!days.includes(dow)) {
      console.log(`[Reminder] Hors jour ouvré (${weekdayStr}) [${tz}] — suspendu`);
      return false;
    }
    if (hour < start || hour >= end) {
      console.log(`[Reminder] Hors plage (${hour}h, plage ${start}h–${end}h) [${tz}] — suspendu`);
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export async function processReminders(): Promise<void> {
  if (!(await isWithinSendWindow())) return;

  const REMINDER_SCHEDULE = await getReminderSchedule();

  const quotations = await prisma.quotation.findMany({
    where: { status: "ACTIVE", nextReminderAt: { lte: new Date() }, currentReminder: { lt: 3 } },
  });

  if (quotations.length === 0) {
    console.log("[Reminder] Aucune relance due.");
    return;
  }

  console.log(`[Reminder] ${quotations.length} relance(s) à traiter.`);

  for (const quotation of quotations) {
    const nextReminderNumber = (quotation.currentReminder + 1) as 1 | 2 | 3;

    const alreadySent = await prisma.emailLog.findFirst({
      where: { quotationId: quotation.id, reminderNumber: nextReminderNumber, status: { in: ["SENT", "PENDING"] } },
    });
    if (alreadySent) {
      console.warn(`[Reminder] Doublon — ${quotation.quotationId} #${nextReminderNumber} ignorée`);
      continue;
    }

    const template = await prisma.emailTemplate.findFirst({
      where: { transportType: quotation.transportType, reminderNumber: nextReminderNumber, isActive: true },
    });
    if (!template) {
      console.warn(`[Reminder] Pas de template pour ${quotation.transportType} #${nextReminderNumber} — ignorée`);
      continue;
    }

    const libelle = (quotation as any).libelle || quotation.clientCode;
    const subject = resolveTemplate(template.subject, { ...quotation, libelle });
    const html    = textToHtml(resolveTemplate(template.body, { ...quotation, libelle }));

    const log = await prisma.emailLog.create({
      data: { quotationId: quotation.id, reminderNumber: nextReminderNumber, templateId: template.id, recipientEmail: quotation.clientEmail, status: "PENDING" },
    });

    let success = false;
    let errorMsg: string | undefined;

    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        await sendMail({ to: quotation.clientEmail, subject, html });
        success = true;
        break;
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
        if (attempt < MAX_RETRY) {
          await prisma.emailLog.update({ where: { id: log.id }, data: { status: "RETRIED", retryCount: attempt + 1 } });
        }
      }
    }

    const schedule     = REMINDER_SCHEDULE[quotation.transportType as TransportType];
    const nextSchedule = schedule.find((s) => s.reminderNumber === nextReminderNumber + 1);

    await prisma.$transaction([
      prisma.emailLog.update({
        where: { id: log.id },
        data: { status: success ? "SENT" : "FAILED", sentAt: success ? new Date() : null, errorMessage: errorMsg ?? null },
      }),
      prisma.quotation.update({
        where: { id: quotation.id },
        data: {
          currentReminder: nextReminderNumber,
          status:          nextReminderNumber === 3 ? "COMPLETED" : "ACTIVE",
          nextReminderAt:  nextSchedule ? addHours(quotation.transmissionDate, nextSchedule.delayHours) : null,
        },
      }),
    ]);

    console.log(`[Reminder] ${success ? "✓" : "✗"} ${quotation.quotationId} — relance #${nextReminderNumber} → ${quotation.clientEmail}`);
  }
}
