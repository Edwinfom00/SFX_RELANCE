/**
 * Script de test pour valider la recherche des PDF et l'envoi de relance
 * avec pièce jointe.
 *
 * Usage :
 *   pnpm --filter server exec tsx scripts/test-email-behavior.ts
 */

import fs from "fs";
import path from "path";
import { findQuotationPdf } from "../src/utils/pdf";
import prisma from "../src/utils/prisma";
import { processReminders } from "../src/services/reminder.service";

const TEST_DIR = path.resolve(__dirname, "../test-pdfs-temp");

// Helper to clean and recreate the test directory
function setupTestDir() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

function cleanupTestDir() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

async function runTests() {
  console.log("🚀 Starting Email and PDF Behavior Tests...");
  
  // Save original env
  const origEnvPath = process.env.PDF_STORAGE_PATH;
  process.env.PDF_STORAGE_PATH = TEST_DIR;

  try {
    // ----------------------------------------------------
    // Section 1: findQuotationPdf Unit Tests
    // ----------------------------------------------------
    console.log("\n--- Section 1: Testing findQuotationPdf ---");

    // Case 1: DIR_NOT_FOUND (Missing country/agency folder)
    setupTestDir();
    let res = findQuotationPdf("FM1XX12345", "CMR", "DLA");
    console.assert(res.error === "DIR_NOT_FOUND", "Should return DIR_NOT_FOUND when country/agency folder is missing");
    console.assert(res.errorDetails?.includes("Le répertoire des PDF de cotation est introuvable"), "Should have descriptive error message");
    console.log("✅ Case 1: DIR_NOT_FOUND (Missing folder) passed");

    // Case 2: NO_PDF_FOUND
    fs.mkdirSync(path.join(TEST_DIR, "CMR", "DLA"), { recursive: true });
    res = findQuotationPdf("FM1XX12345", "CMR", "DLA");
    console.assert(res.error === "NO_PDF_FOUND", "Should return NO_PDF_FOUND when folder exists but is empty");
    console.assert(res.errorDetails?.includes("Aucun fichier PDF associé à la cotation FM1XX12345 n'a été trouvé"), "Should have descriptive error message");
    console.log("✅ Case 2: NO_PDF_FOUND passed");

    // Case 3: Single PDF found (Success)
    const file1 = path.join(TEST_DIR, "CMR", "DLA", "FM1XX12345.pdf");
    fs.writeFileSync(file1, "dummy contents");
    res = findQuotationPdf("FM1XX12345", "CMR", "DLA");
    console.assert(res.filePath === file1, "Should find the exact PDF");
    console.assert(res.error === undefined, "Should not return error on success");
    console.log("✅ Case 3: Single PDF found passed");

    // Case 4: Case-insensitive match
    res = findQuotationPdf("fm1xx12345", "CMR", "DLA");
    console.assert(res.filePath === file1, "Should find the PDF with case-insensitive quotation ID");
    console.log("✅ Case 4: Case-insensitive match passed");

    // Case 5: Multiple matching PDFs (picks the newest)
    const file2 = path.join(TEST_DIR, "CMR", "DLA", "FM1XX12345_v2.pdf");
    fs.writeFileSync(file2, "dummy newer contents");
    // Explicitly update mtime to be in the future
    const now = Date.now();
    fs.utimesSync(file1, new Date(now - 10000), new Date(now - 10000));
    fs.utimesSync(file2, new Date(now), new Date(now));
    res = findQuotationPdf("FM1XX12345", "CMR", "DLA");
    console.assert(res.filePath === file2, "Should pick the newest modified PDF");
    console.log("✅ Case 5: Multiple matching PDFs (newest selected) passed");

    // Case 6: FILE_INACCESSIBLE (mock file permissions)
    const originalAccessSync = fs.accessSync;
    fs.accessSync = () => { throw new Error("Permission denied"); };
    try {
      res = findQuotationPdf("FM1XX12345", "CMR", "DLA");
      console.assert(res.error === "FILE_INACCESSIBLE", "Should return FILE_INACCESSIBLE when accessSync throws");
      console.assert(res.errorDetails === "Le PDF de la cotation existe mais ne peut pas être lu.", "Should have exact error message");
      console.log("✅ Case 6: FILE_INACCESSIBLE passed");
    } finally {
      fs.accessSync = originalAccessSync;
    }

    // ----------------------------------------------------
    // Section 2: integration test via processReminders
    // ----------------------------------------------------
    console.log("\n--- Section 2: Integration Testing via processReminders ---");

    // Ensure there is an active template
    const activeTemplate = await prisma.emailTemplate.findFirst({
      where: { transportType: "AIR", reminderNumber: 1, isActive: true },
    });
    if (!activeTemplate) {
      console.log("⚠️ No active template for AIR R1 found. Creating one for test...");
      await prisma.emailTemplate.upsert({
        where: { transportType_reminderNumber: { transportType: "AIR", reminderNumber: 1 } },
        update: { isActive: true },
        create: {
          name: "Test Template AIR R1",
          transportType: "AIR",
          reminderNumber: 1,
          subject: "Relance: Cotation {{quote.id}}",
          body: "Bonjour, veuillez trouver ci-joint votre cotation {{quote.id}}.",
          isActive: true,
        }
      });
    }

    // Create a unique test quotation ID
    const testQuotationId = `TEST-PDF-${Date.now()}`;
    const testQuote = await prisma.quotation.create({
      data: {
        quotationId: testQuotationId,
        clientCode: "TEST_CLI",
        clientEmail: "test@client.com",
        clientLanguage: "FR",
        libelle: "Test Quotation PDF",
        transmissionDate: new Date(Date.now() - 25 * 3600 * 1000), // 25 hours ago, so R1 is due
        transportType: "AIR",
        status: "ACTIVE",
        currentReminder: 0,
        nextReminderAt: new Date(Date.now() - 1 * 3600 * 1000), // 1 hour ago
        paysCode: "CMR",
        agenceCode: "DLA",
      }
    });

    // Mock nodemailer transporter globally for the integration tests
    const nodemailer = require("nodemailer");
    const originalCreateTransport = nodemailer.createTransport;
    
    let lastSentMailOptions: any = null;
    nodemailer.createTransport = () => {
      return {
        sendMail: async (opts: any) => {
          lastSentMailOptions = opts;
          return { messageId: "mock-id" };
        }
      };
    };

    try {
      // Integration Test A: Worker handles missing PDF directory correctly
      cleanupTestDir();
      console.log("Running processReminders(1) with missing PDF directory...");
      await processReminders(1);

      const updatedQuoteA = await prisma.quotation.findUnique({
        where: { id: testQuote.id },
      });
      const emailLogA = await prisma.emailLog.findFirst({
        where: { quotationId: testQuote.id, reminderNumber: 1 },
      });

      console.assert(emailLogA !== null, "Should have created an EmailLog");
      console.assert(emailLogA?.status === "SENT", `EmailLog status should be SENT, got ${emailLogA?.status}`);
      console.assert(emailLogA?.errorMessage?.includes("PDF absent: Le répertoire des PDF de cotation est introuvable"), `Error message should be PDF absent warning, got "${emailLogA?.errorMessage}"`);
      console.assert(updatedQuoteA?.status === "ACTIVE", `Quotation status should be ACTIVE, got ${updatedQuoteA?.status}`);
      console.assert(updatedQuoteA?.currentReminder === 1, `Quotation currentReminder should be 1, got ${updatedQuoteA?.currentReminder}`);
      console.log("✅ Integration Case A: Worker handles missing PDF directory passed");

      // Integration Test B: Worker handles missing PDF file (NO_PDF_FOUND)
      const testQuotationIdB = `TEST-PDF-B-${Date.now()}`;
      const testQuoteB = await prisma.quotation.create({
        data: {
          quotationId: testQuotationIdB,
          clientCode: "TEST_CLI",
          clientEmail: "test@client.com",
          clientLanguage: "FR",
          libelle: "Test Quotation PDF B",
          transmissionDate: new Date(Date.now() - 25 * 3600 * 1000),
          transportType: "AIR",
          status: "ACTIVE",
          currentReminder: 0,
          nextReminderAt: new Date(Date.now() - 1 * 3600 * 1000),
          paysCode: "CMR",
          agenceCode: "DLA",
        }
      });

      // Create the directory but no files
      fs.mkdirSync(path.join(TEST_DIR, "CMR", "DLA"), { recursive: true });
      console.log("Running processReminders(1) with empty PDF directory...");
      await processReminders(1);

      const updatedQuoteB = await prisma.quotation.findUnique({
        where: { id: testQuoteB.id },
      });
      const emailLogB = await prisma.emailLog.findFirst({
        where: { quotationId: testQuoteB.id, reminderNumber: 1 },
      });

      console.assert(emailLogB !== null, "Should have created an EmailLog");
      console.assert(emailLogB?.status === "SENT", `EmailLog status should be SENT, got ${emailLogB?.status}`);
      console.assert(emailLogB?.errorMessage?.includes("PDF absent: Aucun fichier PDF associé à la cotation"), `Error message should be PDF absent warning, got "${emailLogB?.errorMessage}"`);
      console.assert(updatedQuoteB?.status === "ACTIVE", `Quotation status should be ACTIVE, got ${updatedQuoteB?.status}`);
      console.assert(updatedQuoteB?.currentReminder === 1, `Quotation currentReminder should be 1, got ${updatedQuoteB?.currentReminder}`);
      console.log("✅ Integration Case B: Worker handles missing PDF file passed");

      // Integration Test C: Worker sends email successfully when PDF is present
      const testQuotationIdC = `TEST-PDF-C-${Date.now()}`;
      const testQuoteC = await prisma.quotation.create({
        data: {
          quotationId: testQuotationIdC,
          clientCode: "TEST_CLI",
          clientEmail: "test@client.com",
          clientLanguage: "FR",
          libelle: "Test Quotation PDF C",
          transmissionDate: new Date(Date.now() - 25 * 3600 * 1000),
          transportType: "AIR",
          status: "ACTIVE",
          currentReminder: 0,
          nextReminderAt: new Date(Date.now() - 1 * 3600 * 1000),
          paysCode: "CMR",
          agenceCode: "DLA",
        }
      });

      // Write a dummy PDF file
      fs.writeFileSync(path.join(TEST_DIR, "CMR", "DLA", `${testQuotationIdC}.pdf`), "pdf contents");
      console.log("Running processReminders(1) with valid PDF file...");
      
      // Reset lastSentMailOptions
      lastSentMailOptions = null;
      await processReminders(1);

      const updatedQuoteC = await prisma.quotation.findUnique({
        where: { id: testQuoteC.id },
      });
      const emailLogC = await prisma.emailLog.findFirst({
        where: { quotationId: testQuoteC.id, reminderNumber: 1 },
      });

      console.assert(emailLogC !== null, "Should have created an EmailLog");
      console.assert(emailLogC?.status === "SENT", `EmailLog status should be SENT, got ${emailLogC?.status}`);
      console.assert(updatedQuoteC?.status === "ACTIVE", `Quotation status should be ACTIVE, got ${updatedQuoteC?.status}`);
      console.assert(updatedQuoteC?.currentReminder === 1, `Quotation currentReminder should be 1, got ${updatedQuoteC?.currentReminder}`);
      console.assert(lastSentMailOptions !== null, "Should have called nodemailer sendMail");
      console.assert(lastSentMailOptions.attachments && lastSentMailOptions.attachments.length === 1, "Should have attached 1 file");
      console.assert(lastSentMailOptions.attachments[0].filename === `${testQuotationIdC}.pdf`, `Attached filename should match, got ${lastSentMailOptions.attachments[0].filename}`);
      console.log("✅ Integration Case C: Worker sends email successfully with PDF passed");

      // Clean up our DB test quotations
      await prisma.emailLog.deleteMany({
        where: { quotationId: { in: [testQuote.id, testQuoteB.id, testQuoteC.id] } }
      });
      await prisma.quotation.deleteMany({
        where: { id: { in: [testQuote.id, testQuoteB.id, testQuoteC.id] } }
      });
      console.log("🧹 DB clean up completed successfully.");

    } finally {
      nodemailer.createTransport = originalCreateTransport;
    }

  } finally {
    // Restore env and cleanup
    if (origEnvPath) {
      process.env.PDF_STORAGE_PATH = origEnvPath;
    } else {
      delete process.env.PDF_STORAGE_PATH;
    }
    cleanupTestDir();
  }

  console.log("\n🎉 All tests passed successfully!");
}

runTests().catch((err) => {
  console.error("❌ Test run failed with error:", err);
  process.exit(1);
});
