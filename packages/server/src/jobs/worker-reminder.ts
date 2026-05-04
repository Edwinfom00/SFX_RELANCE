import prisma from "../utils/prisma";
import { processReminders } from "../services/reminder.service";
import { workerRegistry } from "../api/server";

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;

async function getIntervalMs(reminderNumber: 1 | 2 | 3): Promise<number> {
  try {
    const config = await prisma.workerConfig.findFirst({
      select: { intervalR1: true, intervalR2: true, intervalR3: true },
    });
    if (!config) return DEFAULT_INTERVAL_MS;
    const map: Record<number, number> = {
      1: (config as any).intervalR1 ?? 30,
      2: (config as any).intervalR2 ?? 30,
      3: (config as any).intervalR3 ?? 60,
    };
    return map[reminderNumber] * 60 * 1000;
  } catch {
    return DEFAULT_INTERVAL_MS;
  }
}

/** Démarre un worker dédié à un numéro de relance spécifique. */
export function startReminderWorker(reminderNumber: 1 | 2 | 3): void {
  const workerId = `r${reminderNumber}` as "r1" | "r2" | "r3";
  const tag      = `[R${reminderNumber}]`;

  async function tick(): Promise<void> {
    const state = workerRegistry.get(workerId)!;
    if (state.paused) {
      console.log(`${tag} Paused — waiting for resume`);
      return;
    }

    console.log(`${tag} Tick at ${new Date().toISOString()}`);
    const start = Date.now();
    try {
      await processReminders(reminderNumber);
      state.lastTickAt         = new Date();
      state.lastTickDurationMs = Date.now() - start;
      state.tickCount++;
    } catch (err) {
      console.error(`${tag} Error:`, err);
    }

    const intervalMs = await getIntervalMs(reminderNumber);
    setTimeout(tick, intervalMs);
  }

  workerRegistry.get(workerId)!.resume = () => tick();
  console.log(`${tag} Starting...`);
  tick();
}
