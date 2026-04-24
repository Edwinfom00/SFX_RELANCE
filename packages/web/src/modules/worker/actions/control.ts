"use server";

import { revalidatePath } from "next/cache";

const BASE = process.env.WORKER_API_URL   ?? "http://localhost:3002";
const TOKEN = process.env.WORKER_API_TOKEN ?? "";

async function callWorkerApi(
  path: string,
  method: "GET" | "POST" = "POST"
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

export async function getWorkerStatusAction() {
  return callWorkerApi("/status", "GET");
}

export async function triggerTickAction() {
  const result = await callWorkerApi("/tick");
  if (result.success) revalidatePath("/worker");
  return result;
}

export async function pauseWorkerAction() {
  const result = await callWorkerApi("/pause");
  if (result.success) revalidatePath("/worker");
  return result;
}

export async function resumeWorkerAction() {
  const result = await callWorkerApi("/resume");
  if (result.success) revalidatePath("/worker");
  return result;
}
