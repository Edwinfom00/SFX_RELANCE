"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { cancelQuotation } from "../models";

export async function cancelQuotationAction(id: number) {
  const session = await auth();
  const userId = Number(session?.user?.id ?? 1);
  await cancelQuotation(id, userId);
  revalidatePath("/quotations");
}
