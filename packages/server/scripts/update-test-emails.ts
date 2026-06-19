import prisma from "../src/utils/prisma";

const TEST_EMAILS = [
  "edwinfom05@gmail.com",
  "edwinfom10@gmail.com",
  "kiroedwin30@gmail.com",
  "sfxrelance@gmail.com"
];

async function main() {
  console.log("=== Overwriting Client Emails for Testing ===");

  // 1. Fetch all clients
  const clients = await prisma.client.findMany({
    orderBy: { id: "asc" }
  });
  console.log(`Found ${clients.length} clients in local database.`);

  if (clients.length === 0) {
    console.log("No clients found. Please run sync first!");
  } else {
    // Update emails in rotation
    let count = 0;
    for (const client of clients) {
      const email = TEST_EMAILS[count % TEST_EMAILS.length];
      await prisma.client.update({
        where: { id: client.id },
        data: { emails: email }
      });
      count++;
    }
    console.log(`Successfully updated ${count} clients with rotated test emails.`);
  }

  // 2. Fetch and inspect workerConfig
  console.log("\n=== Checking workerConfig (SMTP) ===");
  const config = await prisma.workerConfig.findFirst();
  if (!config) {
    console.log("❌ No workerConfig row found in database!");
  } else {
    console.log("workerConfig found in DB:");
    console.log({
      id: config.id,
      smtpHost: config.smtpHost || "(empty)",
      smtpPort: config.smtpPort,
      smtpSecure: config.smtpSecure,
      smtpUser: config.smtpUser || "(empty)",
      smtpPass: config.smtpPass ? "•••••••• (encrypted)" : "(empty)",
      smtpFrom: config.smtpFrom || "(empty)",
    });
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
