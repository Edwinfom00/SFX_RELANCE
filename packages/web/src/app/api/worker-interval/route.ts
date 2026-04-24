import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ intervalMinutes: 30 }, { status: 401 });

  const config = await prisma.workerConfig.findFirst({ select: { intervalMinutes: true } });
  return NextResponse.json({ intervalMinutes: config?.intervalMinutes ?? 30 });
}
