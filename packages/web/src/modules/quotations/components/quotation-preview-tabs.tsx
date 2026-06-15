"use client";

import { useState, useEffect } from "react";
import { EmailPreview } from "./email-preview";
import { FileText, Mail, Loader2, AlertTriangle } from "lucide-react";

interface QuotationPreviewTabsProps {
  dbId: number;
  quotationId: string;
  libelle: string;
  clientEmail: string;
  clientLanguage: string;
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

export function QuotationPreviewTabs({
  dbId,
  quotationId,
  libelle,
  clientEmail,
  clientLanguage,
  nextReminderNumber,
  nextReminderAt,
  template,
  smtpFrom,
}: QuotationPreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<"email" | "pdf">("email");
  const [pdfState, setPdfState] = useState<{
    loading: boolean;
    exists: boolean | null;
    fileName: string | null;
    error: string | null;
    errorDetails: string | null;
  }>({
    loading: false,
    exists: null,
    fileName: null,
    error: null,
    errorDetails: null,
  });

  // Check PDF status when PDF tab is selected
  useEffect(() => {
    if (activeTab === "pdf" && pdfState.exists === null) {
      setPdfState((prev) => ({ ...prev, loading: true }));
      fetch(`/api/quotations/${dbId}/pdf?check=true`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Erreur HTTP: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.exists) {
            setPdfState({
              loading: false,
              exists: true,
              fileName: data.fileName,
              error: null,
              errorDetails: null,
            });
          } else {
            setPdfState({
              loading: false,
              exists: false,
              fileName: null,
              error: data.error,
              errorDetails: data.errorDetails,
            });
          }
        })
        .catch((err) => {
          setPdfState({
            loading: false,
            exists: false,
            fileName: null,
            error: "FETCH_ERROR",
            errorDetails: "Une erreur est survenue lors de la vérification de l'accessibilité du fichier PDF.",
          });
        });
    }
  }, [activeTab, dbId, pdfState.exists]);

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Tabs Selector */}
      <div className="flex items-center justify-between border-b border-[#e6ebf1] bg-[#fafbfc] px-5 py-2 gap-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className="flex items-center gap-2 px-1 py-2 text-[13px] font-[550] transition-colors border-b-2"
            style={{
              borderColor: activeTab === "email" ? "#0057ff" : "transparent",
              color: activeTab === "email" ? "#0057ff" : "#697386",
            }}
          >
            <Mail className="h-4 w-4" />
            Aperçu de l'email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pdf")}
            className="flex items-center gap-2 px-1 py-2 text-[13px] font-[550] transition-colors border-b-2"
            style={{
              borderColor: activeTab === "pdf" ? "#0057ff" : "transparent",
              color: activeTab === "pdf" ? "#0057ff" : "#697386",
            }}
          >
            <FileText className="h-4 w-4" />
            Pièce jointe PDF
          </button>
        </div>

        <div className="text-[12px] text-[#697386] font-medium hidden sm:block">
          Relance #{nextReminderNumber}
          {template && <span className="ml-1.5 text-[#8898aa]">· {template.name}</span>}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "email" ? (
          <EmailPreview
            quotationId={quotationId}
            libelle={libelle}
            clientEmail={clientEmail}
            clientLanguage={clientLanguage}
            nextReminderNumber={nextReminderNumber}
            nextReminderAt={nextReminderAt}
            template={template}
            smtpFrom={smtpFrom}
          />
        ) : (
          <div className="h-full flex flex-col min-h-[400px]">
            {pdfState.loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-12">
                <Loader2 className="h-6 w-6 text-[#0057ff] animate-spin" />
                <span className="text-[13px] text-[#697386]">Recherche du document PDF...</span>
              </div>
            )}

            {!pdfState.loading && pdfState.exists === false && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto gap-4">
                <div className="w-12 h-12 rounded-full bg-[#ffe1e6] flex items-center justify-center text-[#cd3d64]">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-[#0a2540] mb-1">
                    Document PDF non disponible
                  </h4>
                  <p className="text-[12.5px] text-[#697386] leading-relaxed">
                    {pdfState.errorDetails}
                  </p>
                </div>
                <div className="text-[11.5px] text-[#8898aa] bg-[#fafbfc] border border-[#e6ebf1] rounded-md px-3 py-2 font-mono">
                  Quotation ID: {quotationId}
                </div>
              </div>
            )}

            {!pdfState.loading && pdfState.exists === true && (
              <div className="flex-1 flex flex-col h-full bg-[#fafbfc]">
                {/* PDF Toolbar */}
                <div className="bg-white border-b border-[#e6ebf1] px-5 py-2.5 flex items-center justify-between text-[12px] text-[#697386]">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-[#0a2540] font-semibold">{pdfState.fileName}</span>
                  </div>
                  <a
                    href={`/api/quotations/${dbId}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0057ff] hover:underline font-semibold flex items-center gap-1"
                  >
                    Ouvrir dans un nouvel onglet ↗
                  </a>
                </div>
                {/* PDF Viewer Frame */}
                <div className="flex-1 w-full h-[500px]">
                  <iframe
                    src={`/api/quotations/${dbId}/pdf`}
                    className="w-full h-full border-0"
                    title={`PDF Preview ${quotationId}`}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
