import { syncQuotations } from "../services/brainopx.service";
import { processReminders } from "../services/reminder.service";
import { WORKER_INTERVAL_MS } from "../config/reminder.config";

async function tick(): Promise<void> {
  console.log(`[Worker] Tick at ${new Date().toISOString()}`);
  try {
    await syncQuotations();   // 1. Sync BrainOpx → notre DB
    await processReminders(); // 2. Envoyer les relances dues
  } catch (err) {
    console.error("[Worker] Error during tick:", err);
  }
}

export function startWorker(): void {
  console.log("[Worker] Starting...");
  tick();
  setInterval(tick, WORKER_INTERVAL_MS);
}
