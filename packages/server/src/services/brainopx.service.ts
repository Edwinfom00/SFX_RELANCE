import prisma from "../utils/prisma";
import { addHours } from "../utils/date";
import type { TransportType } from "../types";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

type ReminderSchedule = Array<{ reminderNumber: number; delayHours: number }>;


async function getFirstDelays(): Promise<Record<string, number>> {
  try {
    const config = await prisma.workerConfig.findFirst({
      select: { cadenceAir: true, cadenceSea: true, cadenceRoad: true },
    });
    if (!config) return { AIR: 24, SEA: 48, ROAD: 48 };
    const parse = (s: string) => (JSON.parse(s) as ReminderSchedule)[0]?.delayHours ?? 24;
    return { AIR: parse(config.cadenceAir), SEA: parse(config.cadenceSea), ROAD: parse(config.cadenceRoad) };
  } catch {
    return { AIR: 24, SEA: 48, ROAD: 48 };
  }
}

interface BrainOpxRow {
  quotation_id: string;
  libelle: string;
  client_code: string;
  client_email: string;
  client_language: string; // ex: "US", "FR", "GB"
  transmission_date: Date;
  transport_type: "AIR" | "SEA" | "ROAD";
  pays_code: string;
  agence_code: string;
}


async function fetchFromBrainOpx(): Promise<BrainOpxRow[]> {
  const db = process.env.BRAINOPX_DATABASE ?? "BopxFMT";
  return prisma.$queryRawUnsafe<BrainOpxRow[]>(`
    SELECT quotation_id, libelle, client_code, client_email, client_language, transmission_date, transport_type, pays_code, agence_code
    FROM [${db}].[dbo].[v_sfx_active_quotations]
  `);
}

function parseExcelDate(excelDate: any): Date {
  if (!excelDate) return new Date();
  if (typeof excelDate === "number") {
    // Excel epoch starts on Dec 30, 1899
    const UTC_EPOCH_MS = Date.UTC(1899, 11, 30);
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    return new Date(UTC_EPOCH_MS + excelDate * MS_PER_DAY);
  }
  const d = new Date(excelDate);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function fetchFromExcel(): Promise<BrainOpxRow[]> {
  const excelPath = process.env.EXCEL_SYNC_PATH
    ? path.resolve(process.env.EXCEL_SYNC_PATH)
    : path.resolve(process.cwd(), "../../OMA TL - Quotations awaiting Customer Feedback.xlsx");

  console.log(`[Excel Sync] Reading file from: ${excelPath}`);

  if (!fs.existsSync(excelPath)) {
    console.warn(`[Excel Sync] File not found at: ${excelPath}. Returning empty list.`);
    return [];
  }

  try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });

    const rows: BrainOpxRow[] = [];

    for (const row of data) {
      const docNo = String(row["Doc No"] || row["Tmp No"] || "").trim();
      if (!docNo) continue;

      const customerId = String(row["Customer Id"] || "").trim();
      const customerName = String(row["Customer Name"] || "").trim();
      const originalEmail = String(row["Emails"] || "").trim();

      const fileType = String(row["File Type"] || row["Activity"] || "").toLowerCase();
      let transportType: "AIR" | "SEA" | "ROAD" = "AIR";
      if (fileType.includes("sea") || fileType.includes("ocean")) {
        transportType = "SEA";
      } else if (fileType.includes("road") || fileType.includes("truck") || fileType.includes("tra")) {
        transportType = "ROAD";
      }

      let paysCode = "CMR";
      let agenceCode = "DLA";
      if (docNo.startsWith("TL1")) {
        paysCode = "TGO";
        agenceCode = "LOM";
      } else if (docNo.startsWith("FM1")) {
        paysCode = "CMR";
        agenceCode = "DLA";
      }

      const rawDate = row["Transmission Date"] || row["Transaction Date"];
      const date = parseExcelDate(rawDate);

      rows.push({
        quotation_id: docNo,
        libelle: customerName,
        client_code: customerId,
        client_email: originalEmail,
        client_language: "FR", // Default client language
        transmission_date: date,
        transport_type: transportType,
        pays_code: paysCode,
        agence_code: agenceCode,
      });
    }

    console.log(`[Excel Sync] Parsed ${rows.length} quotations from Excel.`);
    return rows;
  } catch (err) {
    console.error(`[Excel Sync] Error parsing Excel file:`, err);
    throw err;
  }
}


export async function syncQuotations(): Promise<void> {
  console.log("[BrainOpx] Syncing quotations...");

  let syncSource = "DB";
  try {
    const config = await prisma.workerConfig.findFirst({ select: { syncSource: true } });
    if (config?.syncSource) {
      syncSource = config.syncSource;
    }
  } catch (err) {
    console.error("[BrainOpx] Error fetching config:", err);
  }

  console.log(`[BrainOpx] Sync source mode: ${syncSource}`);

  const rows = syncSource === "EXCEL" ? await fetchFromExcel() : await fetchFromBrainOpx();
  const remoteIds = new Set(rows.map((r) => r.quotation_id));

  const localActive = await prisma.quotation.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, quotationId: true },
  });

  const toComplete = localActive.filter((q) => !remoteIds.has(q.quotationId));
  if (toComplete.length > 0) {
    await prisma.quotation.updateMany({
      where: { id: { in: toComplete.map((q) => q.id) } },
      data: { status: "COMPLETED", nextReminderAt: null },
    });
    console.log(`[BrainOpx] ${toComplete.length} cotation(s) → COMPLETED`);
  }

  const existingMap = new Map(
    (await prisma.quotation.findMany({ select: { quotationId: true, id: true, libelle: true } }))
      .map((q) => [q.quotationId, q])
  );

  for (const row of rows) {
    const existing = existingMap.get(row.quotation_id);
    if (existing) {
      // Mettre à jour libelle et clientLanguage si vides
      const updates: Record<string, string> = {};
      if (!existing.libelle && row.libelle) updates.libelle = row.libelle;
      if (!(existing as any).clientLanguage && row.client_language) updates.clientLanguage = row.client_language;
      if (Object.keys(updates).length > 0) {
        await prisma.quotation.update({ where: { id: existing.id }, data: updates });
      }
    }
  }

  const newRows = rows.filter((r) => !existingMap.has(r.quotation_id));
  const firstDelays = await getFirstDelays();
  let created = 0;
  let skipped = 0;

  for (const row of newRows) {
    const transportType = row.transport_type as TransportType;
    const firstDelay = firstDelays[transportType];

    if (firstDelay === undefined) {
      console.warn(`[BrainOpx] Transport inconnu "${transportType}" — ${row.quotation_id} ignoré`);
      skipped++;
      continue;
    }

    let clientEmail = row.client_email || "";
    try {
      const localClient = await prisma.client.findUnique({
        where: { code: row.client_code },
        select: { emails: true }
      });
      if (localClient?.emails) {
        clientEmail = localClient.emails;
      }
    } catch (err) {
      console.error("[BrainOpx] Error looking up local client:", err);
    }

    await prisma.quotation.create({
      data: {
        quotationId:      row.quotation_id,
        libelle:          row.libelle ?? "",
        clientCode:       row.client_code,
        clientEmail,
        clientLanguage:   row.client_language ?? "FR",
        transmissionDate: new Date(row.transmission_date),
        transportType,
        status:           "ACTIVE",
        currentReminder:  0,
        nextReminderAt:   addHours(new Date(row.transmission_date), firstDelay),
        paysCode:         row.pays_code || "CMR",
        agenceCode:       row.agence_code || "DLA",
      },
    });
    created++;
  }

  console.log(`[BrainOpx] Sync terminée — ${created} créée(s), ${toComplete.length} complétée(s), ${skipped} ignorée(s)`);
}

export async function syncClients(): Promise<void> {
  console.log("[ClientSync] Syncing clients...");

  let syncSource = "DB";
  try {
    const config = await prisma.workerConfig.findFirst({ select: { syncSource: true } });
    if (config?.syncSource) {
      syncSource = config.syncSource;
    }
  } catch (err) {
    console.error("[ClientSync] Error fetching config:", err);
  }

  console.log(`[ClientSync] Sync source mode: ${syncSource}`);

  interface SimpleClient {
    code: string;
    name: string;
    emails: string;
  }

  let clients: SimpleClient[] = [];

  if (syncSource === "EXCEL") {
    try {
      const quotations = await fetchFromExcel();
      const uniqueMap = new Map<string, typeof quotations[0]>();
      for (const q of quotations) {
        if (q.client_code) {
          uniqueMap.set(q.client_code, q);
        }
      }
      clients = Array.from(uniqueMap.values()).map(q => ({
        code: q.client_code,
        name: q.libelle || q.client_code,
        emails: q.client_email || "",
      }));
    } catch (err) {
      console.error("[ClientSync] Error reading clients from Excel:", err);
    }
  } else {
    try {
      const db = process.env.BRAINOPX_DATABASE ?? "BopxFMT";
      const rows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT [Code Client] AS client_code, [Nom Client] AS name, [Emails] AS client_email
        FROM [${db}].[dbo].[tn_Clients]
        WHERE [Client Actif] = 1
      `);
      clients = rows.map(r => ({
        code: r.client_code,
        name: r.name || "",
        emails: r.client_email || "",
      }));
    } catch (err) {
      console.error("[ClientSync] Error reading clients from SQL Server:", err);
    }
  }

  console.log(`[ClientSync] Found ${clients.length} clients to sync.`);

  let created = 0;
  let updated = 0;

  for (const c of clients) {
    try {
      const existing = await prisma.client.findUnique({
        where: { code: c.code }
      });

      if (existing) {
        // Le client existe : on met à jour son nom (au cas où il a changé),
        // mais on ne touche pas aux e-mails sauf s'ils sont vides localement.
        await prisma.client.update({
          where: { id: existing.id },
          data: {
            name: c.name,
            emails: existing.emails || c.emails || "",
          }
        });
        updated++;
      } else {
        // Le client n'existe pas en local : on le crée
        await prisma.client.create({
          data: {
            code: c.code,
            name: c.name,
            emails: c.emails || "",
          }
        });
        created++;
      }
    } catch (err) {
      console.error(`[ClientSync] Error syncing client ${c.code}:`, err);
    }
  }

  console.log(`[ClientSync] Client sync complete: ${created} created, ${updated} updated.`);
}

