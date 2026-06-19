/**
 * Script de test : crée une OutgoingQuotation de test avec un PDF existant
 * Exécuter avec : npx tsx src/scripts/create-test-outgoing.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const noPiece = "FM1XX250708";

  // Supprimer l'ancienne si elle existe (pour pouvoir re-tester)
  const existing = await prisma.outgoingQuotation.findUnique({ where: { noPiece } });
  if (existing) {
    await prisma.outgoingQuotation.delete({ where: { noPiece } });
    console.log(`✓ Ancienne cotation de test supprimée (id=${existing.id})`);
  }

  // Chercher un client existant pour avoir un vrai email
  const client = await prisma.client.findFirst({
    where: { emails: { not: "" } },
    select: { code: true, name: true, emails: true },
  });

  const created = await prisma.outgoingQuotation.create({
    data: {
      noPiece,
      noProvisoire:    "PROV-TEST-001",
      clientCode:      client?.code      ?? "FM1C0001",
      clientName:      client?.name      ?? "Client Test SFX",
      clientEmail:     client?.emails    ?? "test@sfx-logistics.com",
      clientLanguage:  "FR",
      libelle:         "Transport Douala → Yaoundé — Marchandises diverses",
      transportType:   "ROAD",
      typeActivite:    "ROUTE",
      agenceCode:      "DLA",
      agence:          "Douala",
      dossierRef:      "DOS-TEST-2025",
      division:        "SFX Cameroun",
      devise:          "XAF",
      montant:         1_250_000,
      dateTransaction: new Date("2025-07-08"),
      dateExpiration:  new Date("2025-07-22"),
      responsable:     "Service Commercial",
      observations:    "Cotation de test — ne pas transmettre en production.",
      paysCode:        "CMR",
      status:          "PENDING",
    },
  });

  console.log(`\n✅ Cotation de test créée :`);
  console.log(`   ID         : ${created.id}`);
  console.log(`   N° Pièce   : ${created.noPiece}`);
  console.log(`   Client     : ${created.clientName} (${created.clientCode})`);
  console.log(`   Email      : ${created.clientEmail}`);
  console.log(`   Transport  : ${created.transportType}`);
  console.log(`   Montant    : ${created.montant?.toLocaleString("fr-FR")} ${created.devise}`);
  console.log(`   PDF attendu: test-pdfs/CMR/DLA/${created.noPiece}.pdf ✓`);
  console.log(`   Statut     : ${created.status}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
