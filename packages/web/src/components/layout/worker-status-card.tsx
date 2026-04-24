"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getWorkerStatusAction } from "@/modules/worker/actions/control";

interface WorkerStatus {
  paused: boolean;
  lastTickAt: string | null;
  lastTickDurationMs: number | null;
  tickCount: number;
  uptimeSeconds: number;
}

export function WorkerStatusCard() {
  const [status, setStatus]         = useState<WorkerStatus | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [nextLabel, setNextLabel]   = useState("--:--");
  const [progress, setProgress]     = useState(0);
  const [intervalMinutes, setIntervalMinutes] = useState(30);

 
  async function fetchStatus() {
    const result = await getWorkerStatusAction();
    if (result.success && result.data) {
      setStatus(result.data);
      setUnreachable(false);
    } else {
      setUnreachable(true);
    }
  }

  
  async function fetchInterval() {
    try {
      const res = await fetch("/api/worker-interval", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setIntervalMinutes(data.intervalMinutes ?? 30);
      }
    } catch {}
  }

  useEffect(() => {
    fetchStatus();
    fetchInterval();
    const statusInterval = setInterval(fetchStatus, 15_000);
    return () => clearInterval(statusInterval);
  }, []);

  
  useEffect(() => {
    const tick = () => {
      if (!status?.lastTickAt) {
        setNextLabel("--:--");
        setProgress(0);
        return;
      }
      const intervalSec = intervalMinutes * 60;
      const elapsed = Math.floor((Date.now() - new Date(status.lastTickAt).getTime()) / 1000);
      const posInCycle = elapsed % intervalSec;
      const remaining  = intervalSec - posInCycle;

      const mm = Math.floor(remaining / 60);
      const ss = remaining % 60;
      setNextLabel(`${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`);
      setProgress(Math.floor((posInCycle / intervalSec) * 100));
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [status?.lastTickAt, intervalMinutes]);

  const isOnline = !unreachable && status !== null;
  const isPaused = status?.paused ?? false;

  const dotColor = unreachable ? "#cd3d64" : isPaused ? "#c28b00" : "#0e9f6e";
  const dotGlow  = unreachable ? "#ffe1e6" : isPaused ? "#fff3d6" : "#defbe6";
  const barColor = unreachable ? "#cd3d64" : isPaused ? "#c28b00" : "#0e9f6e";

  const statusLabel = unreachable
    ? "Worker injoignable"
    : isPaused
      ? "Worker en pause"
      : "Worker actif";

  return (
    <Link href="/worker" className="block mx-3.5 mb-3.5 no-underline">
      <div className="p-3 bg-white border border-[#e6ebf1] rounded-[9px] hover:border-[#0057ff]/30 transition-colors cursor-pointer">
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="w-1.75 h-1.75 rounded-full shrink-0"
            style={{ background: dotColor, boxShadow: `0 0 0 3px ${dotGlow}` }}
          />
          <span className="text-xs font-semibold text-[#0a2540]">{statusLabel}</span>
        </div>

        {isOnline && !isPaused && (
          <div className="text-[11px] text-[#697386] leading-[1.45]">
            Prochaine exécution dans{" "}
            <b className="text-[#0a2540] font-mono tabular-nums">{nextLabel}</b>
          </div>
        )}

        {isPaused && (
          <div className="text-[11px] text-[#c28b00]">
            Les envois sont suspendus
          </div>
        )}

        {unreachable && (
          <div className="text-[11px] text-[#cd3d64]">
            Vérifiez que le service est démarré
          </div>
        )}

        <div className="mt-2 h-0.75 bg-[#e6ebf1] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${isOnline && !isPaused ? progress : 0}%`, background: barColor }}
          />
        </div>
      </div>
    </Link>
  );
}
