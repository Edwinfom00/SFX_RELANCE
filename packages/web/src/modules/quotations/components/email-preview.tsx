"use client";

import { useState } from "react";
import { SfxButton } from "@/components/sfx-ui";
import Link from "next/link";

interface EmailPreviewProps {
  quotationId: string;
  libelle: string;
  clientEmail: string;
  nextReminderNumber: number;
  nextReminderAt: Date | null;
  template: {
    id: number;
    name: string;
    subject: string;
    subjectEn: string;
    body: string;
    bodyEn: string;
  } | null;
  smtpFrom: string;
}

function resolveVars(text: string, quotationId: string, libelle: string): string {
  return text
    .replace(/\{\{quote\.id\}\}/g,      quotationId)
    .replace(/\{\{quote\.libelle\}\}/g,  libelle || quotationId)
    .replace(/\{\{quote\.client\}\}/g,   "[Code client]")
    .replace(/\{\{user\.fullName\}\}/g,  "Service Cotations")
    .replace(/\{\{user\.phone\}\}/g,     "");
}

export function EmailPreview({
  quotationId, libelle, clientEmail, nextReminderNumber,
  nextReminderAt, template, smtpFrom,
}: EmailPreviewProps) {
  const [lang, setLang] = useState<"fr" | "en">("fr");

  if (!template) {
    return (
      <div className="p-5 flex flex-col items-center justify-center gap-3 text-center h-full">
        <div className="text-[13px] text-[#697386]">
          Aucun template actif pour cette relance.
        </div>
        <Link href="/templates">
          <SfxButton variant="secondary" size="sm">Créer un template</SfxButton>
        </Link>
      </div>
    );
  }

  const subject = resolveVars(lang === "fr" ? template.subject : (template.subjectEn || template.subject), quotationId, libelle);
  const body    = resolveVars(lang === "fr" ? template.body    : (template.bodyEn    || template.body),    quotationId, libelle);

  return (
    <div className="p-5 flex flex-col gap-3.5">
      {/* Lang switch */}
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5 bg-[#f6f8fa] border border-[#e6ebf1] rounded-lg p-0.5">
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className="px-3 py-1 text-[12px] font-[550] rounded-md transition-all"
              style={{
                background: lang === l ? "#fff" : "transparent",
                color: lang === l ? "#0a2540" : "#697386",
                boxShadow: lang === l ? "0 1px 2px rgba(10,37,64,0.04)" : "none",
              }}
            >
              {l === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
            </button>
          ))}
        </div>
        <Link href={`/templates`}>
          <SfxButton variant="secondary" size="sm">Éditer le template</SfxButton>
        </Link>
      </div>

      {/* Email card */}
      <div className="border border-[#e6ebf1] rounded-[10px] overflow-hidden bg-white sfx-shadow-sm">
        {/* Headers */}
        <div
          className="px-4 py-3 bg-[#fafbfc] border-b border-[#e6ebf1] grid gap-1.5 text-[12.5px]"
          style={{ gridTemplateColumns: "auto 1fr" }}
        >
          <span className="font-semibold text-[#697386]">De</span>
          <span className="text-[#0a2540]">{smtpFrom || "cotations@sfx-logistics.com"}</span>
          <span className="font-semibold text-[#697386]">À</span>
          <span className="text-[#0a2540]">{clientEmail}</span>
          <span className="font-semibold text-[#697386]">Objet</span>
          <span className="text-[#0a2540] font-semibold">{subject}</span>
        </div>

        {/* Body */}
        <div className="px-5 py-4 text-[13px] text-[#0a2540] leading-[1.7] whitespace-pre-wrap font-sans max-h-[320px] overflow-auto">
          {body}
        </div>
      </div>

      {/* Info banner */}
      <div className="p-3 bg-[#f2f6ff] rounded-lg border border-[#e7efff] flex items-center gap-2.5">
        <svg className="h-3.5 w-3.5 text-[#0057ff] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <div className="text-[12px] text-[#425466] leading-[1.4] flex-1">
          Variables résolues automatiquement avant envoi.
          {nextReminderAt && (
            <> Si le client répond avant l'envoi, cette relance sera annulée automatiquement.</>
          )}
        </div>
      </div>
    </div>
  );
}
