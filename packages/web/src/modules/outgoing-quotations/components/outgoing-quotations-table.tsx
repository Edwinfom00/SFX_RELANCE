"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { TransportBadge, Pill, SfxAvatar } from "@/components/sfx-ui";
import { TransmitDialog } from "./transmit-dialog";
import type { OutgoingQuotation } from "../types";

interface OutgoingQuotationsTableProps {
  quotations: OutgoingQuotation[];
  page:       number;
  pageSize:   number;
  total:      number;
}

function StatusPill({ status, errorMessage }: { status: string; errorMessage: string | null }) {
  if (status === "SENT") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#059669]">
        <CheckCircle className="h-2.75 w-2.75" />
        Transmis
      </span>
    );
  }
  if (status === "SENDING") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eff6ff] text-[#0057ff]">
        <Loader2 className="h-2.75 w-2.75 animate-spin" />
        En cours
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span
        title={errorMessage ?? undefined}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fff1f2] text-[#cd3d64]"
      >
        <AlertCircle className="h-2.75 w-2.75" />
        Échec
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fafbfc] text-[#697386]">
      <Clock className="h-2.75 w-2.75" />
      En attente
    </span>
  );
}

export function OutgoingQuotationsTable({ quotations, page, pageSize, total }: OutgoingQuotationsTableProps) {
  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#8898aa] bg-white border border-[#e6ebf1] rounded-xl">
        <CheckCircle className="h-8 w-8 mb-3 text-[#e6ebf1]" />
        <p className="text-sm font-medium">Aucune cotation à transmettre</p>
        <p className="text-xs mt-1">Toutes les cotations validées ont été transmises aux clients.</p>
      </div>
    );
  }

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden sfx-shadow-sm">
      {/* Header */}
      <div
        className="grid gap-3.5 items-center px-4.5 py-3 border-b border-[#e6ebf1] bg-[#fafbfc]"
        style={{ gridTemplateColumns: "110px 1.8fr 90px 100px 130px 90px 100px" }}
      >
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">N° Pièce</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Client & dossier</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Transport</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Montant</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Expiration</div>
        <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">Statut</div>
        <div />
      </div>

      {/* Rows */}
      {quotations.map((q, i) => (
        <div
          key={q.id}
          className="grid gap-3.5 items-center px-4.5 py-3.5 hover:bg-[#fafbfc] transition-colors"
          style={{
            gridTemplateColumns: "110px 1.8fr 90px 100px 130px 90px 100px",
            borderBottom: i < quotations.length - 1 ? "1px solid #e6ebf1" : "none",
          }}
        >
          {/* N° Pièce */}
          <div className="text-[12.5px] font-semibold text-[#0a2540] font-mono tracking-[-0.01em]">
            {q.noPiece}
          </div>

          {/* Client & dossier */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SfxAvatar name={q.clientCode} size={22} />
              <div className="min-w-0">
                <div className="text-[13px] font-[550] text-[#0a2540] tracking-[-0.005em] truncate">
                  {q.clientName || q.clientCode}
                </div>
                <div className="text-[11.5px] text-[#697386] truncate">
                  {q.clientCode}
                  {q.dossierRef && <span className="ml-1.5 text-[#8898aa]">· {q.dossierRef}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Transport */}
          <div>
            <TransportBadge type={q.transportType as any} />
            {q.typeActivite && q.typeActivite !== q.transportType && (
              <div className="text-[10.5px] text-[#8898aa] mt-0.5">{q.typeActivite}</div>
            )}
          </div>

          {/* Montant */}
          <div className="text-[12px] text-[#425466] font-mono tabular-nums">
            {q.montant != null
              ? `${q.montant.toLocaleString("fr-FR")} ${q.devise || ""}`
              : <span className="text-[#d8dee6]">—</span>}
          </div>

          {/* Date expiration */}
          <div className="text-[12px] text-[#425466] font-mono">
            {q.dateExpiration
              ? format(new Date(q.dateExpiration), "dd MMM yyyy", { locale: fr })
              : <span className="text-[#d8dee6]">—</span>}
          </div>

          {/* Statut */}
          <div>
            <StatusPill status={q.status} errorMessage={q.errorMessage} />
          </div>

          {/* Action */}
          <div className="flex justify-end">
            {q.status === "PENDING" || q.status === "FAILED" ? (
              <TransmitDialog quotation={q} />
            ) : q.status === "SENT" ? (
              <div className="text-[11px] text-[#8898aa] font-mono">
                {q.sentAt ? format(new Date(q.sentAt), "dd/MM HH:mm") : "—"}
              </div>
            ) : null}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="px-4.5 py-3 border-t border-[#e6ebf1] flex items-center justify-between bg-[#fafbfc] text-[12.5px] text-[#425466]">
        <div>
          {total > 0 ? (
            <>
              Affichage <b className="text-[#0a2540]">{from}–{to}</b> sur{" "}
              <b className="text-[#0a2540]">{total}</b>
            </>
          ) : (
            "Aucune cotation"
          )}
        </div>
      </div>
    </div>
  );
}
