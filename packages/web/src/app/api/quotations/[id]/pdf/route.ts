import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { findQuotationPdf } from "@/lib/pdf";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbId = Number(id);
    if (isNaN(dbId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: dbId },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Cotation introuvable" }, { status: 404 });
    }

    const result = findQuotationPdf(
      quotation.quotationId,
      quotation.paysCode,
      quotation.agenceCode
    );

    const { searchParams } = new URL(request.url);
    const checkOnly = searchParams.get("check") === "true";

    if (checkOnly) {
      if (result.error) {
        return NextResponse.json({
          exists: false,
          error: result.error,
          errorDetails: result.errorDetails,
        });
      }
      return NextResponse.json({
        exists: true,
        fileName: result.filePath ? path.basename(result.filePath) : "",
      });
    }

    // Sinon, streamer/renvoyer le fichier PDF
    if (result.error || !result.filePath) {
      return new Response(result.errorDetails || "Fichier introuvable", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const fileBuffer = fs.readFileSync(result.filePath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${path.basename(result.filePath)}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
