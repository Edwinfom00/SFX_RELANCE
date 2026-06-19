"use client";

import { useState, useTransition } from "react";
import { Send, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { transmitOutgoingQuotationAction } from "../actions";
import type { OutgoingQuotation } from "../types";

interface TransmitDialogProps {
  quotation: OutgoingQuotation;
}

export function TransmitDialog({ quotation }: TransmitDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string; errorType?: string } | null>(null);

  function handleOpen() {
    setResult(null);
    setOpen(true);
  }

  function handleTransmit() {
    startTransition(async () => {
      const res = await transmitOutgoingQuotationAction(quotation.id);
      if (res.success) {
        toast.success(`Cotation ${quotation.noPiece} transmise avec succès.`);
        setOpen(false);
      } else {
        setResult(res);
        if ((res as any).errorType !== "NO_PDF" && (res as any).errorType !== "NO_TEMPLATE") {
          toast.error("Échec de la transmission.");
        }
      }
    });
  }

  const recipientDisplay = quotation.clientEmail || "—";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 h-7.5 px-3 rounded-lg text-[12px] font-semibold text-white transition-all"
        style={{ background: "linear-gradient(135deg,#0057ff,#0094ff)", boxShadow: "0 1px 3px rgba(0,87,255,0.3)" }}
      >
        <Send className="h-3.25 w-3.25" />
        Transmettre
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10,37,64,0.35)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="bg-white rounded-2xl w-[480px] mx-4 overflow-hidden"
            style={{ boxShadow: "0 24px 64px rgba(10,37,64,0.18)" }}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-[#e6ebf1]">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg,#0057ff,#0094ff)" }}
                >
                  <Send className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-[#0a2540] tracking-[-0.01em]">
                    Transmettre la cotation
                  </h2>
                  <div className="text-[12px] text-[#697386] font-mono">{quotation.noPiece}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-3">
              {/* Résumé */}
              <div className="bg-[#fafbfc] border border-[#e6ebf1] rounded-xl p-3.5 text-[12.5px] space-y-1.5">
                <Row label="Client" value={`${quotation.clientName || quotation.clientCode} (${quotation.clientCode})`} />
                <Row label="Destinataire" value={recipientDisplay} highlight />
                <Row label="Transport" value={quotation.typeActivite || quotation.transportType} />
                {quotation.libelle && <Row label="Libellé" value={quotation.libelle} />}
                {quotation.dossierRef && <Row label="Dossier" value={quotation.dossierRef} />}
                {quotation.montant != null && (
                  <Row label="Montant" value={`${quotation.montant.toLocaleString("fr-FR")} ${quotation.devise}`} />
                )}
              </div>

              {/* Message d'erreur */}
              {result && !result.success && (
                <div
                  className="flex items-start gap-2.5 p-3.5 rounded-xl text-[12.5px]"
                  style={{
                    background: result.errorType === "NO_PDF" || result.errorType === "NO_TEMPLATE"
                      ? "rgba(205,61,100,0.06)"
                      : "rgba(205,61,100,0.06)",
                    border: "1px solid rgba(205,61,100,0.2)",
                  }}
                >
                  <AlertTriangle className="h-3.75 w-3.75 shrink-0 mt-0.25 text-[#cd3d64]" />
                  <span className="text-[#cd3d64] leading-snug">{result.error}</span>
                </div>
              )}

              {/* Avertissement PDF absent */}
              {!result && (
                <p className="text-[12px] text-[#697386]">
                  Un PDF valide doit être présent pour la cotation. L'email sera envoyé avec le PDF en pièce jointe.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="h-8.5 px-4 rounded-lg text-[13px] font-medium text-[#425466] hover:bg-[#f6f8fa] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleTransmit}
                disabled={isPending}
                className="flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#0057ff,#0094ff)" }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Confirmer l'envoi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[#8898aa] shrink-0">{label}</span>
      <span
        className="text-right truncate"
        style={{ color: highlight ? "#0057ff" : "#0a2540", fontWeight: highlight ? 550 : 400 }}
      >
        {value}
      </span>
    </div>
  );
}
