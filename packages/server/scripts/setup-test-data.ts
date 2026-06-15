import fs from "fs";
import path from "path";
import prisma from "../src/utils/prisma";

const MINIMAL_PDF = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources <<>> /Contents 4 0 R>> endobj
4 0 obj <</Length 43>> stream
q
BT
/F1 12 Tf
72 712 Td
(Mock PDF Content) Tj
ET
Q
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000212 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
306
%%EOF`;

async function main() {
  const targetDir = path.resolve(__dirname, "../test-pdfs/CMR/DLA");
  
  // 1. Create directories if they don't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`✓ Directory created: ${targetDir}`);
  }

  // 2. Write a mock PDF file for FM1XX250708
  const quotationId = "FM1XX250708";
  const pdfPath = path.join(targetDir, `${quotationId}.pdf`);
  fs.writeFileSync(pdfPath, MINIMAL_PDF);
  console.log(`✓ Test PDF created: ${pdfPath}`);

  // Also create a second PDF to test the "newest selection" logic
  const pdfPathV2 = path.join(targetDir, `${quotationId}_v2.pdf`);
  fs.writeFileSync(pdfPathV2, MINIMAL_PDF);
  
  // Set mtime of v2 to be newer than v1
  const now = Date.now();
  fs.utimesSync(pdfPath, new Date(now - 10000), new Date(now - 10000));
  fs.utimesSync(pdfPathV2, new Date(now), new Date(now));
  console.log(`✓ Test PDF V2 created (newer): ${pdfPathV2}`);

  // 3. Update clientEmail for the quotation in the local DB
  const emails = "edwinfom05@gmail.com, direction@client.com, compta@client.com, manager@client.com";
  
  // Find the quotation
  const quote = await prisma.quotation.findUnique({
    where: { quotationId },
  });

  if (quote) {
    await prisma.quotation.update({
      where: { id: quote.id },
      data: {
        clientEmail: emails,
        paysCode: "CMR",
        agenceCode: "DLA",
      },
    });
    console.log(`✓ Updated local database for ${quotationId} with multiple emails: ${emails}`);
  } else {
    // If not found locally, let's update all active quotations just to be sure we have test cases
    const allQuotes = await prisma.quotation.findMany({ where: { status: "ACTIVE" } });
    if (allQuotes.length > 0) {
      for (const q of allQuotes) {
        await prisma.quotation.update({
          where: { id: q.id },
          data: {
            clientEmail: emails,
            paysCode: "CMR",
            agenceCode: "DLA",
          },
        });
        // Also create a PDF file for it
        const qPdf = path.join(targetDir, `${q.quotationId}.pdf`);
        fs.writeFileSync(qPdf, MINIMAL_PDF);
      }
      console.log(`✓ Updated all ${allQuotes.length} active quotations with multiple emails and generated mock PDFs.`);
    } else {
      console.log("⚠️ No active quotations found in the database to update.");
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
