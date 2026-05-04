import express from "express";
import { syncQuotations } from "../services/brainopx.service";
import { processReminders } from "../services/reminder.service";

export interface WorkerState {
  id:                 string;
  label:              string;
  paused:             boolean;
  lastTickAt:         Date | null;
  lastTickDurationMs: number | null;
  tickCount:          number;
  startedAt:          Date;
  resume:             (() => void) | null;
}

/** Registre partagé de tous les workers — clé = workerId */
export const workerRegistry = new Map<string, WorkerState>([
  ["sync", { id: "sync", label: "Sync BrainOpx", paused: false, lastTickAt: null, lastTickDurationMs: null, tickCount: 0, startedAt: new Date(), resume: null }],
  ["r1",   { id: "r1",   label: "Relance #1",    paused: false, lastTickAt: null, lastTickDurationMs: null, tickCount: 0, startedAt: new Date(), resume: null }],
  ["r2",   { id: "r2",   label: "Relance #2",    paused: false, lastTickAt: null, lastTickDurationMs: null, tickCount: 0, startedAt: new Date(), resume: null }],
  ["r3",   { id: "r3",   label: "Relance #3",    paused: false, lastTickAt: null, lastTickDurationMs: null, tickCount: 0, startedAt: new Date(), resume: null }],
]);

function stateSnapshot(s: WorkerState) {
  return {
    id:                 s.id,
    label:              s.label,
    paused:             s.paused,
    lastTickAt:         s.lastTickAt,
    lastTickDurationMs: s.lastTickDurationMs,
    tickCount:          s.tickCount,
    uptimeSeconds:      Math.floor((Date.now() - s.startedAt.getTime()) / 1000),
  };
}

/** Exécute un tick pour un worker donné (utilisé par POST /workers/:id/tick). */
export async function runTickFor(workerId: string): Promise<void> {
  const start = Date.now();
  if (workerId === "sync") {
    await syncQuotations();
  } else if (workerId === "r1") {
    await processReminders(1);
  } else if (workerId === "r2") {
    await processReminders(2);
  } else if (workerId === "r3") {
    await processReminders(3);
  } else {
    throw new Error(`Unknown worker: ${workerId}`);
  }
  const state = workerRegistry.get(workerId)!;
  state.lastTickAt         = new Date();
  state.lastTickDurationMs = Date.now() - start;
  state.tickCount++;
}

/** Démarre le serveur HTTP de contrôle sur WORKER_API_PORT (défaut 3002). */
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

  /** GET /status — état de tous les workers */
  app.get("/status", (_req, res) => {
    const workers: Record<string, ReturnType<typeof stateSnapshot>> = {};
    workerRegistry.forEach((s, id) => { workers[id] = stateSnapshot(s); });
    res.json({ workers });
  });

  /** GET /workers/:id/status */
  app.get("/workers/:id/status", (req, res) => {
    const state = workerRegistry.get(req.params.id);
    if (!state) { res.status(404).json({ error: "Worker not found" }); return; }
    res.json(stateSnapshot(state));
  });

  /** POST /workers/:id/tick — force un tick immédiat */
  app.post("/workers/:id/tick", async (req, res) => {
    const state = workerRegistry.get(req.params.id);
    if (!state) { res.status(404).json({ error: "Worker not found" }); return; }
    if (state.paused) { res.status(409).json({ error: "Worker is paused" }); return; }
    try {
      await runTickFor(req.params.id);
      res.json({ success: true, lastTickAt: state.lastTickAt, durationMs: state.lastTickDurationMs });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  /** POST /workers/:id/pause */
  app.post("/workers/:id/pause", (req, res) => {
    const state = workerRegistry.get(req.params.id);
    if (!state) { res.status(404).json({ error: "Worker not found" }); return; }
    state.paused = true;
    console.log(`[API] ${state.label} paused`);
    res.json({ success: true, paused: true });
  });

  /** POST /workers/:id/resume */
  app.post("/workers/:id/resume", (req, res) => {
    const state = workerRegistry.get(req.params.id);
    if (!state) { res.status(404).json({ error: "Worker not found" }); return; }
    const wasPaused = state.paused;
    state.paused = false;
    console.log(`[API] ${state.label} resumed`);
    if (wasPaused && state.resume) state.resume();
    res.json({ success: true, paused: false });
  });

  /** POST /pause-all / POST /resume-all */
  app.post("/pause-all", (_req, res) => {
    workerRegistry.forEach((s) => { s.paused = true; });
    console.log("[API] All workers paused");
    res.json({ success: true });
  });

  app.post("/resume-all", (_req, res) => {
    workerRegistry.forEach((s) => {
      const wasPaused = s.paused;
      s.paused = false;
      if (wasPaused && s.resume) s.resume();
    });
    console.log("[API] All workers resumed");
    res.json({ success: true });
  });

  app.listen(port, () => {
    console.log(`[Worker API] Listening on port ${port}`);
  });
}
