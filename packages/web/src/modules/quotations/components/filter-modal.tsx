"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, Check, Filter } from "lucide-react";
import { SfxButton, TransportBadge, Pill } from "@/components/sfx-ui";

const STATUS_OPTIONS = [
  { value: "ACTIVE",    label: "Actif",                   tone: "blue"    as const },
  { value: "COMPLETED", label: "Client a répondu",        tone: "green"   as const },
  { value: "CLOSED",    label: "Clôturé sans réponse",    tone: "neutral" as const },
  { value: "CANCELLED", label: "Annulé",                  tone: "neutral" as const },
];

const REMINDER_OPTIONS = [
  { value: "0", label: "Aucune relance envoyée" },
  { value: "1", label: "1 relance envoyée" },
  { value: "2", label: "2 relances envoyées" },
  { value: "3", label: "3 relances envoyées (finale)" },
];

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
}

export function FilterModal({ open, onClose }: FilterModalProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const [status,    setStatus]    = useState(searchParams.get("status")        ?? "");
  const [transport, setTransport] = useState(searchParams.get("transportType") ?? "");
  const [reminder,  setReminder]  = useState(searchParams.get("reminder")      ?? "");
  const [dateFrom,  setDateFrom]  = useState(searchParams.get("dateFrom")      ?? "");
  const [dateTo,    setDateTo]    = useState(searchParams.get("dateTo")        ?? "");

  const activeCount = [status, transport, reminder, dateFrom, dateTo].filter(Boolean).length;

  function handleApply() {
    const params = new URLSearchParams(searchParams.toString());
    const set = (k: string, v: string) => v ? params.set(k, v) : params.delete(k);
    set("status",        status);
    set("transportType", transport);
    set("reminder",      reminder);
    set("dateFrom",      dateFrom);
    set("dateTo",        dateTo);
    router.push(`${pathname}?${params.toString()}`);
    onClose();
  }

  function handleReset() {
    setStatus(""); setTransport(""); setReminder(""); setDateFrom(""); setDateTo("");
    const params = new URLSearchParams(searchParams.toString());
    ["status", "transportType", "reminder", "dateFrom", "dateTo"].forEach((k) => params.delete(k));
    router.push(`${pathname}?${params.toString()}`);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10,37,64,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl w-[520px] sfx-shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-[#0a2540]">Filtres avancés</div>
            {activeCount > 0 && (
              <span className="text-[11px] font-semibold text-[#0057ff] bg-[#e7efff] px-1.5 py-0.5 rounded-full">
                {activeCount} actif{activeCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-[#8898aa] hover:text-[#425466] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-5">
          {/* Statut */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-2">
              Statut
            </label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setStatus(status === o.value ? "" : o.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all"
                  style={{
                    background: status === o.value ? "#f2f6ff" : "#fff",
                    border: `1.5px solid ${status === o.value ? "#0057ff" : "#e6ebf1"}`,
                    color: status === o.value ? "#0057ff" : "#425466",
                  }}
                >
                  {status === o.value && <Check className="h-3 w-3" strokeWidth={3} />}
                  <Pill tone={o.tone} size="xs">{o.label}</Pill>
                </button>
              ))}
            </div>
          </div>

          {/* Transport */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-2">
              Type de transport
            </label>
            <div className="flex gap-2">
              {(["AIR", "SEA", "ROAD"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTransport(transport === t ? "" : t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: transport === t ? "#f2f6ff" : "#fff",
                    border: `1.5px solid ${transport === t ? "#0057ff" : "#e6ebf1"}`,
                  }}
                >
                  {transport === t && <Check className="h-3 w-3 text-[#0057ff]" strokeWidth={3} />}
                  <TransportBadge type={t} />
                </button>
              ))}
            </div>
          </div>

          {/* Relances */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-2">
              Nombre de relances envoyées
            </label>
            <div className="flex gap-2 flex-wrap">
              {REMINDER_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setReminder(reminder === o.value ? "" : o.value)}
                  className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all"
                  style={{
                    background: reminder === o.value ? "#f2f6ff" : "#fff",
                    border: `1.5px solid ${reminder === o.value ? "#0057ff" : "#e6ebf1"}`,
                    color: reminder === o.value ? "#0057ff" : "#425466",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Période de transmission */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-2">
              Période de transmission
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[11px] text-[#8898aa] mb-1">Du</div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-[#d8dee6] rounded-lg text-[13px] text-[#0a2540] outline-none focus:border-[#0057ff] focus:shadow-[0_0_0_3px_#f2f6ff] transition-all"
                />
              </div>
              <span className="text-[#8898aa] mt-4">→</span>
              <div className="flex-1">
                <div className="text-[11px] text-[#8898aa] mb-1">Au</div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-[#d8dee6] rounded-lg text-[13px] text-[#0a2540] outline-none focus:border-[#0057ff] focus:shadow-[0_0_0_3px_#f2f6ff] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e6ebf1] flex items-center justify-between">
          <SfxButton variant="ghost" size="sm" onClick={handleReset}>
            Réinitialiser tout
          </SfxButton>
          <div className="flex gap-2">
            <SfxButton variant="ghost" size="sm" onClick={onClose}>Annuler</SfxButton>
            <SfxButton variant="primary" size="sm" icon={Check} onClick={handleApply}>
              Appliquer les filtres
            </SfxButton>
          </div>
        </div>
      </div>
    </div>
  );
}
