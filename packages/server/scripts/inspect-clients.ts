import prisma from "../src/utils/prisma";

async function main() {
  console.log("=== INSPEC-CLIENTS: Database Client Verification ===");

  // Count clients
  const count = await prisma.client.count();
  console.log(`Total clients in database: ${count}`);

  // Fetch the first 20 clients
  const clients = await prisma.client.findMany({
    orderBy: { code: "asc" },
    take: 20,
  });

  console.log("\nFirst 20 Clients:");
  console.table(
    clients.map((c) => ({
      ID: c.id,
      Code: c.code,
      Name: c.name,
      Emails: c.emails || "(Aucun e-mail)",
      "Updated At": c.updatedAt,
    }))
  );

  // Check some statistics or empty emails
  const emptyEmailsCount = await prisma.client.count({
    where: { emails: "" },
  });
  console.log(`\nClients with empty emails: ${emptyEmailsCount}`);

  // Count active quotations grouped by client code to see match status
  const activeQuotations = await prisma.quotation.findMany({
    where: { status: "ACTIVE" },
    select: { clientCode: true, clientEmail: true },
  });

  console.log(`\nTotal active quotations: ${activeQuotations.length}`);
  
  if (activeQuotations.length > 0) {
    const clientsWithQuotes = await prisma.client.findMany({
      where: {
        code: {
          in: activeQuotations.map((q) => q.clientCode),
        },
      },
    });

    console.log(`Clients with active quotations synced locally: ${clientsWithQuotes.length}`);
    console.table(
      clientsWithQuotes.map((c) => {
        const quotes = activeQuotations.filter((q) => q.clientCode === c.code);
        return {
          Code: c.code,
          Name: c.name,
          LocalEmails: c.emails || "(Aucun)",
          QuoteCount: quotes.length,
          QuoteEmails: quotes.map((q) => q.clientEmail).join(" | "),
        };
      })
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
