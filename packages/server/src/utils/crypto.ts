import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY_HEX   = process.env.ENCRYPTION_KEY ?? "";

function getKey(): Buffer {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error(
      "[Crypto] ENCRYPTION_KEY manquante ou invalide. " +
      "Générez-en une avec : node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" " +
      "et ajoutez-la dans .env sous ENCRYPTION_KEY."
    );
  }
  return Buffer.from(KEY_HEX, "hex");
}

/**
 * Chiffre une chaîne avec AES-256-CBC.
 * Retourne "iv:ciphertext" en hex — safe à stocker en BD.
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const iv     = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const enc    = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${enc.toString("hex")}`;
}

/**
 * Déchiffre une valeur produite par encrypt().
 * Retourne "" si la valeur est vide ou invalide.
 */
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
