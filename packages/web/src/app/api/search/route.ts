import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) return NextResponse.json([]);

  const quotations = await prisma.quotation.findMany({
    where: {
      OR: [
        { quotationId:  { contains: q } },
        { clientCode:   { contains: q } },
        { clientEmail:  { contains: q } },
        { libelle:      { contains: q } },
      ],
    },
    select: {
      id: true,
      quotationId: true,
      clientCode: true,
      clientEmail: true,
      transportType: true,
      status: true,
      libelle: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return NextResponse.json(
    quotations.map((q) => ({ type: "quotation", ...q }))
  );
}
