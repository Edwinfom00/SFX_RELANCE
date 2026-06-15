"use client";

import { useState, useTransition, useRef } from "react";
import { X, FileSpreadsheet, AlertTriangle, Loader2, CheckCircle, Upload } from "lucide-react";
import { SfxButton, TransportBadge, Pill } from "@/components/sfx-ui";
import { importQuotationsAction } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface MappedQuotation {
  quotationId: string;
  clientCode: string;
  clientEmail: string;
  originalEmail: string;
  libelle: string;
  transmissionDate: string;
  transportType: "AIR" | "SEA" | "ROAD";
  paysCode: string;
  agenceCode: string;
}

function parseExcelDate(excelDate: any): Date {
  if (!excelDate) return new Date();
  if (typeof excelDate === "number") {
    // Excel epoch starts on Dec 30, 1899
    const UTC_EPOCH_MS = Date.UTC(1899, 11, 30);
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    return new Date(UTC_EPOCH_MS + excelDate * MS_PER_DAY);
  }
  const d = new Date(excelDate);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function ImportExcelDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<MappedQuotation[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleOpen() {
    setFile(null);
    setRows([]);
    setOpen(true);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

        if (data.length === 0) {
          toast.error("Le fichier Excel semble vide.");
          setFile(null);
          return;
        }

        const mapped = data
          .map((row: any) => {
            const docNo = String(row["Doc No"] || row["Tmp No"] || "").trim();
            const customerId = String(row["Customer Id"] || "").trim();
            const customerName = String(row["Customer Name"] || "").trim();
            const originalEmail = String(row["Emails"] || "").trim();

            const fileType = String(row["File Type"] || row["Activity"] || "").toLowerCase();
            let transportType: "AIR" | "SEA" | "ROAD" = "AIR";
            if (fileType.includes("sea") || fileType.includes("ocean")) {
              transportType = "SEA";
            } else if (fileType.includes("road") || fileType.includes("truck") || fileType.includes("tra")) {
              transportType = "ROAD";
            }

            let paysCode = "TGO";
            let agenceCode = "LOM";
            if (docNo.startsWith("TL1")) {
              paysCode = "TGO";
              agenceCode = "LOM";
            } else if (docNo.startsWith("FM1")) {
              paysCode = "CMR";
              agenceCode = "DLA";
            }

            const rawDate = row["Transmission Date"] || row["Transaction Date"];
            const date = parseExcelDate(rawDate);

            // Override for testing
            const testEmail = "edwinfom05@gmail.com, edwinfom10@gmail.com";

            return {
              quotationId: docNo,
              clientCode: customerId,
              clientEmail: testEmail,
              originalEmail,
              libelle: customerName,
              transmissionDate: date.toISOString(),
              transportType,
              paysCode,
              agenceCode,
            };
          })
          .filter((row) => row.quotationId !== "");

        setRows(mapped);
        toast.success(`${mapped.length} cotations lues avec succès.`);
      } catch (err) {
        console.error("Erreur lors du parsing Excel :", err);
        toast.error("Erreur lors de la lecture du fichier Excel.");
        setFile(null);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
      processFile(droppedFile);
    } else {
      toast.error("Veuillez déposer un fichier Excel valide (.xlsx ou .xls).");
    }
  };

  const handleConfirm = () => {
    if (rows.length === 0) return;
    startTransition(async () => {
      const res = await importQuotationsAction(rows);
      if (res.success) {
        toast.success(`${rows.length} cotations importées avec succès !`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Erreur d'importation.");
      }
    });
  };

  return (
    <>
      <SfxButton variant="secondary" size="sm" icon={FileSpreadsheet} onClick={handleOpen}>
        Importer Excel
      </SfxButton>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10,37,64,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setOpen(false);
          }}
        >
          <div className="bg-white rounded-xl w-[90vw] max-w-4xl sfx-shadow-lg overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
              <div>
                <div className="text-sm font-semibold text-[#0a2540]">Importer des cotations depuis Excel</div>
                <div className="text-xs text-[#697386] mt-0.5">
                  Sélectionnez un fichier pour importer de vraies cotations dans l'application
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
            <div className="p-5 flex-1 overflow-auto flex flex-col gap-4">
              {rows.length === 0 ? (
                /* Dropzone */
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#d8dee6] hover:border-[#0057ff] rounded-lg p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors bg-[#fafbfc] hover:bg-[#f6f9fc] group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-[#f1f3f5] group-hover:bg-[#e7efff] flex items-center justify-center text-[#697386] group-hover:text-[#0057ff] transition-colors">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-[13.5px] font-semibold text-[#0a2540]">
                    Sélectionner ou glisser-déposer le fichier Excel
                  </div>
                  <div className="text-[11.5px] text-[#8898aa]">
                    Fichiers acceptés : .xlsx, .xls (ex: "OMA TL - Quotations awaiting Customer Feedback.xlsx")
                  </div>
                </div>
              ) : (
                /* Preview State */
                <div className="flex flex-col gap-4">
                  {/* Alert Banner */}
                  <div className="flex items-start gap-3 p-3.5 bg-[#fff3d6] border border-[#c28b00]/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-[#c28b00] shrink-0 mt-0.5" />
                    <div className="text-[12.5px] text-[#425466] leading-relaxed">
                      <b className="text-[#0a2540]">Attention :</b> L'importation de ce fichier va{" "}
                      <span className="text-[#cd3d64] font-semibold">vider complètement</span> la base de données locale
                      de toutes ses cotations et de l'historique des relances pour réinitialiser l'environnement avec ces nouvelles données.
                      <div className="mt-1 font-medium text-[#0a2540]">
                        Les emails de contact seront tous remplacés par vos adresses de test :{" "}
                        <span className="font-mono text-[#0057ff]">edwinfom05@gmail.com</span> et{" "}
                        <span className="font-mono text-[#0057ff]">edwinfom10@gmail.com</span>.
                      </div>
                    </div>
                  </div>

                  {/* Summary info */}
                  <div className="flex justify-between items-center bg-[#f6f8fa] border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-[12.5px]">
                    <div className="text-[#697386]">
                      Fichier analysé : <b className="text-[#0a2540]">{file?.name}</b>
                    </div>
                    <Pill tone="blue" size="sm" className="font-bold">
                      {rows.length} cotations détectées
                    </Pill>
                  </div>

                  {/* Preview Table */}
                  <div>
                    <div className="text-[11.5px] font-bold text-[#8898aa] uppercase tracking-wider mb-2">
                      Aperçu des 5 premières lignes à importer :
                    </div>
                    <div className="border border-[#e6ebf1] rounded-lg overflow-hidden bg-white">
                      <table className="w-full text-left border-collapse text-[12.5px]">
                        <thead>
                          <tr className="bg-[#fafbfc] border-b border-[#e6ebf1] text-[#697386] font-semibold">
                            <th className="px-4 py-2.5">Réf Cotation</th>
                            <th className="px-4 py-2.5">Client</th>
                            <th className="px-4 py-2.5">Emails</th>
                            <th className="px-4 py-2.5">Transport</th>
                            <th className="px-4 py-2.5">Pays / Agence</th>
                            <th className="px-4 py-2.5">Date Trans.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6ebf1]">
                          {rows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="hover:bg-[#fafbfc] transition-colors">
                              <td className="px-4 py-2.5 font-mono text-[#0057ff] font-semibold">
                                {row.quotationId}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-medium text-[#0a2540]">{row.libelle}</div>
                                <div className="text-[11px] text-[#8898aa]">{row.clientCode}</div>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="text-[11px] text-[#8898aa] line-through max-w-[150px] truncate" title={row.originalEmail}>
                                  {row.originalEmail || "—"}
                                </div>
                                <div className="text-[11.5px] text-[#0e9f6e] font-medium font-mono mt-0.5">
                                  To: edwinfom05@gmail.com
                                  <br />
                                  Cc: edwinfom10@gmail.com
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <TransportBadge type={row.transportType} />
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="bg-[#f1f3f5] border border-[#e6ebf1] px-2 py-0.5 rounded text-[11px] font-mono text-[#425466]">
                                  {row.paysCode} / {row.agenceCode}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-[#425466]">
                                {new Date(row.transmissionDate).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#e6ebf1] flex justify-between items-center bg-[#fafbfc]">
              <div>
                {rows.length > 0 && !isPending && (
                  <button
                    onClick={() => {
                      setRows([]);
                      setFile(null);
                    }}
                    className="text-[12.5px] text-[#0057ff] hover:underline font-semibold cursor-pointer"
                  >
                    Changer de fichier
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {!isPending && (
                  <SfxButton variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Annuler
                  </SfxButton>
                )}
                {rows.length > 0 && (
                  <SfxButton
                    variant="primary"
                    size="sm"
                    icon={isPending ? Loader2 : CheckCircle}
                    disabled={isPending}
                    onClick={handleConfirm}
                    className={isPending ? "cursor-not-allowed" : ""}
                  >
                    {isPending ? "Importation en cours..." : `Confirmer l'importation (${rows.length} lignes)`}
                  </SfxButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
