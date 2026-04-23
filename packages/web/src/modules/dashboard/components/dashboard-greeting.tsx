"use client";

import { useEffect, useState } from "react";

export function DashboardGreeting() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setLabel(`${dateStr} · ${timeStr}`);
  }, []);

  if (!label) return null;

  return (
    <div className="text-[12.5px] text-[#697386] font-[550] mb-1 capitalize">
      {label}
    </div>
  );
}
