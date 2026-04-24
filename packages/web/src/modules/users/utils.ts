/** Valide la complexité d'un mot de passe. Retourne un message d'erreur ou null. */
export function validatePassword(password: string): string | null {
  if (password.length < 8)             return "Au moins 8 caractères requis.";
  if (!/[A-Z]/.test(password))         return "Au moins une majuscule requise.";
  if (!/[a-z]/.test(password))         return "Au moins une minuscule requise.";
  if (!/[0-9]/.test(password))         return "Au moins un chiffre requis.";
  if (!/[^A-Za-z0-9]/.test(password))  return "Au moins un caractère spécial requis (!@#$%...).";
  return null;
}

/** Génère un mot de passe temporaire sécurisé (12 caractères). */
export function generateTempPassword(): string {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  const special = "!@#$%&*";
  const all     = upper + lower + digits + special;
  const rand    = (s: string) => s[Math.floor(Math.random() * s.length)];
  const base    = [rand(upper), rand(lower), rand(digits), rand(special)];
  for (let i = 0; i < 8; i++) base.push(rand(all));
  return base.sort(() => Math.random() - 0.5).join("");
}
