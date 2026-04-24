import prisma from "../utils/prisma";
import { runTick, workerState } from "../api/server";

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

  if (workerState.paused) {
    console.log("[Worker] Paused — cycle stopped, waiting for resume");
    return;
  }

  console.log(`[Worker] Tick at ${new Date().toISOString()}`);
  try {
    await runTick();
  } catch (err) {
    console.error("[Worker] Error during tick:", err);
  }

  const intervalMs = await getIntervalMs();
  setTimeout(tick, intervalMs);
}


export function resumeCycle(): void {
  tick();
}

export function startWorker(): void {
  console.log("[Worker] Starting...");
  tick();
}
