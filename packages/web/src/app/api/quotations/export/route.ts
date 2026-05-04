import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:     "Actif",
  COMPLETED:  "Client a répondu",
  CLOSED:     "Clôturé sans réponse",
  CANCELLED:  "Annulé",
  PROCESSING: "En cours",
};

const TRANSPORT_LABEL: Record<string, string> = {
  AIR:  "Aérien",
  SEA:  "Maritime",
  ROAD: "Route",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const status        = p.get("status")        ?? undefined;
  const transportType = p.get("transportType") ?? undefined;
  const search        = p.get("search")        ?? undefined;
  const dateFrom      = p.get("dateFrom")      ?? undefined;
  const dateTo        = p.get("dateTo")        ?? undefined;
  const reminder      = p.get("reminder")      ?? undefined;

  const quotations = await prisma.quotation.findMany({
    where: {
      ...(status        && { status }),
      ...(transportType && { transportType }),
      ...(reminder      && { currentReminder: Number(reminder) }),
      ...(search && {
        OR: [
          { quotationId: { contains: search } },
          { clientCode:  { contains: search } },
          { clientEmail: { contains: search } },
          { libelle:     { contains: search } },
        ],
      }),
      ...(dateFrom || dateTo ? {
        transmissionDate: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo   && { lte: new Date(dateTo + "T23:59:59") }),
        },
      } : {}),
    },
    orderBy: { transmissionDate: "desc" },
  });

  const rows = quotations.map((q) => ({
    "N° Cotation":       q.quotationId,
    "Libellé":           (q as any).libelle ?? "",
    "Code Client":       q.clientCode,
    "Email Client":      q.clientEmail,
    "Transport":         TRANSPORT_LABEL[q.transportType] ?? q.transportType,
    "Statut":            STATUS_LABEL[q.status] ?? q.status,
    "Relances envoyées": q.currentReminder,
    "Date Transmission": format(new Date(q.transmissionDate), "dd/MM/yyyy HH:mm", { locale: fr }),
    "Prochaine relance": q.nextReminderAt
      ? format(new Date(q.nextReminderAt), "dd/MM/yyyy HH:mm", { locale: fr })
      : "—",
    "Date création":     format(new Date(q.createdAt), "dd/MM/yyyy HH:mm", { locale: fr }),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Largeurs de colonnes
  ws["!cols"] = [
    { wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 30 },
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 20 },
    { wch: 20 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Cotations");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `cotations_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
