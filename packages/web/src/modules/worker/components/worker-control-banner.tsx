"use client";

import { useState, useTransition, useEffect } from "react";
import { Play, Pause, RefreshCw, Loader } from "lucide-react";
import { SfxButton, Pill } from "@/components/sfx-ui";
import { toast } from "sonner";
import { triggerTickAction, pauseWorkerAction, resumeWorkerAction, getWorkerStatusAction } from "../actions/control";

interface WorkerStatus {
  paused: boolean;
  lastTickAt: string | null;
  lastTickDurationMs: number | null;
  tickCount: number;
  uptimeSeconds: number;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h ${m}min`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export function WorkerControlBanner() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<WorkerStatus | null>(null);
  const [unreachable, setUnreachable] = useState(false);

  async function fetchStatus() {
    const result = await getWorkerStatusAction();
    if (result.success && result.data) {
      setStatus(result.data);
      setUnreachable(false);
    } else {
      setUnreachable(true);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15_000);
    return () => clearInterval(interval);
  }, []);

  function handleTick() {
    startTransition(async () => {
      const result = await triggerTickAction();
      if (result.success) {
        toast.success(`Tick exécuté en ${result.data?.durationMs ?? "?"}ms`);
        fetchStatus();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handlePause() {
    startTransition(async () => {
      const result = await pauseWorkerAction();
      if (result.success) { toast.success("Worker mis en pause"); fetchStatus(); }
      else toast.error(result.error);
    });
  }

  function handleResume() {
    startTransition(async () => {
      const result = await resumeWorkerAction();
      if (result.success) { toast.success("Worker repris"); fetchStatus(); }
      else toast.error(result.error);
    });
  }

  const isOnline  = !unreachable && status !== null;
  const isPaused  = status?.paused ?? false;

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl mb-5 sfx-shadow-sm"
      style={{
        background: "linear-gradient(90deg, #fff 0%, #f2f6ff 100%)",
        border: `1px solid ${unreachable ? "#ffe1e6" : "#e7efff"}`,
      }}
    >
      {/* Icône statut */}
      <div
        className="relative w-11 h-11 rounded-[10px] flex items-center justify-center sfx-shadow-sm shrink-0"
        style={{ background: "#fff", color: unreachable ? "#cd3d64" : isPaused ? "#c28b00" : "#0e9f6e" }}
      >
        {isPending
          ? <Loader className="h-4.5 w-4.5 animate-spin" />
          : isPaused
            ? <Pause className="h-4.5 w-4.5" strokeWidth={2.25} />
            : <Play className="h-4.5 w-4.5" strokeWidth={2.25} />
        }
        {isOnline && !isPaused && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: "#0e9f6e" }}
          />
        )}
      </div>

      {/* Infos */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-[#0a2540] tracking-[-0.01em]">
            Worker Windows Service · sfx-relance-worker
          </span>
          {unreachable
            ? <Pill tone="red">Injoignable</Pill>
            : isPaused
              ? <Pill tone="amber">En pause</Pill>
              : <Pill tone="green">En ligne</Pill>
          }
        </div>
        <div className="text-[12.5px] text-[#697386] mt-0.5">
          {unreachable ? (
            <span className="text-[#cd3d64]">Impossible de joindre l'API worker sur {process.env.NEXT_PUBLIC_WORKER_API_URL ?? "localhost:3002"}</span>
          ) : status ? (
            <>
              Uptime <span className="font-mono text-[#0a2540]">{formatUptime(status.uptimeSeconds)}</span>
              <span className="mx-2 text-[#8898aa]">·</span>
              {status.tickCount} tick{status.tickCount > 1 ? "s" : ""}
              {status.lastTickDurationMs !== null && (
                <>
                  <span className="mx-2 text-[#8898aa]">·</span>
                  Dernier tick <span className="font-mono text-[#0a2540]">{status.lastTickDurationMs}ms</span>
                </>
              )}
            </>
          ) : (
            <span className="text-[#8898aa]">Connexion…</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isOnline && !isPaused && (
          <SfxButton variant="secondary" size="sm" icon={Pause} onClick={handlePause} disabled={isPending}>
            Mettre en pause
          </SfxButton>
        )}
        {isOnline && isPaused && (
          <SfxButton variant="secondary" size="sm" icon={Play} onClick={handleResume} disabled={isPending}>
            Reprendre
          </SfxButton>
        )}
        <SfxButton
          variant="primary"
          size="sm"
          icon={isPending ? Loader : RefreshCw}
          onClick={handleTick}
          disabled={isPending || !isOnline || isPaused}
        >
          Exécuter maintenant
        </SfxButton>
      </div>
    </div>
  );
}
