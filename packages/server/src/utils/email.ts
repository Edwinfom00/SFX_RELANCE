/**
 * Découpe une chaîne d'adresses email séparées par des virgules.
 * Retourne le premier email dans `to` (destinataire principal)
 * et le reste dans `cc` (concaténé par des virgules).
 */
export function parseRecipientEmails(emailField: string): { to: string; cc: string } {
  if (!emailField) return { to: "", cc: "" };
  
  const emails = emailField
    .split(/[;,]/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
    
  if (emails.length === 0) return { to: "", cc: "" };
  
  const to = emails[0];
  const cc = emails.slice(1).join(", ");
  
  return { to, cc };
}
