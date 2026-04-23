"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
import { TransportBadge, QuotationStatusPill, SfxAvatar, ReminderSteps, Pill } from "@/components/sfx-ui";
import { CancelDialog } from "./cancel-dialog";
import type { Quotation } from "../types";

interface QuotationsTableProps {
  quotations: Quotation[];
}

export function QuotationsTable({ quotations }: QuotationsTableProps) {
  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#8898aa] bg-white border border-[#e6ebf1] rounded-xl">
        <p className="text-sm">Aucune cotation trouvée</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden sfx-shadow-sm">
      {/* Header */}
      <div
        className="grid gap-3.5 items-center px-[18px] py-3 border-b border-[#e6ebf1] bg-[#fafbfc]"
        style={{ gridTemplateColumns: "26px 110px 1.5fr 90px 140px 80px 140px 100px 32px" }}
      >
        <div className="w-3.5 h-3.5 rounded border-[1.5px] border-[#d8dee6]" />
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Cotation</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Client & contact</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Transport</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Transmise</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em] text-center">Relance</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Prochaine</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em] text-right">Statut</div>
        <div />
      </div>

      {/* Rows */}
      {quotations.map((q, i) => {
        const isError = q.status === "CANCELLED";
        return (
          <div
            key={q.id}
            className="grid gap-3.5 items-center px-[18px] py-3.5 hover:bg-[#fafbfc] transition-colors"
            style={{
              gridTemplateColumns: "26px 110px 1.5fr 90px 140px 80px 140px 100px 32px",
              borderBottom: i < quotations.length - 1 ? "1px solid #e6ebf1" : "none",
              background: isError ? "rgba(205,61,100,0.03)" : "#fff",
            }}
          >
            <div className="w-3.5 h-3.5 rounded border-[1.5px] border-[#d8dee6]" />

            {/* ID */}
            <Link
              href={`/quotations/${q.id}`}
              className="text-[12.5px] font-semibold text-[#0057ff] font-mono tracking-[-0.01em] hover:underline"
            >
              {q.quotationId}
            </Link>

            {/* Client */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SfxAvatar name={q.clientCode} size={22} />
                <div className="min-w-0">
                  <div className="text-[13px] font-[550] text-[#0a2540] tracking-[-0.005em]">{q.clientCode}</div>
                  <div className="text-[11.5px] text-[#697386] truncate">{q.clientEmail}</div>
                </div>
              </div>
            </div>

            {/* Transport */}
            <TransportBadge type={q.transportType} />

            {/* Date */}
            <div className="text-[12px] text-[#425466] font-mono tabular-nums">
              {format(new Date(q.transmissionDate), "dd MMM · HH:mm", { locale: fr })}
            </div>

            {/* Steps */}
            <div className="flex justify-center">
              <ReminderSteps current={q.currentReminder} />
            </div>

            {/* Next */}
            <div>
              {q.status === "ACTIVE" && q.nextReminderAt ? (
                <div>
                  <QuotationStatusPill status={q.status} />
                  <div className="text-[11px] text-[#8898aa] font-mono mt-0.5">
                    {formatDistanceToNow(new Date(q.nextReminderAt), { addSuffix: true, locale: fr })}
                  </div>
                </div>
              ) : (
                <QuotationStatusPill status={q.status} />
              )}
            </div>

            {/* Status */}
            <div className="text-right">
              {q.currentReminder >= 3 ? (
                <Pill tone="purple">Finale</Pill>
              ) : q.status === "ACTIVE" ? (
                <Pill tone="blue">Programmée</Pill>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center">
              {q.status === "ACTIVE" ? (
                <CancelDialog quotationId={q.id} quotationRef={q.quotationId} />
              ) : (
                <div className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#8898aa] cursor-pointer hover:bg-[#f6f8fa]">
                  <MoreHorizontal className="h-[15px] w-[15px]" />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Footer pagination */}
      <div className="px-[18px] py-3 border-t border-[#e6ebf1] flex items-center justify-between bg-[#fafbfc] text-[12.5px] text-[#425466]">
        <div>
          Affichage <b className="text-[#0a2540]">1-{quotations.length}</b> sur{" "}
          <b className="text-[#0a2540]">{quotations.length}</b>
        </div>
      </div>
    </div>
  );
}
