import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY manquante ou invalide dans .env");
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const iv     = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const enc    = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${enc.toString("hex")}`;
}

export function decrypt(stored: string): string {
  if (!stored || !stored.includes(":")) return "";
  try {
    const [ivHex, encHex] = stored.split(":");
    const iv       = Buffer.from(ivHex, "hex");
    const enc      = Buffer.from(encHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}
