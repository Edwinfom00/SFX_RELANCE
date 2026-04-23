"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { SfxButton } from "@/components/sfx-ui";
import { Check } from "lucide-react";
import { updateWorkerConfigAction } from "../actions";
import type { WorkerConfig } from "../types";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 7];

const INTERVAL_OPTIONS = [
  { label: "Toutes les 15 minutes", value: 15, sub: "Scan très fréquent, haute réactivité" },
  { label: "Toutes les 30 minutes (recommandé)", value: 30, sub: "Scan fréquent, faible latence de détection" },
  { label: "Toutes les heures", value: 60, sub: "Charge réduite sur la BD source" },
];

interface WorkerScheduleFormProps {
  config: WorkerConfig;
}

export function WorkerScheduleForm({ config }: WorkerScheduleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [intervalMinutes, setIntervalMinutes] = useState(config.intervalMinutes);
  const [windowStart, setWindowStart] = useState(config.sendWindowStart);
  const [windowEnd, setWindowEnd] = useState(config.sendWindowEnd);
  const [activeDays, setActiveDays] = useState<number[]>(config.activeDays);
  const [sendDelay, setSendDelay] = useState(config.sendDelaySeconds);
  // Fuseau horaire — initialisé depuis la config, mis à jour avec celui du navigateur
  const [timezone, setTimezone] = useState(config.timezone ?? "Africa/Douala");

  useEffect(() => {
    // Récupérer le fuseau du navigateur (machine de l'utilisateur)
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTz && browserTz !== timezone) {
      setTimezone(browserTz);
    }
  }, []);

  function toggleDay(day: number) {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function handleSave() {
    startTransition(async () => {
      await updateWorkerConfigAction({
        intervalMinutes,
        sendWindowStart: windowStart,
        sendWindowEnd: windowEnd,
        activeDays,
        sendDelaySeconds: sendDelay,
        timezone,
      });
      toast.success("Planification mise à jour");
    });
  }

  return (
    <div>
      {/* Mode de déclenchement */}
      <SettingRow
        label="Mode de déclenchement"
        hint="Cadence de scan des cotations en base Brainvape."
      >
        <div className="flex flex-col gap-2">
          {INTERVAL_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setIntervalMinutes(o.value)}
              className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg cursor-pointer text-left w-full transition-all"
              style={{
                background: intervalMinutes === o.value ? "#f2f6ff" : "#fff",
                border: `1.5px solid ${intervalMinutes === o.value ? "#0057ff" : "#e6ebf1"}`,
              }}
            >
              <div
                className="w-4 h-4 rounded-full mt-px flex items-center justify-center shrink-0"
                style={{
                  background: intervalMinutes === o.value ? "#0057ff" : "#fff",
                  border: `1.5px solid ${intervalMinutes === o.value ? "#0057ff" : "#d8dee6"}`,
                }}
              >
                {intervalMinutes === o.value && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#0a2540]">{o.label}</div>
                <div className="text-[11.5px] text-[#697386] mt-0.5">{o.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Plage horaire */}
      <SettingRow
        label="Plage horaire d'envoi"
        hint="Hors de cette plage, les envois sont mis en queue et reprennent le lendemain."
      >
        <div>
          <div className="flex items-center gap-2.5">
            <TimeInput value={windowStart} onChange={setWindowStart} timezone={timezone} />
            <span className="text-[#8898aa] text-[13px]">→</span>
            <TimeInput value={windowEnd} onChange={setWindowEnd} timezone={timezone} />
          </div>
          <div className="flex gap-1.5 mt-3">
            {DAY_VALUES.map((d, i) => {
              const active = activeDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[12px] font-semibold cursor-pointer transition-all"
                  style={{
                    background: active ? "#0057ff" : "#fff",
                    color: active ? "#fff" : "#697386",
                    border: `1px solid ${active ? "#0057ff" : "#e6ebf1"}`,
                    boxShadow: active ? "0 1px 2px rgba(0,87,255,0.25)" : "0 1px 2px rgba(10,37,64,0.04)",
                  }}
                >
                  {DAY_LABELS[i]}
                </button>
              );
            })}
          </div>
        </div>
      </SettingRow>

      {/* Délai de sécurité */}
      <SettingRow
        label="Délai de sécurité par envoi"
        hint="Temps minimal entre deux emails consécutifs pour éviter les flags anti-spam."
        compact
      >
        <NumberInputWithSuffix
          value={sendDelay}
          onChange={setSendDelay}
          suffix="secondes"
          min={0}
          max={300}
        />
      </SettingRow>

      {/* Save */}
      <div className="pt-4 flex justify-end">
        <SfxButton variant="primary" size="sm" icon={Check} onClick={handleSave} disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer la planification"}
        </SfxButton>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SettingRow({
  label, hint, children, compact,
}: {
  label: string; hint?: string; children: React.ReactNode; compact?: boolean;
}) {
  return (
    <div
      className="grid py-[18px] border-b border-[#e6ebf1]"
      style={{ gridTemplateColumns: "280px 1fr", gap: 32, alignItems: compact ? "center" : "flex-start" }}
    >
      <div>
        <div className="text-[13.5px] font-semibold text-[#0a2540] tracking-[-0.005em]">{label}</div>
        {hint && <div className="text-[12px] text-[#697386] mt-1 leading-[1.5]">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TimeInput({ value, onChange, timezone }: { value: number; onChange: (v: number) => void; timezone: string }) {
  // Afficher juste la ville/région du fuseau (ex: "Africa/Douala" → "Douala")
  const tzShort = timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
  return (
    <div className="inline-flex items-center gap-2 h-[34px] px-3 bg-white border border-[#d8dee6] rounded-[7px] sfx-shadow-sm">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="text-[13px] font-mono text-[#0a2540] bg-transparent outline-none cursor-pointer"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
        ))}
      </select>
      <span className="text-[11.5px] text-[#697386] bg-[#f6f8fa] px-2 py-1 rounded text-[10.5px]">
        {tzShort}
      </span>
    </div>
  );
}

function NumberInputWithSuffix({
  value, onChange, suffix, min, max,
}: {
  value: number; onChange: (v: number) => void; suffix: string; min?: number; max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 h-[34px] px-3 bg-white border border-[#d8dee6] rounded-[7px] sfx-shadow-sm">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 text-[13px] font-mono text-[#0a2540] bg-transparent outline-none"
      />
      <span className="text-[11.5px] text-[#697386] bg-[#f6f8fa] px-2 py-1 rounded">
        {suffix}
      </span>
    </div>
  );
}
