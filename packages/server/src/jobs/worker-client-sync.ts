import prisma from "../utils/prisma";
import { syncClients } from "../services/brainopx.service";
import { workerRegistry } from "../api/server";

const WORKER_ID          = "client-sync";
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

async function tick(): Promise<void> {
  const state = workerRegistry.get(WORKER_ID)!;
  if (state.paused) {
    console.log("[ClientSync] Paused — waiting for resume");
    return;
  }

  console.log(`[ClientSync] Tick at ${new Date().toISOString()}`);
  const start = Date.now();
  try {
    await syncClients();
    state.lastTickAt         = new Date();
    state.lastTickDurationMs = Date.now() - start;
    state.tickCount++;
  } catch (err) {
    console.error("[ClientSync] Error:", err);
  }

  setTimeout(tick, DEFAULT_INTERVAL_MS);
}

export function startClientSyncWorker(): void {
  workerRegistry.get(WORKER_ID)!.resume = () => tick();
  console.log("[ClientSync] Starting...");
  tick();
}
