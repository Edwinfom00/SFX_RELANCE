"use client";

import { useState, useTransition } from "react";
import { X, Mail, AlertCircle, Loader2, Check } from "lucide-react";
import { SfxButton } from "@/components/sfx-ui";
import { updateClientAction } from "../actions";
import { toast } from "sonner";
import type { Client } from "../types";

interface EditClientModalProps {
  client: Client;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClientModal({ client, onClose, onSuccess }: EditClientModalProps) {
  const [emails, setEmails] = useState(client.emails || "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateClientAction(client.id, emails);
      if (res.success) {
        toast.success(`E-mails du client ${client.name || client.code} mis à jour !`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Erreur lors de la modification.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10,37,64,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl w-[90vw] max-w-md sfx-shadow-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#0057ff]" />
            <div>
              <div className="text-sm font-semibold text-[#0a2540]">Modifier le contact client</div>
              <div className="text-xs text-[#697386] mt-0.5">Ajustement des adresses e-mails</div>
            </div>
          </div>
          {!isPending && (
            <button
              type="button"
              onClick={onClose}
              className="text-[#8898aa] hover:text-[#425466] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Info Box */}
          <div className="flex items-start gap-2.5 p-3 bg-[#f2f6ff] border border-[#0057ff]/10 rounded-lg text-[12px] text-[#425466]">
            <AlertCircle className="h-4.5 w-4.5 text-[#0057ff] shrink-0 mt-0.5" />
            <div>
              Les modifications d'e-mails seront prises en compte immédiatement pour toutes les relances <b>actives</b> en cours. Elles n'affectent pas la base BrainOpx.
            </div>
          </div>

          {/* Client Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-bold text-[#8898aa] uppercase tracking-wider">
              Code Client (BrainOpx)
            </label>
            <input
              type="text"
              readOnly
              value={client.code}
              className="w-full h-8.5 px-3 rounded-[7px] border border-[#d8dee6] bg-[#fafbfc] text-[#425466] font-mono text-[12.5px] cursor-not-allowed outline-none"
            />
          </div>

          {/* Client Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-bold text-[#8898aa] uppercase tracking-wider">
              Raison Sociale / Nom
            </label>
            <input
              type="text"
              readOnly
              value={client.name || "Sans nom"}
              className="w-full h-8.5 px-3 rounded-[7px] border border-[#d8dee6] bg-[#fafbfc] text-[#425466] text-[13px] cursor-not-allowed outline-none"
            />
          </div>

          {/* Client Emails */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-bold text-[#8898aa] uppercase tracking-wider">
              Adresses E-mails de Relance
            </label>
            <textarea
              required
              rows={3}
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="ex: contact@client.com, compta@client.com"
              className="w-full p-3 rounded-[7px] border border-[#d8dee6] focus:border-[#0057ff] text-[#0a2540] text-[13px] font-mono outline-none transition-colors"
            />
            <p className="text-[10.5px] text-[#8898aa] leading-normal">
              Séparez les différentes adresses e-mails par des virgules ou des points virgules.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e6ebf1] flex justify-end gap-2 bg-[#fafbfc]">
          {!isPending && (
            <SfxButton variant="ghost" size="sm" onClick={onClose}>
              Annuler
            </SfxButton>
          )}
          <SfxButton
            type="submit"
            variant="primary"
            size="sm"
            icon={isPending ? Loader2 : Check}
            disabled={isPending}
            className={isPending ? "cursor-not-allowed" : ""}
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </SfxButton>
        </div>
      </form>
    </div>
  );
}
