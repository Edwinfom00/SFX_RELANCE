"use server";

import { revalidatePath } from "next/cache";
import { updateWorkerConfig, type UpdateWorkerConfigInput } from "../models";
import { decrypt } from "@/lib/crypto";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function updateWorkerConfigAction(data: UpdateWorkerConfigInput) {
  await updateWorkerConfig(data);
  revalidatePath("/worker");
}

export async function sendSmtpTestAction(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await prisma.workerConfig.findFirst();
    if (!config) return { success: false, error: "Aucune configuration SMTP trouvée." };

    const host   = config.smtpHost;
    const port   = config.smtpPort;
    const secure = config.smtpSecure;
    const user   = config.smtpUser;
    const pass   = decrypt((config as any).smtpPass ?? "");
    const from   = config.smtpFrom || user;

    if (!host || !user || !pass) {
      return { success: false, error: "Configuration SMTP incomplète (hôte, utilisateur ou mot de passe manquant)." };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      family: 4,
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from,
      to,
      subject: "✅ Test SMTP — SFX Relance",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <div style="background:#0057ff;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
            <b style="font-size:16px;">SFX Relance — Test SMTP</b>
          </div>
          <div style="border:1px solid #e6ebf1;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 12px;color:#0a2540;">
              ✅ La configuration SMTP est <b>opérationnelle</b>.
            </p>
            <p style="margin:0;color:#697386;font-size:13px;">
              Serveur : <code>${host}:${port}</code><br>
              Utilisateur : <code>${user}</code><br>
              TLS : ${secure ? "Oui" : "Non (STARTTLS)"}
            </p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
