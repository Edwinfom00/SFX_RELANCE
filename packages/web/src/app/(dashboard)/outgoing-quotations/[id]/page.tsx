import { notFound } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, Plane, Ship, Truck } from "lucide-react";
import { TransportBadge, Pill, SfxCard } from "@/components/sfx-ui";
import { TransmitDialog } from "@/modules/outgoing-quotations/components/transmit-dialog";
import { OutgoingPreviewTabs } from "@/modules/outgoing-quotations/components/outgoing-preview-tabs";
import { getOutgoingQuotationById } from "@/modules/outgoing-quotations/models";
import { parseRecipientEmails } from "@/lib/email";
import prisma from "@/lib/prisma";

const transportIcon: Record<string, React.ElementType> = {
  AIR: Plane, SEA: Ship, ROAD: Truck,
};

const transportLabel: Record<string, string> = {
  AIR: "Aérien", SEA: "Maritime", ROAD: "Route",
};

const statusConfig: Record<string, { tone: "green" | "neutral" | "red" | "amber"; label: string }> = {
  SENT:    { tone: "green",   label: "Transmis" },
  PENDING: { tone: "neutral", label: "En attente" },
  FAILED:  { tone: "red",     label: "Échec" },
  SENDING: { tone: "amber",   label: "En cours…" },
};

export default async function OutgoingQuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quotation = await getOutgoingQuotationById(Number(id));
  if (!quotation) notFound();

  const TransIcon = transportIcon[quotation.transportType] ?? Truck;
  const isPending = quotation.status === "PENDING";
  const isFailed  = quotation.status === "FAILED";
  const isSent    = quotation.status === "SENT";
  const isSending = quotation.status === "SENDING";
  const st        = statusConfig[quotation.status] ?? { tone: "neutral" as const, label: quotation.status };

  const template = await prisma.emailTemplate.findFirst({
    where: { transportType: quotation.transportType, category: "TRANSMISSION", isActive: true },
    select: { id: true, name: true, subject: true, subjectEn: true, body: true, bodyEn: true },
  });

  const smtpFrom = process.env.SMTP_FROM ?? "";

  // Timeline (oldest → newest, reversed at end)
  const steps: Array<{
    date:         string;
    title:        string;
    body:         string;
    status:       "done" | "error" | "pending" | "sending";
    errorMessage?: string | null;
  }> = [];

  steps.push({
    date:   format(new Date(quotation.createdAt), "dd MMM · HH:mm", { locale: fr }),
    title:  "Cotation importée depuis BrainOPX",
    body:   `Synchronisation automatique · ${quotation.noPiece}`,
    status: "done",
  });

  if (isFailed) {
    steps.push({
      date:         format(new Date(quotation.updatedAt), "dd MMM · HH:mm", { locale: fr }),
      title:        "Échec de transmission",
      body:         quotation.errorMessage ?? "Une erreur est survenue lors de la transmission.",
      status:       "error",
      errorMessage: quotation.errorMessage,
    });
  }

  if (isSent && quotation.sentAt) {
    steps.push({
      date:   format(new Date(quotation.sentAt), "dd MMM · HH:mm", { locale: fr }),
      title:  "Cotation transmise au client",
      body:   "Email envoyé avec PDF en pièce jointe via BrainOPX",
      status: "done",
    });
  }

  if (isPending) {
    steps.push({
      date:   "—",
      title:  "En attente de transmission",
      body:   "Cliquez sur « Transmettre » pour envoyer la cotation au client.",
      status: "pending",
    });
  }

  if (isSending) {
    steps.push({
      date:   "—",
      title:  "Transmission en cours…",
      body:   "L'email est en cours d'envoi, veuillez patienter.",
      status: "sending",
    });
  }

  const dotColorMap: Record<string, string> = {
    done:    "#0057ff",
    error:   "#cd3d64",
    pending: "#c28b00",
    sending: "#f59e0b",
  };

  const bgMap: Record<string, string> = {
    done:    "#fafbfc",
    error:   "rgba(205,61,100,0.05)",
    pending: "rgba(194,139,0,0.08)",
    sending: "rgba(245,158,11,0.08)",
  };

  const borderMap: Record<string, string> = {
    done:    "#e6ebf1",
    error:   "rgba(205,61,100,0.15)",
    pending: "#fff3d6",
    sending: "#fde68a",
  };

  const { to: emailTo, cc: emailCc } = parseRecipientEmails(quotation.clientEmail);

  return (
    <div className="px-7 py-5 pb-10">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[13px] text-[#697386]">
          <Link href="/outgoing-quotations" className="hover:text-[#0a2540] transition-colors">
            Envoi cotations
          </Link>
          <ChevronRight className="h-[13px] w-[13px] text-[#8898aa]" />
          <span className="text-[#0a2540] font-[550]">{quotation.noPiece}</span>
        </div>
        {(isPending || isFailed) && (
          <TransmitDialog quotation={quotation as any} />
        )}
      </div>

      {/* Header card */}
      <SfxCard padding={false} className="p-[22px] mb-3.5">
        <div className="flex items-start gap-[18px]">
          <div
            className="w-[54px] h-[54px] rounded-[11px] flex items-center justify-center shrink-0"
            style={{ background: "#e7efff", color: "#0057ff" }}
          >
            <TransIcon className="h-6 w-6" strokeWidth={2} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[13px] font-mono text-[#0057ff] font-semibold">{quotation.noPiece}</span>
              <TransportBadge type={quotation.transportType as any} />
              <Pill tone={st.tone}>{st.label}</Pill>
            </div>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] m-0 text-[#0a2540]">
              {quotation.libelle || quotation.clientCode}
            </h2>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-[22px] gap-y-3 mt-3.5 text-[12.5px] text-[#425466]">
              {/* Contact */}
              <div>
                <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Contact</div>
                <div className="text-[#0a2540] font-[550]">{quotation.clientName || quotation.clientCode}</div>
                <div className="font-mono text-[12px]">
                  <div>{emailTo || "—"}</div>
                  {emailCc && (
                    <div className="text-[11.5px] text-[#697386] mt-0.5 font-sans">
                      <span className="font-semibold text-[#8898aa]">Cc :</span> {emailCc}
                    </div>
                  )}
                </div>
              </div>

              {/* Transport */}
              <div>
                <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Transport</div>
                <div className="text-[#0a2540] font-[550]">
                  {transportLabel[quotation.transportType] ?? quotation.typeActivite}
                </div>
                {quotation.typeActivite && (
                  <div className="text-[11px] text-[#8898aa]">{quotation.typeActivite}</div>
                )}
              </div>

              {/* Montant */}
              {quotation.montant != null && (
                <div>
                  <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Montant</div>
                  <div className="text-[#0a2540] font-[550] font-mono tabular-nums">
                    {quotation.montant.toLocaleString("fr-FR")} {quotation.devise}
                  </div>
                </div>
              )}

              {/* Expiration */}
              {quotation.dateExpiration && (
                <div>
                  <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Expiration</div>
                  <div className="text-[#0a2540] font-[550]">
                    {format(new Date(quotation.dateExpiration), "dd MMM yyyy", { locale: fr })}
                  </div>
                  <div className="text-[#697386] text-[11px]">
                    {formatDistanceToNow(new Date(quotation.dateExpiration), { addSuffix: true, locale: fr })}
                  </div>
                </div>
              )}

              {/* Transmise */}
              {isSent && quotation.sentAt && (
                <div>
                  <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Transmise</div>
                  <div className="text-[#0a2540] font-[550]">
                    {format(new Date(quotation.sentAt), "dd MMM yyyy · HH:mm", { locale: fr })}
                  </div>
                  <div className="text-[#697386] text-[11px]">
                    {formatDistanceToNow(new Date(quotation.sentAt), { addSuffix: true, locale: fr })}
                  </div>
                </div>
              )}

              {/* Dossier */}
              {quotation.dossierRef && (
                <div>
                  <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Dossier</div>
                  <div className="text-[#0a2540] font-[550]">{quotation.dossierRef}</div>
                  {quotation.agence && (
                    <div className="text-[11px] text-[#8898aa]">{quotation.agence}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </SfxCard>

      {/* Two-column: timeline + preview */}
      <div className="grid grid-cols-[1.1fr_1fr] gap-3.5">
        {/* Timeline */}
        <SfxCard padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
            <div>
              <div className="text-sm font-semibold text-[#0a2540] tracking-tight">Historique</div>
              <div className="text-xs text-[#697386] mt-0.5">Suivi complet de la cotation</div>
            </div>
            <Pill tone="neutral">{steps.length} évènements</Pill>
          </div>

          <div className="px-5 py-2 pb-5">
            {steps.map((ev, i) => {
              const isLast   = i === steps.length - 1;
              const dotColor = dotColorMap[ev.status] ?? "#e6ebf1";
              const isHollow = ev.status === "pending" || ev.status === "sending";

              return (
                <div key={i} className="flex gap-3.5 relative" style={{ paddingBottom: isLast ? 0 : 18 }}>
                  {/* Dot + line */}
                  <div className="w-[22px] shrink-0 flex flex-col items-center pt-4">
                    <div
                      className="w-3 h-3 rounded-full z-10"
                      style={{
                        background: isHollow ? "#fff" : dotColor,
                        border:     `2px solid ${dotColor}`,
                        boxShadow:  isHollow ? `0 0 0 2px ${dotColor}55` : "none",
                      }}
                    />
                    {!isLast && (
                      <div
                        className="flex-1 w-0.5 mt-1"
                        style={{ background: ev.status === "done" ? "#0057ff" : "#e6ebf1" }}
                      />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className="flex-1 px-3 py-2.5 rounded-lg"
                    style={{
                      background: bgMap[ev.status] ?? "#fafbfc",
                      border:     `1px solid ${borderMap[ev.status] ?? "#e6ebf1"}`,
                    }}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[13px] font-semibold text-[#0a2540] tracking-[-0.005em]">{ev.title}</span>
                      <span className="text-[11px] text-[#8898aa] font-mono">{ev.date}</span>
                    </div>
                    <div className="text-[12px] text-[#425466] leading-[1.45]">{ev.body}</div>
                    {ev.errorMessage && (
                      <div className="mt-1.5 text-[11.5px] text-[#cd3d64] font-mono bg-[#ffe1e6] px-2 py-1 rounded">
                        {ev.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SfxCard>

        {/* Email & PDF preview */}
        <SfxCard padding={false} className="overflow-hidden">
          <OutgoingPreviewTabs
            dbId={quotation.id}
            noPiece={quotation.noPiece}
            libelle={quotation.libelle}
            clientEmail={quotation.clientEmail}
            clientLanguage={quotation.clientLanguage}
            template={template}
            smtpFrom={smtpFrom}
          />
        </SfxCard>
      </div>
    </div>
  );
}
