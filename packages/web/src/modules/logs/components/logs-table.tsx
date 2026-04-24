"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { TransportBadge, EmailStatusPill, SfxAvatar } from "@/components/sfx-ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EmailLog } from "../types";

interface LogsTableProps {
  logs: EmailLog[];
}

const reminderLabel: Record<number, string> = {
  1: "Relance 1", 2: "Relance 2", 3: "Relance 3",
};

export function LogsTable({ logs }: LogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#8898aa] bg-white border border-[#e6ebf1] rounded-xl">
        <p className="text-sm">Aucun log d'envoi</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden sfx-shadow-sm">
      {/* Header */}
      <div
        className="grid gap-3.5 items-center px-4.5 py-3 border-b border-[#e6ebf1] bg-[#fafbfc]"
        style={{ gridTemplateColumns: "1.2fr 1.5fr 100px 100px 80px 140px 32px" }}
      >
        {["Cotation", "Destinataire", "Relance", "Statut", "Tentatives", "Date d'envoi", ""].map((h, i) => (
          <div key={i} className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">{h}</div>
        ))}
      </div>

      {/* Rows */}
      {logs.map((log, i) => (
        <div
          key={log.id}
          className="grid gap-3.5 items-center px-4.5 py-3.5 hover:bg-[#fafbfc] transition-colors"
          style={{
            gridTemplateColumns: "1.2fr 1.5fr 100px 100px 80px 140px 32px",
            borderBottom: i < logs.length - 1 ? "1px solid #e6ebf1" : "none",
          }}
        >
          {/* Cotation */}
          <div>
            <div className="flex items-center gap-2">
              {log.quotation?.clientCode && <SfxAvatar name={log.quotation.clientCode} size={22} />}
              <div>
                <div className="text-[12.5px] font-semibold text-[#0057ff] font-mono">
                  {log.quotation?.quotationId ?? `#${log.quotationId}`}
                </div>
                {log.quotation?.clientCode && (
                  <div className="text-[11.5px] text-[#697386]">{log.quotation.clientCode}</div>
                )}
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div className="text-[12.5px] text-[#425466] font-mono truncate">{log.recipientEmail}</div>

          {/* Reminder */}
          <div>
            <div className="text-[12px] text-[#425466]">
              {reminderLabel[log.reminderNumber] ?? `Relance ${log.reminderNumber}`}
            </div>
            {log.quotation?.transportType && (
              <div className="mt-0.5">
                <TransportBadge type={log.quotation.transportType} />
              </div>
            )}
          </div>

          {/* Status */}
          <EmailStatusPill status={log.status} />

          {/* Retries */}
          <div className="text-[12px] text-[#697386]">
            {log.retryCount === 0 ? "1 tentative" : `${log.retryCount + 1} tentatives`}
          </div>

          {/* Date */}
          <div className="text-[12px] text-[#697386] font-mono tabular-nums">
            {log.sentAt
              ? format(new Date(log.sentAt), "dd/MM/yyyy HH:mm", { locale: fr })
              : format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
          </div>

          {/* Error */}
          <div className="flex items-center justify-center">
            {log.errorMessage ? (
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-4 w-4 text-[#cd3d64]" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-xs font-mono">
                  {log.errorMessage}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="px-4.5 py-3 border-t border-[#e6ebf1] bg-[#fafbfc] text-[12.5px] text-[#425466]">
        <b className="text-[#0a2540]">{logs.length}</b> entrée{logs.length > 1 ? "s" : ""}
        {logs.length === 200 && " (limité à 200)"}
      </div>
    </div>
  );
}
