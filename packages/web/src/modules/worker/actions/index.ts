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
    } as any);

    await transporter.sendMail({
  from,
  to,
  subject: "✅ Test SMTP réussi — SFX Relance",
  html: `
    <div style="background-color: #f4f7fa; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden;">
        
        <div style="background-color: #0057ff; padding: 24px 20px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 600; letter-spacing: 0.5px;">
            SFX Relance — Diagnostic
          </h1>
        </div>

        <div style="padding: 30px;">
          
          <div style="background-color: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; padding: 16px; margin-bottom: 25px; text-align: center;">
            <p style="margin: 0; color: #276749; font-size: 16px; font-weight: 600;">
              ✅ La configuration SMTP est opérationnelle
            </p>
          </div>

          <p style="margin: 0 0 20px; color: #4a5568; font-size: 15px; line-height: 1.6;">
            Ce message automatique confirme que votre application arrive à communiquer correctement avec votre serveur de messagerie.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 10px;">
            <p style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px; font-weight: 600;">
              Paramètres de connexion
            </p>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #2d3748; text-align: left;">
              <tr>
                <td style="padding-bottom: 12px; width: 90px; color: #718096;">Serveur</td>
                <td style="padding-bottom: 12px;">
                  <code style="background-color: #edf2f7; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 13px;">${host}:${port}</code>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px; color: #718096;">Utilisateur</td>
                <td style="padding-bottom: 12px;">
                  <code style="background-color: #edf2f7; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 13px;">${user}</code>
                </td>
              </tr>
              <tr>
                <td style="color: #718096;">Sécurité</td>
                <td>
                  <code style="background-color: #edf2f7; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 13px;">${secure ? "TLS (Activé)" : "STARTTLS"}</code>
                </td>
              </tr>
            </table>
          </div>

        </div>

        <div style="background-color: #f8fafc; border-top: 1px solid #edf2f7; padding: 20px; text-align: center;">
          <p style="font-size: 12px; color: #a0aec0; margin: 0 0 5px;">
            Ceci est un message de test technique généré par votre système.
          </p>
          <p style="font-size: 12px; color: #a0aec0; margin: 0;">
            © ${new Date().getFullYear()} SFX Relance
          </p>
        </div>

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
