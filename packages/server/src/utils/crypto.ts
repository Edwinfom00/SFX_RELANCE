import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  if (!hex || hex.length !== 64) {
    throw new Error("[Crypto] ENCRYPTION_KEY manquante ou invalide dans .env (doit être 64 hex chars).");
  }
  return Buffer.from(hex, "hex");
}

/** Chiffre une chaîne avec AES-256-CBC. Retourne "iv:ciphertext" en hex. */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const iv  = randomBytes(16);
  const c   = createCipheriv(ALGORITHM, getKey(), iv);
  const enc = Buffer.concat([c.update(plaintext, "utf8"), c.final()]);
  return `${iv.toString("hex")}:${enc.toString("hex")}`;
}

/** Déchiffre une valeur produite par encrypt(). Retourne "" si invalide. */
export function decrypt(stored: string): string {
  if (!stored || !stored.includes(":")) return "";
  try {
    const [ivHex, encHex] = stored.split(":");
    const d   = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
    return Buffer.concat([d.update(Buffer.from(encHex, "hex")), d.final()]).toString("utf8");
  } catch {
    return "";
  }
}
