"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, Filter, ExternalLink, Plus, Plane, Ship, Truck } from "lucide-react";
import { SfxButton } from "@/components/sfx-ui";

const tabs = [
  { label: "Toutes",   value: "ALL",  count: null },
  { label: "Aérien",   value: "AIR",  icon: Plane,  iconColor: "#0057ff" },
  { label: "Maritime", value: "SEA",  icon: Ship,   iconColor: "#0e9f6e" },
  { label: "Route",    value: "ROAD", icon: Truck,  iconColor: "#c28b00" },
];

export function QuotationsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const activeTransport = searchParams.get("transportType") ?? "ALL";
  const hasFilters = searchParams.has("status") || searchParams.has("transportType") || searchParams.has("search");

  return (
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
                className="flex items-center gap-1.5 px-3 py-[7px] rounded-[7px] text-[13px] font-[550] tracking-[-0.005em] cursor-pointer transition-all"
                style={{
                  color: isActive ? "#0a2540" : "#697386",
                  background: isActive ? "#fff" : "transparent",
                  border: isActive ? "1px solid #e6ebf1" : "1px solid transparent",
                  boxShadow: isActive ? "0 1px 2px rgba(10,37,64,0.04)" : "none",
                }}
              >
                {Icon && <Icon className="h-[13px] w-[13px]" style={{ color: (t as any).iconColor }} strokeWidth={2} />}
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <SfxButton variant="secondary" size="sm" icon={Filter}>Filtres</SfxButton>
          <SfxButton variant="secondary" size="sm" icon={ExternalLink}>Exporter</SfxButton>
          <SfxButton variant="primary" size="sm" icon={Plus}>Relancer manuellement</SfxButton>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center gap-2 flex-1 h-[34px] px-3 bg-white border border-[#e6ebf1] rounded-[7px] sfx-shadow-sm"
        >
          <Search className="h-3.5 w-3.5 text-[#8898aa] shrink-0" />
          <input
            type="text"
            placeholder="Rechercher par référence, client, email…"
            defaultValue={searchParams.get("search") ?? ""}
            onChange={(e) => update("search", e.target.value)}
            className="flex-1 text-[13px] text-[#0a2540] bg-transparent outline-none placeholder:text-[#8898aa]"
          />
        </div>
        {hasFilters && (
          <SfxButton variant="ghost" size="sm" onClick={() => router.push(pathname)}>
            Effacer filtres
          </SfxButton>
        )}
      </div>
    </div>
  );
}
