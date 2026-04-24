import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { decrypt } from "../utils/crypto";
import prisma from "../utils/prisma";

let transporter: Transporter | null = null;
let lastConfigHash = "";

async function getTransporter(): Promise<Transporter> {
  const config = await prisma.workerConfig.findFirst({
    select: { smtpHost: true, smtpPort: true, smtpSecure: true, smtpUser: true, smtpPass: true },
  });

  const host   = config?.smtpHost   || process.env.SMTP_HOST   || "";
  const port   = config?.smtpPort   || Number(process.env.SMTP_PORT) || 587;
  const secure = config?.smtpSecure ?? (process.env.SMTP_SECURE === "true");
  const user   = config?.smtpUser   || process.env.SMTP_USER   || "";
  const pass   = config?.smtpPass   ? decrypt(config.smtpPass) : (process.env.SMTP_PASS || "");
  const hash   = `${host}:${port}:${secure}:${user}:${pass}`;

  if (!transporter || hash !== lastConfigHash) {
    transporter = nodemailer.createTransport({
      host, port, secure, auth: { user, pass },
      family: 4,
      tls: { rejectUnauthorized: false },
    } as any);
    lastConfigHash = hash;
  }

  return transporter;
}


export async function sendMail(options: { to: string; subject: string; html: string }): Promise<void> {
  const t = await getTransporter();
  const config = await prisma.workerConfig.findFirst({ select: { smtpFrom: true } });
  const from = config?.smtpFrom || process.env.SMTP_FROM || "";
  await t.sendMail({ from, ...options });
}
