"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { SfxButton } from "@/components/sfx-ui";

const statusTabs = [
  { label: "Tous",        value: "ALL" },
  { label: "Envoyés",     value: "SENT" },
  { label: "Échoués",     value: "FAILED" },
  { label: "En attente",  value: "PENDING" },
  { label: "Retentés",    value: "RETRIED" },
];

export function LogsFilters() {
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

  const activeStatus = searchParams.get("status") ?? "ALL";

  return (
    <div className="flex gap-1">
      {statusTabs.map((t) => {
        const isActive = activeStatus === t.value;
        return (
          <button
            key={t.value}
            onClick={() => update("status", t.value)}
            className="px-3 py-[7px] rounded-[7px] text-[13px] font-[550] tracking-[-0.005em] cursor-pointer transition-all"
            style={{
              color: isActive ? "#0a2540" : "#697386",
              background: isActive ? "#fff" : "transparent",
              border: isActive ? "1px solid #e6ebf1" : "1px solid transparent",
              boxShadow: isActive ? "0 1px 2px rgba(10,37,64,0.04)" : "none",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
