"use client";

import { useState, useTransition } from "react";
import { Send, X, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { SfxButton, TransportBadge, Pill } from "@/components/sfx-ui";
import { sendReminderNowAction } from "../actions/send-now";

interface SendNowDialogProps {
  quotationId: number;
  quotationRef: string;
  clientEmail: string;
  transportType: string;
  nextReminderNumber: number;
  templateName?: string;
}

export function SendNowDialog({
  quotationId, quotationRef, clientEmail,
  transportType, nextReminderNumber, templateName,
}: SendNowDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setState("idle");
    setError("");
    setOpen(true);
  }

  function handleConfirm() {
    setState("loading");
    startTransition(async () => {
      const result = await sendReminderNowAction(quotationId);
      if (result.success) {
        setState("success");
      } else {
        setState("error");
        setError(result.error ?? "Erreur inconnue");
      }
    });
  }

  const reminderLabel: Record<number, string> = {
    1: "1ʳᵉ relance", 2: "2ᵉ relance", 3: "3ᵉ et dernière relance",
  };

  return (
    <>
      <SfxButton variant="primary" size="sm" icon={Send} onClick={handleOpen}>
        Envoyer maintenant
      </SfxButton>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10,37,64,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && state !== "loading") setOpen(false); }}
        >
          <div className="bg-white rounded-xl w-115 sfx-shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
              <div>
                <div className="text-sm font-semibold text-[#0a2540]">Envoyer la relance maintenant</div>
                <div className="text-xs text-[#697386] mt-0.5">
                  Cette action envoie immédiatement l'email sans attendre le worker
                </div>
              </div>
              {state !== "loading" && (
                <button onClick={() => setOpen(false)} className="text-[#8898aa] hover:text-[#425466] transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              {state === "idle" && (
                <div className="flex flex-col gap-4">
                  {/* Récap cotation */}
                  <div className="bg-[#fafbfc] border border-[#e6ebf1] rounded-lg px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono font-semibold text-[#0057ff]">{quotationRef}</span>
                      <TransportBadge type={transportType} />
                      <Pill tone="blue">{reminderLabel[nextReminderNumber] ?? `Relance #${nextReminderNumber}`}</Pill>
                    </div>
                    <div className="grid gap-1" style={{ gridTemplateColumns: "auto 1fr" }}>
                      <span className="text-[11.5px] text-[#8898aa] font-semibold">Destinataire</span>
                      <span className="text-[12px] text-[#0a2540] font-mono">{clientEmail}</span>
                      {templateName && (
                        <>
                          <span className="text-[11.5px] text-[#8898aa] font-semibold">Template</span>
                          <span className="text-[12px] text-[#425466]">{templateName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[#fff3d6] border border-[#c28b00]/20 rounded-lg">
                    <span className="text-[#c28b00] text-[13px] shrink-0 mt-px">⚠️</span>
                    <div className="text-[12px] text-[#425466] leading-normal">
                      L'email sera envoyé <b className="text-[#0a2540]">immédiatement</b>.
                      Le compteur de relances sera mis à jour et la prochaine relance replanifiée.
                    </div>
                  </div>
                </div>
              )}

              {state === "loading" && (
                <div className="flex items-center gap-3 py-4">
                  <Loader className="h-5 w-5 text-[#0057ff] animate-spin" />
                  <span className="text-[13px] text-[#425466]">Envoi en cours…</span>
                </div>
              )}

              {state === "success" && (
                <div className="flex items-start gap-3 py-2">
                  <CheckCircle className="h-5 w-5 text-[#0e9f6e] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-semibold text-[#0a2540]">
                      Relance #{nextReminderNumber} envoyée avec succès
                    </div>
                    <div className="text-[12px] text-[#697386] mt-0.5">
                      Email envoyé à <b>{clientEmail}</b>. La page va se rafraîchir.
                    </div>
                  </div>
                </div>
              )}

              {state === "error" && (
                <div className="flex items-start gap-3 py-2">
                  <AlertCircle className="h-5 w-5 text-[#cd3d64] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-semibold text-[#0a2540]">Échec de l'envoi</div>
                    <div className="text-[12px] text-[#cd3d64] mt-1.5 font-mono bg-[#ffe1e6] px-2 py-1.5 rounded">
                      {error}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#e6ebf1] flex justify-end gap-2">
              {state !== "loading" && state !== "success" && (
                <SfxButton variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Annuler
                </SfxButton>
              )}
              {state === "idle" && (
                <SfxButton variant="primary" size="sm" icon={Send} onClick={handleConfirm} disabled={isPending}>
                  Confirmer l'envoi
                </SfxButton>
              )}
              {state === "error" && (
                <SfxButton variant="secondary" size="sm" onClick={() => setState("idle")}>
                  Réessayer
                </SfxButton>
              )}
              {state === "success" && (
                <SfxButton variant="primary" size="sm" onClick={() => { setOpen(false); window.location.reload(); }}>
                  Fermer
                </SfxButton>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
