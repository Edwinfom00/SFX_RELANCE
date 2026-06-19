"use server";

import path from "path";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import nodemailer from "nodemailer";
import { parseRecipientEmails } from "@/lib/email";
import { findQuotationPdf } from "@/lib/pdf";
import type { OutgoingQuotationFilters } from "../types";
import { getOutgoingQuotations } from "../models";

export async function getOutgoingQuotationsAction(
  filters: OutgoingQuotationFilters = {},
  page = 1,
) {
  return getOutgoingQuotations(filters, page);
}

function resolveTemplate(
  text: string,
  q: { noPiece: string; clientCode: string; clientName: string; libelle: string },
): string {
  return text
    .replace(/\{\{quote\.id\}\}/g,          q.noPiece)
    .replace(/\{\{quote\.libelle\}\}/g,      q.libelle || q.noPiece)
    .replace(/\{\{quote\.client\}\}/g,       q.clientCode)
    .replace(/\{\{quote\.clientName\}\}/g,   q.clientName || q.clientCode)
    .replace(/\{\{user\.fullName\}\}/g,      process.env.SMTP_SENDER_NAME  ?? "Service Commercial")
    .replace(/\{\{user\.phone\}\}/g,         process.env.SMTP_SENDER_PHONE ?? "");
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

export type TransmitResult =
  | { success: true }
  | { success: false; error: string; errorType: "NO_PDF" | "NO_TEMPLATE" | "NO_EMAIL" | "NO_SMTP" | "SEND_FAILED" | "BRAINOPX_FAILED" | "NOT_FOUND" | "ALREADY_SENT" };

export async function transmitOutgoingQuotationAction(id: number): Promise<TransmitResult> {
  try {
    const q = await prisma.outgoingQuotation.findUnique({ where: { id } });
    if (!q) return { success: false, error: "Cotation introuvable.", errorType: "NOT_FOUND" };
    if (q.status === "SENT")    return { success: false, error: "Cette cotation a déjà été transmise.", errorType: "ALREADY_SENT" };
    if (q.status === "SENDING") return { success: false, error: "Transmission déjà en cours.", errorType: "ALREADY_SENT" };

    // Verrou optimiste
    const locked = await prisma.outgoingQuotation.updateMany({
      where: { id, status: "PENDING" },
      data:  { status: "SENDING" },
    });
    if (locked.count === 0) {
      return { success: false, error: "La cotation est déjà en cours de traitement.", errorType: "ALREADY_SENT" };
    }

    // 1. Vérification PDF — obligatoire pour la transmission initiale
    const pdfResult = findQuotationPdf(q.noPiece, q.paysCode, q.agenceCode);
    if (pdfResult.error || !pdfResult.filePath) {
      const detail = pdfResult.errorDetails ?? "PDF introuvable. Veuillez générer ou déposer le PDF de la cotation avant de transmettre.";
      await prisma.outgoingQuotation.update({ where: { id }, data: { status: "PENDING", errorMessage: detail } });
      return { success: false, error: detail, errorType: "NO_PDF" };
    }

    // 2. Template TRANSMISSION
    const template = await prisma.emailTemplate.findFirst({
      where: { transportType: q.transportType, category: "TRANSMISSION", isActive: true },
      select: { subject: true, subjectEn: true, body: true, bodyEn: true },
    });
    if (!template) {
      const detail = `Aucun template de transmission actif pour le transport "${q.transportType}". Veuillez en créer un dans la bibliothèque de templates.`;
      await prisma.outgoingQuotation.update({ where: { id }, data: { status: "PENDING", errorMessage: detail } });
      return { success: false, error: detail, errorType: "NO_TEMPLATE" };
    }

    // 3. Langue
    const isEn = q.clientLanguage !== "FR" && q.clientLanguage !== "fr";
    const subjectTpl = isEn && template.subjectEn ? template.subjectEn : template.subject;
    const bodyTpl    = isEn && template.bodyEn    ? template.bodyEn    : template.body;

    const ctx = { noPiece: q.noPiece, clientCode: q.clientCode, clientName: q.clientName, libelle: q.libelle || q.dossierRef };
    const subject = resolveTemplate(subjectTpl, ctx);
    const html    = textToHtml(resolveTemplate(bodyTpl, ctx));

    // 4. Email destinataire (table Client locale > BrainOPX)
    let recipientEmail = q.clientEmail;
    try {
      const localClient = await prisma.client.findUnique({ where: { code: q.clientCode }, select: { emails: true } });
      if (localClient?.emails) recipientEmail = localClient.emails;
    } catch {}

    if (!recipientEmail) {
      const detail = `Aucun email configuré pour le client ${q.clientCode}.`;
      await prisma.outgoingQuotation.update({ where: { id }, data: { status: "PENDING", errorMessage: detail } });
      return { success: false, error: detail, errorType: "NO_EMAIL" };
    }

    // 5. Config SMTP
    const config = await prisma.workerConfig.findFirst();
    const smtpHost   = config?.smtpHost   || process.env.SMTP_HOST   || "";
    const smtpPort   = config?.smtpPort   || Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = config?.smtpSecure ?? false;
    const smtpUser   = config?.smtpUser   || process.env.SMTP_USER   || "";
    const smtpPass   = config?.smtpPass ? decrypt(config.smtpPass) : (process.env.SMTP_PASS || "");
    const smtpFrom   = config?.smtpFrom   || process.env.SMTP_FROM   || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      await prisma.outgoingQuotation.update({ where: { id }, data: { status: "PENDING" } });
      return { success: false, error: "Configuration SMTP incomplète. Vérifiez les paramètres dans le menu Worker.", errorType: "NO_SMTP" };
    }

    const { to, cc } = parseRecipientEmails(recipientEmail);
    const attachments = [{ filename: path.basename(pdfResult.filePath), path: pdfResult.filePath }];

    // 6. Envoi email
    const transporter = nodemailer.createTransport({
      host: smtpHost, port: smtpPort, secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      tls:  { rejectUnauthorized: false },
    });

    try {
      await transporter.sendMail({ from: smtpFrom, to, cc: cc || undefined, subject, html, attachments });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await prisma.outgoingQuotation.update({ where: { id }, data: { status: "PENDING", errorMessage: `Erreur envoi: ${detail}` } });
      return { success: false, error: `Échec de l'envoi email : ${detail}`, errorType: "SEND_FAILED" };
    }

    // 7. Écriture de la date de transmission dans BrainOPX
    const db = process.env.BRAINOPX_DATABASE ?? "BopxFMT";
    try {
      await prisma.$queryRawUnsafe(
        `EXEC [${db}].[dbo].[sp_sfx_SetTransmissionDate] @NoPiece = N'${q.noPiece.replace(/'/g, "''")}', @DateTransmission = NULL`
      );
    } catch (err) {
      // Email envoyé — on marque SENT mais on signale l'erreur BrainOPX
      const detail = err instanceof Error ? err.message : String(err);
      await prisma.outgoingQuotation.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), errorMessage: `BrainOPX: ${detail}` } });
      revalidatePath("/outgoing-quotations");
      return {
        success: false,
        error:   `Email envoyé avec succès mais la date de transmission n'a pas pu être écrite dans BrainOPX : ${detail}`,
        errorType: "BRAINOPX_FAILED",
      };
    }

    // 8. Succès complet
    await prisma.outgoingQuotation.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), errorMessage: null } });
    revalidatePath("/outgoing-quotations");
    return { success: true };

  } catch (err) {
    // Erreur inattendue — relâche le verrou
    await prisma.outgoingQuotation.updateMany({ where: { id, status: "SENDING" }, data: { status: "PENDING" } });
    return { success: false, error: err instanceof Error ? err.message : String(err), errorType: "SEND_FAILED" };
  }
}
