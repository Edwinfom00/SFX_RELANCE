import path from "path";
import prisma from "../utils/prisma";
import { sendMail } from "./mailer.service";
import { parseRecipientEmails } from "../utils/email";
import { findQuotationPdf } from "../utils/pdf";

function resolveTemplate(
  text: string,
  q: { noPiece: string; clientCode: string; clientName: string; libelle: string },
): string {
  return text
    .replace(/\{\{quote\.id\}\}/g,      q.noPiece)
    .replace(/\{\{quote\.libelle\}\}/g,  q.libelle || q.noPiece)
    .replace(/\{\{quote\.client\}\}/g,   q.clientCode)
    .replace(/\{\{quote\.clientName\}\}/g, q.clientName || q.clientCode)
    .replace(/\{\{user\.fullName\}\}/g,  process.env.SMTP_SENDER_NAME  ?? "Service Commercial")
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

async function writeTransmissionDateToBrainOpx(noPiece: string): Promise<void> {
  const db = process.env.BRAINOPX_DATABASE ?? "BopxFMT";
  try {
    await prisma.$queryRawUnsafe(
      `EXEC [${db}].[dbo].[sp_sfx_SetTransmissionDate] @NoPiece = N'${noPiece.replace(/'/g, "''")}', @DateTransmission = NULL`
    );
    console.log(`[Transmission] Date de transmission écrite dans BrainOPX pour ${noPiece}`);
  } catch (err) {
    console.error(`[Transmission] Erreur SP BrainOPX pour ${noPiece}:`, err);
    throw err;
  }
}

export interface TransmitResult {
  success: boolean;
  error?: string;
  errorType?: "NO_PDF" | "NO_TEMPLATE" | "NO_EMAIL" | "SEND_FAILED" | "BRAINOPX_FAILED" | "NOT_FOUND" | "ALREADY_SENT";
}

export async function transmitOutgoingQuotation(id: number): Promise<TransmitResult> {
  const q = await prisma.outgoingQuotation.findUnique({ where: { id } });

  if (!q) return { success: false, error: "Cotation introuvable.", errorType: "NOT_FOUND" };
  if (q.status === "SENT") return { success: false, error: "Cette cotation a déjà été transmise.", errorType: "ALREADY_SENT" };
  if (q.status === "SENDING") return { success: false, error: "Transmission déjà en cours.", errorType: "ALREADY_SENT" };

  // Verrou optimiste : PENDING → SENDING
  const locked = await prisma.outgoingQuotation.updateMany({
    where: { id, status: "PENDING" },
    data:  { status: "SENDING" },
  });
  if (locked.count === 0) {
    return { success: false, error: "La cotation est déjà en cours de traitement.", errorType: "ALREADY_SENT" };
  }

  try {
    // 1. Vérifier le PDF — obligatoire pour la transmission
    const pdfResult = findQuotationPdf(q.noPiece, q.paysCode, q.agenceCode);
    if (pdfResult.error || !pdfResult.filePath) {
      const detail = pdfResult.errorDetails ?? "PDF introuvable.";
      await prisma.outgoingQuotation.update({
        where: { id },
        data:  { status: "PENDING", errorMessage: detail },
      });
      return { success: false, error: detail, errorType: "NO_PDF" };
    }

    // 2. Chercher le template TRANSMISSION pour ce type de transport
    const template = await prisma.emailTemplate.findFirst({
      where: { transportType: q.transportType, category: "TRANSMISSION", isActive: true },
      select: { subject: true, subjectEn: true, body: true, bodyEn: true },
    });
    if (!template) {
      const detail = `Aucun template de transmission actif trouvé pour le transport ${q.transportType}.`;
      await prisma.outgoingQuotation.update({
        where: { id },
        data:  { status: "PENDING", errorMessage: detail },
      });
      return { success: false, error: detail, errorType: "NO_TEMPLATE" };
    }

    // 3. Résolution langue (FR par défaut)
    const isEn = q.clientLanguage !== "FR" && q.clientLanguage !== "fr";
    const subjectTpl = isEn && template.subjectEn ? template.subjectEn : template.subject;
    const bodyTpl    = isEn && template.bodyEn    ? template.bodyEn    : template.body;

    const ctx = {
      noPiece:    q.noPiece,
      clientCode: q.clientCode,
      clientName: q.clientName,
      libelle:    q.libelle || q.dossierRef,
    };
    const subject = resolveTemplate(subjectTpl, ctx);
    const html    = textToHtml(resolveTemplate(bodyTpl, ctx));

    // 4. Résolution email (table Client locale > clientEmail BrainOPX)
    let recipientEmail = q.clientEmail;
    try {
      const localClient = await prisma.client.findUnique({
        where: { code: q.clientCode },
        select: { emails: true },
      });
      if (localClient?.emails) recipientEmail = localClient.emails;
    } catch {}

    if (!recipientEmail) {
      const detail = `Aucun email configuré pour le client ${q.clientCode}.`;
      await prisma.outgoingQuotation.update({
        where: { id },
        data:  { status: "PENDING", errorMessage: detail },
      });
      return { success: false, error: detail, errorType: "NO_EMAIL" };
    }

    const { to, cc } = parseRecipientEmails(recipientEmail);
    const attachments = [{
      filename: path.basename(pdfResult.filePath),
      path:     pdfResult.filePath,
    }];

    // 5. Envoi email
    try {
      await sendMail({ to, cc: cc || undefined, subject, html, attachments });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await prisma.outgoingQuotation.update({
        where: { id },
        data:  { status: "PENDING", errorMessage: `Erreur envoi: ${detail}` },
      });
      return { success: false, error: `Échec de l'envoi email : ${detail}`, errorType: "SEND_FAILED" };
    }

    // 6. Écrire la date de transmission dans BrainOPX
    try {
      await writeTransmissionDateToBrainOpx(q.noPiece);
    } catch (err) {
      // L'email a été envoyé — on marque SENT quand même mais on signale l'erreur BrainOPX
      const detail = err instanceof Error ? err.message : String(err);
      await prisma.outgoingQuotation.update({
        where: { id },
        data:  { status: "SENT", sentAt: new Date(), errorMessage: `BrainOPX SP error: ${detail}` },
      });
      return {
        success: false,
        error: `Email envoyé mais la date de transmission n'a pas pu être écrite dans BrainOPX : ${detail}`,
        errorType: "BRAINOPX_FAILED",
      };
    }

    // 7. Tout réussi
    await prisma.outgoingQuotation.update({
      where: { id },
      data:  { status: "SENT", sentAt: new Date(), errorMessage: null },
    });

    console.log(`[Transmission] ✓ ${q.noPiece} → ${to}${cc ? ` (CC: ${cc})` : ""}`);
    return { success: true };

  } catch (err) {
    // Erreur inattendue : relibère le verrou
    await prisma.outgoingQuotation.update({
      where: { id },
      data:  { status: "PENDING" },
    });
    throw err;
  }
}
