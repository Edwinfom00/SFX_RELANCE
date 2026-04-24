"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission } from "../models";
import { validatePassword, generateTempPassword } from "../utils";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { decrypt } from "@/lib/crypto";

async function requireAdmin() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId) throw new Error("Non authentifié.");
  const ok = await hasPermission(userId, "users:manage");
  if (!ok) throw new Error("Permission refusée.");
  return userId;
}

async function sendInviteEmail(to: string, name: string, tempPassword: string) {
  const config = await prisma.workerConfig.findFirst();
  const host   = config?.smtpHost   || process.env.SMTP_HOST   || "";
  const port   = config?.smtpPort   || Number(process.env.SMTP_PORT) || 587;
  const secure = config?.smtpSecure ?? false;
  const user   = config?.smtpUser   || process.env.SMTP_USER   || "";
  const pass   = (config as any)?.smtpPass
    ? decrypt((config as any).smtpPass)
    : (process.env.SMTP_PASS || "");
  const from   = config?.smtpFrom   || process.env.SMTP_FROM   || user;

  if (!host || !user || !pass) return; // SMTP non configuré — on skip silencieusement

  const transporter = nodemailer.createTransport({
    host, port, secure, auth: { user, pass },
    tls: { rejectUnauthorized: false },
  } as any);

  const appUrl = process.env.AUTH_URL ?? "http://localhost:3001";

  await transporter.sendMail({
  from,
  to,
  subject: "Bienvenue sur SFX Relance - Vos identifiants d'accès",
  html: `
    <div style="background-color: #f4f7fa; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden;">
        
        <div style="background-color: #0057ff; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 600; letter-spacing: 0.5px;">
            SFX Relance
          </h1>
        </div>

        <div style="padding: 30px;">
          <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px;">
            Bonjour <b>${name}</b>,
          </p>
          <p style="margin: 0 0 25px; color: #4a5568; font-size: 15px; line-height: 1.6;">
            Bienvenue ! Un compte a été créé pour vous sur la plateforme <b>SFX Relance</b>. Voici vos identifiants temporaires pour y accéder :
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 25px;">
            
            <p style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; font-weight: 600;">
              Votre identifiant
            </p>
            <p style="font-size: 15px; color: #1a202c; font-weight: 500; margin: 0 0 20px;">
              ${to}
            </p>

            <p style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; font-weight: 600;">
              Mot de passe temporaire
            </p>
            <div style="background-color: #ebf4ff; border: 1px dashed #0057ff; color: #0057ff; font-size: 22px; font-family: 'Courier New', Courier, monospace; font-weight: 700; padding: 12px; border-radius: 6px; text-align: center; letter-spacing: 4px;">
              ${tempPassword}
            </div>
            
          </div>

          <div style="background-color: #fffaf0; border-left: 4px solid #ed8936; padding: 12px 16px; margin-bottom: 30px; border-radius: 0 4px 4px 0;">
            <p style="margin: 0; font-size: 13.5px; color: #c05621; line-height: 1.5;">
              <b>⚠️ Action requise :</b> Pour des raisons de sécurité, vous devrez obligatoirement modifier ce mot de passe lors de votre première connexion.
            </p>
          </div>

          <div style="text-align: center;">
            <a href="${appUrl}/login" style="display: inline-block; background-color: #0057ff; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: background-color 0.3s ease;">
              Se connecter à mon espace →
            </a>
          </div>
        </div>

        <div style="background-color: #f8fafc; border-top: 1px solid #edf2f7; padding: 20px; text-align: center;">
          <p style="font-size: 12px; color: #a0aec0; margin: 0 0 5px;">
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
          <p style="font-size: 12px; color: #a0aec0; margin: 0;">
            © ${new Date().getFullYear()} SFX Relance. Tous droits réservés.
          </p>
        </div>

      </div>
    </div>
  `,
});
}

// ── Actions ────────────────────────────────────────────────────────────────

export async function createUserAction(data: {
  name: string;
  email: string;
  roleIds: number[];
}): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
  try {
    await requireAdmin();

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "Un utilisateur avec cet email existe déjà." };

    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email:             data.email,
        name:              data.name,
        passwordHash:      hash,
        isActive:          true,
        mustChangePassword: true,
        userRoles: {
          create: data.roleIds.map((roleId) => ({ roleId })),
        },
      },
    });

    // Envoyer l'email d'invitation (non bloquant)
    sendInviteEmail(data.email, data.name, tempPassword).catch(() => {});

    revalidatePath("/users");
    return { success: true, tempPassword };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateUserAction(
  id: number,
  data: { name?: string; email?: string; roleIds?: number[]; isActive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const payload: Record<string, any> = {};
    if (data.name     !== undefined) payload.name     = data.name;
    if (data.email    !== undefined) payload.email    = data.email;
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    await prisma.user.update({ where: { id }, data: payload });

    if (data.roleIds !== undefined) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      if (data.roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: data.roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    }

    revalidatePath("/users");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function resetPasswordAction(
  id: number
): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
  try {
    await requireAdmin();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: "Utilisateur introuvable." };

    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { passwordHash: hash, mustChangePassword: true },
    });

    sendInviteEmail(user.email, user.name, tempPassword).catch(() => {});

    revalidatePath("/users");
    return { success: true, tempPassword };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function toggleUserActiveAction(
  id: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const currentUserId = Number(session?.user?.id);
    if (id === currentUserId) return { success: false, error: "Vous ne pouvez pas désactiver votre propre compte." };

    await requireAdmin();
    await prisma.user.update({ where: { id }, data: { isActive } });
    revalidatePath("/users");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Changement de mot de passe par l'utilisateur lui-même */
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const userId = Number(session?.user?.id);
    if (!userId) return { success: false, error: "Non authentifié." };

    const validationError = validatePassword(newPassword);
    if (validationError) return { success: false, error: validationError };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Utilisateur introuvable." };

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return { success: false, error: "Mot de passe actuel incorrect." };

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash, mustChangePassword: false },
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
