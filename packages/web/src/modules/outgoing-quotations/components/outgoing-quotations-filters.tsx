"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Toutes",    value: "" },
  { label: "Aérien",   value: "AIR" },
  { label: "Maritime", value: "SEA" },
  { label: "Route",    value: "ROAD" },
];

export function OutgoingQuotationsFilters() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const current      = searchParams.get("transportType") ?? "";
  const searchValue  = searchParams.get("search") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => updateParam("search", e.target.value),
    [searchParams],
  );

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Transport tabs */}
      <div className="flex items-center gap-0.5 bg-[#f6f8fa] border border-[#e6ebf1] rounded-lg p-0.75">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => updateParam("transportType", tab.value)}
            className={cn(
              "h-7 px-3.5 rounded-md text-[12.5px] font-medium transition-all",
              current === tab.value
                ? "bg-white text-[#0a2540] shadow-sm border border-[#e6ebf1]"
                : "text-[#697386] hover:text-[#425466]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-1.5 h-8 px-2.5 bg-white border border-[#e6ebf1] rounded-lg text-[12.5px] text-[#8898aa] w-56">
        <Search className="h-3.25 w-3.25 shrink-0" />
        <input
          value={searchValue}
          onChange={handleSearch}
          placeholder="Rechercher N°, client, dossier…"
          className="flex-1 bg-transparent outline-none text-[#0a2540] placeholder:text-[#8898aa]"
        />
      </div>
    </div>
  );
}
