"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Filter, Download, Plane, Ship, Truck } from "lucide-react";
import { SfxButton } from "@/components/sfx-ui";
import { FilterModal } from "./filter-modal";

const tabs = [
  { label: "Toutes",   value: "ALL"  },
  { label: "Aérien",   value: "AIR",  icon: Plane,  iconColor: "#0057ff" },
  { label: "Maritime", value: "SEA",  icon: Ship,   iconColor: "#0e9f6e" },
  { label: "Route",    value: "ROAD", icon: Truck,  iconColor: "#c28b00" },
];

export function QuotationsFilters() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting,  setExporting]  = useState(false);

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const activeTransport = searchParams.get("transportType") ?? "ALL";

  // Compte les filtres avancés actifs
  const advancedCount = ["status", "reminder", "dateFrom", "dateTo"]
    .filter((k) => searchParams.has(k)).length;

  const hasFilters = searchParams.has("status") || searchParams.has("transportType") ||
    searchParams.has("search") || searchParams.has("reminder") ||
    searchParams.has("dateFrom") || searchParams.has("dateTo");

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const res = await fetch(`/api/quotations/export?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur export");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `cotations_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3.5">
        {/* Tabs + actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {tabs.map((t) => {
              const isActive = activeTransport === t.value;
              const Icon = (t as any).icon;
              return (
                <button
                  key={t.value}
                  onClick={() => update("transportType", t.value)}
                  className="flex items-center gap-1.5 px-3 py-1.75 rounded-[7px] text-[13px] font-[550] tracking-[-0.005em] cursor-pointer transition-all"
                  style={{
                    color:      isActive ? "#0a2540" : "#697386",
                    background: isActive ? "#fff" : "transparent",
                    border:     isActive ? "1px solid #e6ebf1" : "1px solid transparent",
                    boxShadow:  isActive ? "0 1px 2px rgba(10,37,64,0.04)" : "none",
                  }}
                >
                  {Icon && <Icon className="h-3.25 w-3.25" style={{ color: (t as any).iconColor }} strokeWidth={2} />}
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            {/* Bouton Filtres avec badge */}
            <button
              onClick={() => setFilterOpen(true)}
              className="relative flex items-center gap-1.5 h-7 px-2.5 rounded-[7px] text-[12.5px] font-medium transition-all"
              style={{
                background: advancedCount > 0 ? "#f2f6ff" : "#fff",
                color:      advancedCount > 0 ? "#0057ff" : "#425466",
                border:     `1px solid ${advancedCount > 0 ? "#0057ff" : "#d8dee6"}`,
                boxShadow:  "0 1px 2px rgba(10,37,64,0.04)",
              }}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtres
              {advancedCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#0057ff] text-white text-[10px] font-bold">
                  {advancedCount}
                </span>
              )}
            </button>

            {/* Export Excel */}
            <SfxButton
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Export…" : "Exporter Excel"}
            </SfxButton>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 flex-1 h-8.5 px-3 bg-white border border-[#e6ebf1] rounded-[7px] sfx-shadow-sm">
            <Search className="h-3.5 w-3.5 text-[#8898aa] shrink-0" />
            <input
              type="text"
              placeholder="Rechercher par référence, libellé, client, email…"
              defaultValue={searchParams.get("search") ?? ""}
              onChange={(e) => update("search", e.target.value)}
              className="flex-1 text-[13px] text-[#0a2540] bg-transparent outline-none placeholder:text-[#8898aa]"
            />
          </div>
          {hasFilters && (
            <SfxButton variant="ghost" size="sm" onClick={() => router.push(pathname)}>
              Effacer tout
            </SfxButton>
          )}
        </div>
      </div>

      <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  );
}
