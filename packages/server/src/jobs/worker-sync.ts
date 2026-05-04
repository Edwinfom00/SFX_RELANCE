import prisma from "../utils/prisma";
import { syncQuotations } from "../services/brainopx.service";
import { workerRegistry } from "../api/server";

const WORKER_ID          = "sync";
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
    console.log("[Sync] Paused — waiting for resume");
    return;
  }

  console.log(`[Sync] Tick at ${new Date().toISOString()}`);
  const start = Date.now();
  try {
    await syncQuotations();
    state.lastTickAt         = new Date();
    state.lastTickDurationMs = Date.now() - start;
    state.tickCount++;
  } catch (err) {
    console.error("[Sync] Error:", err);
  }

  const intervalMs = await getIntervalMs();
  setTimeout(tick, intervalMs);
}

export function startSyncWorker(): void {
  workerRegistry.get(WORKER_ID)!.resume = () => tick();
  console.log("[Sync] Starting...");
  tick();
}
