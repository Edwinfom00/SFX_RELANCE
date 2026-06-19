"use server";

import { revalidatePath } from "next/cache";

const BASE  = process.env.WORKER_API_URL   ?? "http://localhost:3002";
const TOKEN = process.env.WORKER_API_TOKEN ?? "";

async function call(
  path: string,
  method: "GET" | "POST" = "POST",
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error ?? `HTTP ${res.status}` };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Worker injoignable" };
  }
}

export type WorkerId = "sync" | "client-sync" | "r1" | "r2" | "r3";

/** Récupère l'état de tous les workers. */
export async function getWorkerStatusAction() {
  return call("/status", "GET");
}

/** Force un tick immédiat sur un worker spécifique. */
export async function triggerTickAction(workerId: WorkerId) {
  const result = await call(`/workers/${workerId}/tick`);
  if (result.success) revalidatePath("/worker");
  return result;
}

/** Met en pause un worker spécifique. */
export async function pauseWorkerAction(workerId: WorkerId) {
  const result = await call(`/workers/${workerId}/pause`);
  if (result.success) revalidatePath("/worker");
  return result;
}

/** Reprend un worker spécifique. */
export async function resumeWorkerAction(workerId: WorkerId) {
  const result = await call(`/workers/${workerId}/resume`);
  if (result.success) revalidatePath("/worker");
  return result;
}

/** Met tous les workers en pause. */
export async function pauseAllAction() {
  const result = await call("/pause-all");
  if (result.success) revalidatePath("/worker");
  return result;
}

/** Reprend tous les workers. */
export async function resumeAllAction() {
  const result = await call("/resume-all");
  if (result.success) revalidatePath("/worker");
  return result;
}
