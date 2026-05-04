"use client";

import { useState, useTransition, useEffect } from "react";
import { Play, Pause, RefreshCw, Loader, RefreshCcw } from "lucide-react";
import { SfxButton, Pill } from "@/components/sfx-ui";
import { toast } from "sonner";
import {
  getWorkerStatusAction,
  triggerTickAction,
  pauseWorkerAction,
  resumeWorkerAction,
  pauseAllAction,
  resumeAllAction,
  type WorkerId,
} from "../actions/control";

interface WorkerState {
  id: string;
  label: string;
  paused: boolean;
  lastTickAt: string | null;
  lastTickDurationMs: number | null;
  tickCount: number;
  uptimeSeconds: number;
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}j ${h}h ${m}min`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

const WORKER_ORDER: WorkerId[] = ["sync", "r1", "r2", "r3"];

const WORKER_COLORS: Record<WorkerId, string> = {
  sync: "#697386",
  r1:   "#0057ff",
  r2:   "#7c4dff",
  r3:   "#cd3d64",
};

export function WorkerControlBanner() {
  const [isPending, startTransition] = useTransition();
  const [workers, setWorkers]        = useState<Record<string, WorkerState>>({});
  const [unreachable, setUnreachable] = useState(false);

  async function fetchStatus() {
    const result = await getWorkerStatusAction();
    if (result.success && result.data?.workers) {
      setWorkers(result.data.workers);
      setUnreachable(false);
    } else {
      setUnreachable(true);
    }
  }

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 10_000);
    return () => clearInterval(t);
  }, []);

  const allPaused  = Object.values(workers).every((w) => w.paused);
  const anyPaused  = Object.values(workers).some((w) => w.paused);
  const isOnline   = !unreachable && Object.keys(workers).length > 0;

  function handlePauseAll() {
    startTransition(async () => {
      const r = await pauseAllAction();
      if (r.success) { toast.success("Tous les workers mis en pause"); fetchStatus(); }
      else toast.error(r.error);
    });
  }

  function handleResumeAll() {
    startTransition(async () => {
      const r = await resumeAllAction();
      if (r.success) { toast.success("Tous les workers repris"); fetchStatus(); }
      else toast.error(r.error);
    });
  }

  function handleTick(id: WorkerId) {
    startTransition(async () => {
      const r = await triggerTickAction(id);
      if (r.success) { toast.success(`Tick ${id} exécuté en ${r.data?.durationMs ?? "?"}ms`); fetchStatus(); }
      else toast.error(r.error);
    });
  }

  function handleToggle(id: WorkerId, paused: boolean) {
    startTransition(async () => {
      const r = paused ? await resumeWorkerAction(id) : await pauseWorkerAction(id);
      if (r.success) { toast.success(paused ? `${id} repris` : `${id} mis en pause`); fetchStatus(); }
      else toast.error(r.error);
    });
  }

  return (
    <div
      className="rounded-xl mb-5 sfx-shadow-sm overflow-hidden"
      style={{ border: `1px solid ${unreachable ? "#ffe1e6" : "#e7efff"}` }}
    >
      {/* Header global */}
      <div
        className="flex items-center gap-4 px-5 py-4"
        style={{ background: "linear-gradient(90deg, #fff 0%, #f2f6ff 100%)" }}
      >
        <div className="relative w-11 h-11 rounded-[10px] bg-white flex items-center justify-center sfx-shadow-sm shrink-0"
          style={{ color: unreachable ? "#cd3d64" : anyPaused ? "#c28b00" : "#0e9f6e" }}>
          {isPending
            ? <Loader className="h-4.5 w-4.5 animate-spin" />
            : anyPaused ? <Pause className="h-4.5 w-4.5" strokeWidth={2.25} />
            : <Play className="h-4.5 w-4.5" strokeWidth={2.25} />
          }
          {isOnline && !anyPaused && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#0e9f6e] rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[#0a2540] tracking-[-0.01em]">
              SFX Relance Workers
            </span>
            {unreachable
              ? <Pill tone="red">Injoignable</Pill>
              : allPaused ? <Pill tone="amber">Tous en pause</Pill>
              : anyPaused ? <Pill tone="amber">Partiellement en pause</Pill>
              : <Pill tone="green">4 workers actifs</Pill>
            }
          </div>
          <div className="text-[12.5px] text-[#697386] mt-0.5">
            {unreachable
              ? <span className="text-[#cd3d64]">Impossible de joindre l'API worker</span>
              : isOnline
                ? `Uptime : ${formatUptime(workers["sync"]?.uptimeSeconds ?? 0)}`
                : "Connexion…"
            }
          </div>
        </div>

        <div className="flex gap-2">
          {isOnline && (allPaused ? (
            <SfxButton variant="secondary" size="sm" icon={Play} onClick={handleResumeAll} disabled={isPending}>
              Reprendre tout
            </SfxButton>
          ) : (
            <SfxButton variant="secondary" size="sm" icon={Pause} onClick={handlePauseAll} disabled={isPending}>
              Tout mettre en pause
            </SfxButton>
          ))}
        </div>
      </div>

      {/* Grille des 4 workers */}
      {isOnline && (
        <div className="grid grid-cols-4 border-t border-[#e6ebf1]">
          {WORKER_ORDER.map((id, i) => {
            const w = workers[id];
            if (!w) return null;
            const color = WORKER_COLORS[id];
            const isLast = i === WORKER_ORDER.length - 1;

            return (
              <div
                key={id}
                className="px-4 py-3 flex flex-col gap-2"
                style={{
                  borderRight: isLast ? "none" : "1px solid #e6ebf1",
                  background: w.paused ? "rgba(194,139,0,0.03)" : "#fff",
                }}
              >
                {/* Header worker */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: w.paused ? "#c28b00" : color }}
                    />
                    <span className="text-[12px] font-semibold text-[#0a2540]">{w.label}</span>
                  </div>
                  {w.paused
                    ? <Pill tone="amber" size="xs">Pause</Pill>
                    : <Pill tone="green" size="xs">Actif</Pill>
                  }
                </div>

                {/* Stats */}
                <div className="text-[11px] text-[#697386] space-y-0.5">
                  <div>
                    <span className="text-[#8898aa]">Ticks : </span>
                    <span className="font-mono text-[#0a2540] font-semibold">{w.tickCount}</span>
                  </div>
                  {w.lastTickDurationMs !== null && (
                    <div>
                      <span className="text-[#8898aa]">Dernier : </span>
                      <span className="font-mono text-[#0a2540]">{w.lastTickDurationMs}ms</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 mt-auto">
                  <button
                    onClick={() => handleToggle(id, w.paused)}
                    disabled={isPending}
                    className="flex items-center justify-center w-6 h-6 rounded text-[#697386] hover:bg-[#f6f8fa] transition-colors disabled:opacity-40"
                    title={w.paused ? "Reprendre" : "Mettre en pause"}
                  >
                    {w.paused
                      ? <Play className="h-3 w-3" strokeWidth={2.5} />
                      : <Pause className="h-3 w-3" strokeWidth={2.5} />
                    }
                  </button>
                  <button
                    onClick={() => handleTick(id)}
                    disabled={isPending || w.paused}
                    className="flex items-center justify-center w-6 h-6 rounded text-[#697386] hover:bg-[#f6f8fa] transition-colors disabled:opacity-40"
                    title="Forcer un tick"
                  >
                    <RefreshCw className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
