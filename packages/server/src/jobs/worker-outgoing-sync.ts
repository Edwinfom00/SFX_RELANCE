import prisma from "../utils/prisma";
import { syncOutgoingQuotations } from "../services/brainopx.service";
import { workerRegistry } from "../api/server";

const WORKER_ID           = "outgoing-sync";
const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;

async function getIntervalMs(): Promise<number> {
  try {
    const config = await prisma.workerConfig.findFirst({ select: { intervalMinutes: true } });
    return (config?.intervalMinutes ?? 30) * 60 * 1000;
  } catch {
    return DEFAULT_INTERVAL_MS;
  }
}

async function tick(): Promise<void> {
  const state = workerRegistry.get(WORKER_ID)!;
  if (state.paused) {
    console.log("[OutgoingSync] Paused — waiting for resume");
    return;
  }

  console.log(`[OutgoingSync] Tick at ${new Date().toISOString()}`);
  const start = Date.now();
  try {
    await syncOutgoingQuotations();
    state.lastTickAt         = new Date();
    state.lastTickDurationMs = Date.now() - start;
    state.tickCount++;
  } catch (err) {
    console.error("[OutgoingSync] Error:", err);
  }

  const intervalMs = await getIntervalMs();
  setTimeout(tick, intervalMs);
}

export function startOutgoingSyncWorker(): void {
  workerRegistry.get(WORKER_ID)!.resume = () => tick();
  console.log("[OutgoingSync] Starting...");
  tick();
}
