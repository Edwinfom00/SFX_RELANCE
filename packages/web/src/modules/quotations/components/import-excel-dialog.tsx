"use client";

import { useState, useTransition } from "react";
import { X, FileSpreadsheet, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { SfxButton } from "@/components/sfx-ui";
import { syncFromExcelFileAction } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ImportExcelDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleOpen() {
    setOpen(true);
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await syncFromExcelFileAction();
      if (res.success) {
        toast.success("Synchronisation depuis Excel lancée avec succès !");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Erreur de synchronisation.");
      }
    });
  };

  return (
    <>
      <SfxButton variant="secondary" size="sm" icon={FileSpreadsheet} onClick={handleOpen}>
        Synchroniser Excel
      </SfxButton>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10,37,64,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setOpen(false);
          }}
        >
          <div className="bg-white rounded-xl w-[90vw] max-w-lg sfx-shadow-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#0057ff]" />
                <div>
                  <div className="text-sm font-semibold text-[#0a2540]">Synchronisation depuis le fichier Excel</div>
                  <div className="text-xs text-[#697386] mt-0.5">
                    Mise à jour des cotations à partir du serveur
                  </div>
                </div>
              </div>
              {!isPending && (
                <button
                  onClick={() => setOpen(false)}
                  className="text-[#8898aa] hover:text-[#425466] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4">
              <p className="text-[13px] text-[#425466] leading-relaxed">
                Le système va lire le fichier Excel <b>OMA TL - Quotations awaiting Customer Feedback.xlsx</b> stocké sur le serveur pour mettre à jour la base de données.
              </p>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-3.5 bg-[#f2f6ff] border border-[#0057ff]/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[#0057ff] shrink-0 mt-0.5" />
                <div className="text-[12.5px] text-[#425466] leading-relaxed">
                  <b className="text-[#0a2540]">Mise à jour incrémentale :</b> Contrairement à l'ancienne version, cette action <b>n'efface pas</b> l'historique de vos relances.
                  <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[#697386]">
                    <li>Les nouvelles cotations du fichier seront créées en <b>ACTIVE</b>.</li>
                    <li>Les cotations actives locales absentes du fichier passeront en <b>COMPLETED</b>.</li>
                    <li>Les cotations existantes et leur historique d'emails restent intacts.</li>
                  </ul>
                </div>
              </div>

              {/* Warning Box */}
              <div className="flex items-start gap-3 p-3.5 bg-[#fff3d6] border border-[#c28b00]/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-[#c28b00] shrink-0 mt-0.5" />
                <div className="text-[12.5px] text-[#425466] leading-relaxed">
                  <b className="text-[#0a2540]">Avant de lancer :</b> Assurez-vous d'avoir remplacé le fichier Excel sur le serveur avec les données réelles du client.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#e6ebf1] flex justify-end gap-2 bg-[#fafbfc]">
              {!isPending && (
                <SfxButton variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Annuler
                </SfxButton>
              )}
              <SfxButton
                variant="primary"
                size="sm"
                icon={isPending ? Loader2 : CheckCircle}
                disabled={isPending}
                onClick={handleConfirm}
                className={isPending ? "cursor-not-allowed" : ""}
              >
                {isPending ? "Synchronisation..." : "Lancer la synchronisation"}
              </SfxButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
