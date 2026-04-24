import express from "express";
import { syncQuotations } from "../services/brainopx.service";
import { processReminders } from "../services/reminder.service";

interface WorkerState {
  paused: boolean;
  lastTickAt: Date | null;
  lastTickDurationMs: number | null;
  tickCount: number;
  startedAt: Date;
}

export const workerState: WorkerState = {
  paused:             false,
  lastTickAt:         null,
  lastTickDurationMs: null,
  tickCount:          0,
  startedAt:          new Date(),
};

/** Exécute un tick complet (sync + relances) et met à jour workerState. */
export async function runTick(): Promise<void> {
  const start = Date.now();
  await syncQuotations();
  await processReminders();
  workerState.lastTickAt         = new Date();
  workerState.lastTickDurationMs = Date.now() - start;
  workerState.tickCount++;
}

/** Démarre le serveur HTTP de contrôle du worker sur le port WORKER_API_PORT (défaut 3002). */
export function startApiServer(): void {
  const app   = express();
  const port  = Number(process.env.WORKER_API_PORT ?? 3002);
  const token = process.env.WORKER_API_TOKEN ?? "";

  app.use(express.json());

  app.use((req, res, next) => {
    if (!token) return next();
    if (req.headers.authorization !== `Bearer ${token}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });

  /** GET /status — état courant du worker */
  app.get("/status", (_req, res) => {
    res.json({
      paused:             workerState.paused,
      lastTickAt:         workerState.lastTickAt,
      lastTickDurationMs: workerState.lastTickDurationMs,
      tickCount:          workerState.tickCount,
      uptimeSeconds:      Math.floor((Date.now() - workerState.startedAt.getTime()) / 1000),
    });
  });

  /** POST /tick — force un tick immédiat */
  app.post("/tick", async (_req, res) => {
    if (workerState.paused) {
      res.status(409).json({ error: "Worker is paused" });
      return;
    }
    try {
      await runTick();
      res.json({ success: true, lastTickAt: workerState.lastTickAt, durationMs: workerState.lastTickDurationMs });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  /** POST /pause — arrête le cycle après le tick courant */
  app.post("/pause", (_req, res) => {
    workerState.paused = true;
    console.log("[Worker API] Paused — cycle will stop after current tick");
    res.json({ success: true, paused: true });
  });

  /** POST /resume — reprend le cycle immédiatement */
  app.post("/resume", (_req, res) => {
    const wasPaused = workerState.paused;
    workerState.paused = false;
    console.log("[Worker API] Resumed");
    if (wasPaused) {
      // Import dynamique pour éviter la dépendance circulaire api ↔ worker
      import("../jobs/worker")
        .then(({ resumeCycle }) => resumeCycle())
        .catch((err) => console.error("[Worker API] Resume error:", err));
    }
    res.json({ success: true, paused: false });
  });

  app.listen(port, () => {
    console.log(`[Worker API] Listening on port ${port}`);
  });
}
