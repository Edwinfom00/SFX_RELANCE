"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PERIODS = [
  { label: "24h", value: "1" },
  { label: "7j",  value: "7" },
  { label: "30j", value: "30" },
  { label: "90j", value: "90" },
];

export function PeriodSelector({ current }: { current: string }) {
  const pathname = usePathname();

  return (
    <div className="flex bg-white border border-[#e6ebf1] rounded-[7px] p-0.5 sfx-shadow-sm">
      {PERIODS.map((p) => {
        const isActive = current === p.value;
        return (
          <Link
            key={p.value}
            href={`${pathname}?period=${p.value}`}
            className="px-3 py-1.5 text-[12.5px] font-[550] rounded-[5px] transition-colors"
            style={{
              color: isActive ? "#0a2540" : "#697386",
              background: isActive ? "#f6f8fa" : "transparent",
            }}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
