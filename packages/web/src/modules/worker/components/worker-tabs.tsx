"use client";

import { useState } from "react";
import { WorkerScheduleForm } from "./worker-schedule-form";
import { WorkerCadencesForm } from "./worker-cadences-form";
import { WorkerSmtpForm } from "./worker-smtp-form";
import type { WorkerConfig } from "../types";

const TABS = [
  { id: "schedule",  label: "Planification" },
  { id: "cadences",  label: "Délais de relance" },
  { id: "smtp",      label: "SMTP & expéditeur" },
];

interface WorkerTabsProps {
  config: WorkerConfig;
}

export function WorkerTabs({ config }: WorkerTabsProps) {
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-[#e6ebf1] mb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className="px-3.5 py-2.5 text-[13px] font-[550] cursor-pointer tracking-[-0.005em] transition-colors"
            style={{
              color: activeTab === t.id ? "#0a2540" : "#697386",
              borderBottom: activeTab === t.id ? "2px solid #0057ff" : "2px solid transparent",
              marginBottom: -1,
              background: "transparent",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {activeTab === "schedule" && <WorkerScheduleForm config={config} />}
        {activeTab === "cadences" && <WorkerCadencesForm config={config} />}
        {activeTab === "smtp"     && <WorkerSmtpForm config={config} />}
      </div>
    </div>
  );
}
