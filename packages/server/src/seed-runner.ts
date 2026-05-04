/**
 * Seed runner — compilé avec le reste du projet
 * Exécuter avec : node dist/seed-runner.js
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FR_RELANCE_1 = `Cher Client,

Je reviens vers vous concernant notre cotation n° {{quote.id}} que je vous ai adressée pour {{quote.libelle}}.

Avez-vous eu le temps d'en prendre connaissance ?

Je reste à votre entière disposition pour répondre à vos questions ou pour ajuster cette proposition selon vos besoins.

Dans l'attente de votre retour, je vous souhaite une excellente journée.

{{user.fullName}}
Service Cotations — SFX Logistics
{{user.phone}}`;

const FR_RELANCE_2_AIR = `Cher Client,

N'ayant pas eu de retour de votre part concernant notre offre n° {{quote.id}}, je me permets de vous recontacter.

Pourriez-vous m'indiquer si vous comptez donner suite à notre cotation ?

Je reste à votre entière disposition pour répondre à vos questions ou pour ajuster cette proposition selon vos besoins.

Dans l'attente de votre retour, je vous souhaite une excellente journée.

{{user.fullName}}
Service Cotations — SFX Logistics
{{user.phone}}`;

const FR_RELANCE_2_SEA_ROAD = `Cher Client,

N'ayant pas eu de retour de votre part concernant notre offre n° {{quote.id}}, je me permets de vous recontacter.

Pourriez-vous m'indiquer si vous comptez donner suite à notre cotation ?

Si votre projet est reporté ou si vous avez choisi un autre prestataire, n'hésitez pas à me le signaler pour que je puisse mettre votre dossier à jour.

Je reste à votre entière disposition pour répondre à vos questions ou pour ajuster cette proposition selon vos besoins.

Dans l'attente de votre retour, je vous souhaite une excellente journée.

{{user.fullName}}
Service Cotations — SFX Logistics
{{user.phone}}`;

const FR_RELANCE_3 = `Cher Client,

Sauf erreur de notre part, nous n'avons toujours pas reçu de retour concernant notre cotation n° {{quote.id}} pour {{quote.libelle}}.

Il s'agit de notre dernière relance. Sans retour de votre part, nous considérerons que vous n'êtes plus intéressé par cette offre et clôturerons le dossier.

Si vous souhaitez tout de même donner suite, il vous suffit de répondre à cet email.

Nous restons à votre disposition et vous souhaitons une excellente journée.

{{user.fullName}}
Service Cotations — SFX Logistics
{{user.phone}}`;

const EN_RELANCE_1 = `Dear Client,

I am following up on our quotation N° {{quote.id}} for {{quote.libelle}} that we sent you.

Have you had a chance to take a look at it?

I am available to answer any questions you may have or to adjust this proposal to match your needs.

I look forward to hearing from you and wish you a great day.

{{user.fullName}}
Quotations Department — SFX Logistics
{{user.phone}}`;

const EN_RELANCE_2_AIR = `Dear Client,

Since I have not had any feedback from you concerning our offer N° {{quote.id}}, I am contacting you again.

Could you let me know if you plan to proceed with our quote?

I am available to answer any questions you may have or to adjust this proposal to meet your needs.

I look forward to hearing from you and wish you a wonderful day.

{{user.fullName}}
Quotations Department — SFX Logistics
{{user.phone}}`;

const EN_RELANCE_2_SEA_ROAD = `Dear Client,

Since I have not had any feedback from you concerning our offer N° {{quote.id}}, I am contacting you again.

Could you let me know if you plan to proceed with our quote?

If your project has been postponed or if you have chosen another provider, please do not hesitate to let me know so I can update your file.

I am available to answer any questions you may have or to adjust this proposal to meet your needs.

I look forward to hearing from you and wish you a wonderful day.

{{user.fullName}}
Quotations Department — SFX Logistics
{{user.phone}}`;

const EN_RELANCE_3 = `Dear Client,

Unless we are mistaken, we have still not received any feedback regarding our quotation N° {{quote.id}} for {{quote.libelle}}.

This is our final follow-up. Without a response from you, we will assume you are no longer interested in this offer and will close the file.

If you would still like to proceed, simply reply to this email.

We remain at your disposal and wish you a great day.

{{user.fullName}}
Quotations Department — SFX Logistics
{{user.phone}}`;

const templates = [
  { name: "Relance Aérien · 1ère relance (24h)",              transportType: "AIR",  reminderNumber: 1, subject: "Suivi de votre cotation N° {{quote.id}} — {{quote.libelle}}",    subjectEn: "Follow-up on your quotation N° {{quote.id}} — {{quote.libelle}}",    body: FR_RELANCE_1,         bodyEn: EN_RELANCE_1,         isActive: true },
  { name: "Relance Aérien · 2ème relance (48h)",              transportType: "AIR",  reminderNumber: 2, subject: "Relance — cotation N° {{quote.id}} — {{quote.libelle}}",           subjectEn: "2nd Follow-up — quotation N° {{quote.id}} — {{quote.libelle}}",      body: FR_RELANCE_2_AIR,     bodyEn: EN_RELANCE_2_AIR,     isActive: true },
  { name: "Relance Aérien · 3ème et dernière relance (72h)",  transportType: "AIR",  reminderNumber: 3, subject: "Dernière relance — cotation N° {{quote.id}} — {{quote.libelle}}", subjectEn: "Final follow-up — quotation N° {{quote.id}} — {{quote.libelle}}",    body: FR_RELANCE_3,         bodyEn: EN_RELANCE_3,         isActive: true },
  { name: "Relance Maritime · 1ère relance (48h)",            transportType: "SEA",  reminderNumber: 1, subject: "Suivi de votre cotation N° {{quote.id}} — {{quote.libelle}}",    subjectEn: "Follow-up on your quotation N° {{quote.id}} — {{quote.libelle}}",    body: FR_RELANCE_1,         bodyEn: EN_RELANCE_1,         isActive: true },
  { name: "Relance Maritime · 2ème relance (96h)",            transportType: "SEA",  reminderNumber: 2, subject: "Relance — cotation N° {{quote.id}} — {{quote.libelle}}",           subjectEn: "2nd Follow-up — quotation N° {{quote.id}} — {{quote.libelle}}",      body: FR_RELANCE_2_SEA_ROAD, bodyEn: EN_RELANCE_2_SEA_ROAD, isActive: true },
  { name: "Relance Maritime · 3ème et dernière relance (1 semaine)", transportType: "SEA", reminderNumber: 3, subject: "Dernière relance — cotation N° {{quote.id}} — {{quote.libelle}}", subjectEn: "Final follow-up — quotation N° {{quote.id}} — {{quote.libelle}}", body: FR_RELANCE_3, bodyEn: EN_RELANCE_3, isActive: true },
  { name: "Relance Route · 1ère relance (48h)",               transportType: "ROAD", reminderNumber: 1, subject: "Suivi de votre cotation N° {{quote.id}} — {{quote.libelle}}",    subjectEn: "Follow-up on your quotation N° {{quote.id}} — {{quote.libelle}}",    body: FR_RELANCE_1,         bodyEn: EN_RELANCE_1,         isActive: true },
  { name: "Relance Route · 2ème relance (96h)",               transportType: "ROAD", reminderNumber: 2, subject: "Relance — cotation N° {{quote.id}} — {{quote.libelle}}",           subjectEn: "2nd Follow-up — quotation N° {{quote.id}} — {{quote.libelle}}",      body: FR_RELANCE_2_SEA_ROAD, bodyEn: EN_RELANCE_2_SEA_ROAD, isActive: true },
  { name: "Relance Route · 3ème et dernière relance (1 semaine)", transportType: "ROAD", reminderNumber: 3, subject: "Dernière relance — cotation N° {{quote.id}} — {{quote.libelle}}", subjectEn: "Final follow-up — quotation N° {{quote.id}} — {{quote.libelle}}", body: FR_RELANCE_3, bodyEn: EN_RELANCE_3, isActive: true },
];

async function main() {
  console.log("🌱 Seeding database...");

  // User admin
  const hash = await bcrypt.hash("Admin@1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@sfx.com" },
    update: {},
    create: { email: "admin@sfx.com", passwordHash: hash, name: "Admin SFX" },
  });
  console.log(`✓ User : ${user.email}`);

  // Rôles et permissions
  const roleNames = [
    { name: "ADMIN",   label: "Administrateur", description: "Accès total" },
    { name: "MANAGER", label: "Manager",         description: "Gestion cotations et templates" },
    { name: "VIEWER",  label: "Lecteur",          description: "Lecture seule" },
  ];

  for (const r of roleNames) {
    await prisma.role.upsert({ where: { name: r.name }, update: {}, create: r });
  }

  const permNames = [
    { name: "users:manage",      label: "Gérer les utilisateurs" },
    { name: "worker:manage",     label: "Configurer le worker" },
    { name: "templates:manage",  label: "Gérer les templates" },
    { name: "quotations:cancel", label: "Annuler des relances" },
    { name: "quotations:send",   label: "Envoyer manuellement" },
    { name: "logs:view",         label: "Voir les logs" },
  ];

  for (const p of permNames) {
    await prisma.permission.upsert({ where: { name: p.name }, update: {}, create: { ...p, description: "" } });
  }

  // Assigner toutes les permissions à ADMIN
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  const allPerms  = await prisma.permission.findMany();
  if (adminRole) {
    for (const perm of allPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      });
    }
    // Assigner ADMIN à l'utilisateur admin
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
      update: {},
      create: { userId: user.id, roleId: adminRole.id },
    });
    console.log("✓ Rôle ADMIN assigné à admin@sfx.com");
  }

  // Templates
  for (const t of templates) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { transportType: t.transportType, reminderNumber: t.reminderNumber },
    });
    if (existing) {
      await prisma.emailTemplate.update({ where: { id: existing.id }, data: t });
      console.log(`✓ Template mis à jour : ${t.name}`);
    } else {
      await prisma.emailTemplate.create({ data: t });
      console.log(`✓ Template créé : ${t.name}`);
    }
  }

  console.log("\n✅ Seed terminé");
}

main().catch(console.error).finally(() => prisma.$disconnect());
