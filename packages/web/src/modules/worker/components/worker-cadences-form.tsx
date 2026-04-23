"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SfxButton, TransportBadge } from "@/components/sfx-ui";
import { Check, Clock } from "lucide-react";
import { updateWorkerConfigAction } from "../actions";
import type { WorkerConfig, ReminderScheduleEntry } from "../types";

interface WorkerCadencesFormProps {
  config: WorkerConfig;
}

type TransportKey = "cadenceAir" | "cadenceSea" | "cadenceRoad";

const TRANSPORT_ROWS: { type: string; key: TransportKey; label: string }[] = [
  { type: "AIR",  key: "cadenceAir",  label: "Aérien" },
  { type: "SEA",  key: "cadenceSea",  label: "Maritime" },
  { type: "ROAD", key: "cadenceRoad", label: "Route" },
];

function formatHours(h: number): string {
  if (h < 24) return `${h} h`;
  if (h === 168) return "7 jours";
  return `${h / 24} jours`;
}

function parseHours(s: string): number {
  const trimmed = s.trim().toLowerCase();
  if (trimmed.endsWith("jours") || trimmed.endsWith("j")) {
    return parseFloat(trimmed) * 24;
  }
  return parseFloat(trimmed) || 0;
}

export function WorkerCadencesForm({ config }: WorkerCadencesFormProps) {
  const [isPending, startTransition] = useTransition();

  const [cadences, setCadences] = useState<Record<TransportKey, ReminderScheduleEntry[]>>({
    cadenceAir: config.cadenceAir,
    cadenceSea: config.cadenceSea,
    cadenceRoad: config.cadenceRoad,
  });

  function updateDelay(key: TransportKey, reminderNumber: number, delayHours: number) {
    setCadences((prev) => ({
      ...prev,
      [key]: prev[key].map((e) =>
        e.reminderNumber === reminderNumber ? { ...e, delayHours } : e
      ),
    }));
  }

  function handleSave() {
    startTransition(async () => {
      await updateWorkerConfigAction({
        cadenceAir: cadences.cadenceAir,
        cadenceSea: cadences.cadenceSea,
        cadenceRoad: cadences.cadenceRoad,
      });
      toast.success("Cadences mises à jour");
    });
  }

  return (
    <div>
      <div className="pb-1">
        <div className="text-[16px] font-semibold text-[#0a2540] tracking-[-0.015em]">
          Cadences par mode de transport
        </div>
        <div className="text-[12.5px] text-[#697386] mt-0.5">
          Délais calculés à partir de la date de transmission de la cotation.
        </div>
      </div>

      <div className="mt-3.5 border border-[#e6ebf1] rounded-xl overflow-hidden bg-white sfx-shadow-sm">
        {/* Header */}
        <div
          className="grid gap-4 px-[18px] py-3 bg-[#fafbfc] border-b border-[#e6ebf1] text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]"
          style={{ gridTemplateColumns: "180px 1fr 1fr 1fr" }}
        >
          <div>Transport</div>
          <div>Relance #1</div>
          <div>Relance #2</div>
          <div>Relance #3 · finale</div>
        </div>

        {TRANSPORT_ROWS.map((row, i) => {
          const entries = cadences[row.key];
          return (
            <div
              key={row.type}
              className="grid gap-4 px-[18px] py-3.5 items-center"
              style={{
                gridTemplateColumns: "180px 1fr 1fr 1fr",
                borderBottom: i < TRANSPORT_ROWS.length - 1 ? "1px solid #e6ebf1" : "none",
              }}
            >
              <TransportBadge type={row.type} size="lg" />
              {[1, 2, 3].map((n) => {
                const entry = entries.find((e) => e.reminderNumber === n);
                return (
                  <DelayInput
                    key={n}
                    value={entry?.delayHours ?? 24}
                    onChange={(v) => updateDelay(row.key, n as 1 | 2 | 3, v)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Warning */}
      <div
        className="mt-3.5 flex gap-2.5 items-start px-3.5 py-3 rounded-[9px]"
        style={{ background: "rgba(255,243,214,0.8)", border: "1px solid #fff3d6" }}
      >
        <Clock className="h-[15px] w-[15px] text-[#c28b00] mt-px shrink-0" strokeWidth={2} />
        <div className="text-[12.5px] text-[#425466] leading-[1.5]">
          Règle métier : si une cotation disparaît de Brainvape entre deux scans, toutes les
          relances suivantes sont annulées automatiquement et une notification est émise.
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <SfxButton variant="primary" size="sm" icon={Check} onClick={handleSave} disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer les cadences"}
        </SfxButton>
      </div>
    </div>
  );
}

function DelayInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw] = useState(formatHours(value));
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="inline-flex items-center gap-2 h-[34px] px-3 bg-white border rounded-[7px] sfx-shadow-sm transition-all"
      style={{ border: `1px solid ${focused ? "#0057ff" : "#d8dee6"}`, boxShadow: focused ? "0 0 0 3px #f2f6ff" : undefined }}
    >
      <input
        value={focused ? raw : formatHours(value)}
        onFocus={() => { setRaw(formatHours(value)); setFocused(true); }}
        onBlur={() => {
          setFocused(false);
          const parsed = parseHours(raw);
          if (parsed > 0) onChange(parsed);
        }}
        onChange={(e) => setRaw(e.target.value)}
        className="w-20 text-[13px] font-mono text-[#0a2540] bg-transparent outline-none"
      />
      <span className="text-[10.5px] text-[#697386] bg-[#f6f8fa] px-1.5 py-0.5 rounded whitespace-nowrap">
        après transmission
      </span>
    </div>
  );
}
