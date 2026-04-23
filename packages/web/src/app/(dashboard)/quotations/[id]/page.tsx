import { notFound } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, Plane, Ship, Truck, Check, ExternalLink } from "lucide-react";
import { TransportBadge, Pill, SfxCard, SfxButton, ReminderSteps } from "@/components/sfx-ui";
import { CancelDialog } from "@/modules/quotations/components/cancel-dialog";
import { EmailPreview } from "@/modules/quotations/components/email-preview";
import { SendNowDialog } from "@/modules/quotations/components/send-now-dialog";
import prisma from "@/lib/prisma";

async function getQuotationDetail(id: number) {
  return prisma.quotation.findUnique({
    where: { id },
    include: {
      emailLogs: {
        include: { template: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      cancelledBy: { select: { name: true } },
    },
  });
}

async function getNextTemplate(transportType: string, nextReminderNumber: number) {
  return prisma.emailTemplate.findFirst({
    where: { transportType, reminderNumber: nextReminderNumber, isActive: true },
    select: { id: true, name: true, subject: true, subjectEn: true, body: true, bodyEn: true },
  });
}

const transportIcon: Record<string, React.ElementType> = {
  AIR: Plane, SEA: Ship, ROAD: Truck,
};

const transportLabel: Record<string, string> = {
  AIR: "Aérien", SEA: "Maritime", ROAD: "Route",
};

const reminderLabel: Record<number, string> = {
  1: "Relance #1 · 24h",
  2: "Relance #2 · 48h",
  3: "Relance #3 · finale",
};

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotation = await getQuotationDetail(Number(id));
  if (!quotation) notFound();

  const TransIcon = transportIcon[quotation.transportType] ?? Plane;
  const isActive = quotation.status === "ACTIVE";
  const nextReminderNumber = Math.min(quotation.currentReminder + 1, 3);
  const nextTemplate = isActive
    ? await getNextTemplate(quotation.transportType, nextReminderNumber)
    : null;
  const smtpFrom = process.env.SMTP_FROM ?? "";

  const timelineSteps: Array<{
    date: string; type: string; title: string; body: string;
    status: string; delay: string | null; errorMessage?: string | null;
  }> = [
    {
      date: format(new Date(quotation.transmissionDate), "dd MMM · HH:mm", { locale: fr }),
      type: "transmit",
      title: "Cotation transmise au client",
      body: "Email envoyé depuis cotations@sfx-logistics.com",
      status: "done",
      delay: null,
    },
    ...quotation.emailLogs.map((log) => ({
      date: log.sentAt
        ? format(new Date(log.sentAt), "dd MMM · HH:mm", { locale: fr })
        : format(new Date(log.createdAt), "dd MMM · HH:mm", { locale: fr }),
      type: log.status === "FAILED" ? "error" : "relance",
      title: log.status === "FAILED"
        ? `Bounce détecté · Relance #${log.reminderNumber}`
        : `Relance #${log.reminderNumber} envoyée`,
      body: log.template?.name ?? `Relance #${log.reminderNumber}`,
      status: log.status === "SENT" ? "done" : log.status === "FAILED" ? "error" : "scheduled",
      delay: `+${log.reminderNumber * 24}h`,
      errorMessage: log.errorMessage,
    })),
  ];

  // Next scheduled step
  if (isActive && quotation.currentReminder < 3) {
    const nextStep = quotation.currentReminder + 1;
    timelineSteps.push({
      date: quotation.nextReminderAt
        ? format(new Date(quotation.nextReminderAt), "dd MMM · HH:mm", { locale: fr })
        : "—",
      type: "relance",
      title: reminderLabel[nextStep] ?? `Relance #${nextStep}`,
      body: "Planifiée automatiquement",
      status: "scheduled",
      delay: `+${nextStep * 24}h`,
      errorMessage: null,
    });
  }

  const progressSteps = [
    { l: "Transmission", done: true },
    { l: "Relance #1 · 24h", done: quotation.currentReminder >= 1 },
    { l: "Relance #2 · 48h", done: quotation.currentReminder >= 2 },
    { l: "Relance #3 · 72h", done: quotation.currentReminder >= 3, active: isActive && quotation.currentReminder === 2 },
  ];

  return (
    <div className="px-7 py-5 pb-10">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[13px] text-[#697386]">
          <Link href="/quotations" className="hover:text-[#0a2540] transition-colors cursor-pointer">
            Cotations
          </Link>
          <ChevronRight className="h-[13px] w-[13px] text-[#8898aa]" />
          <span className="text-[#0a2540] font-[550]">{quotation.quotationId}</span>
        </div>
        <div className="flex gap-2">
          <SfxButton variant="secondary" size="sm" icon={ExternalLink}>Voir dans Brainvape</SfxButton>
          {isActive && <CancelDialog quotationId={quotation.id} quotationRef={quotation.quotationId} />}
          {isActive && quotation.currentReminder < 3 && (
            <SendNowDialog
              quotationId={quotation.id}
              quotationRef={quotation.quotationId}
              clientEmail={quotation.clientEmail}
              transportType={quotation.transportType}
              nextReminderNumber={nextReminderNumber}
              templateName={nextTemplate?.name}
            />
          )}
        </div>
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
              <span className="text-[13px] font-mono text-[#0057ff] font-semibold">{quotation.quotationId}</span>
              <TransportBadge type={quotation.transportType} />
              {isActive && quotation.nextReminderAt && (
                <Pill tone="amber">
                  Prochaine dans {formatDistanceToNow(new Date(quotation.nextReminderAt), { locale: fr })}
                </Pill>
              )}
              {!isActive && <Pill tone={quotation.status === "COMPLETED" ? "green" : "neutral"}>{quotation.status === "COMPLETED" ? "Terminé" : "Annulé"}</Pill>}
            </div>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] m-0 text-[#0a2540]">
              {quotation.libelle || quotation.clientCode}
            </h2>

            {/* Meta */}
            <div className="flex gap-[22px] mt-3.5 text-[12.5px] text-[#425466]">
              <div>
                <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Contact</div>
                <div className="text-[#0a2540] font-[550]">{quotation.clientCode}</div>
                <div className="font-mono text-[12px]">{quotation.clientEmail}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Transmise</div>
                <div className="text-[#0a2540] font-[550]">
                  {format(new Date(quotation.transmissionDate), "dd MMM yyyy · HH:mm", { locale: fr })}
                </div>
                <div className="text-[#697386] text-[11px]">
                  {formatDistanceToNow(new Date(quotation.transmissionDate), { addSuffix: true, locale: fr })}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Transport</div>
                <div className="text-[#0a2540] font-[550]">{transportLabel[quotation.transportType]}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#8898aa] font-semibold tracking-[0.04em] uppercase mb-0.5">Relances</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ReminderSteps current={quotation.currentReminder} />
                  <span className="text-[#0a2540] font-semibold font-mono">{quotation.currentReminder} / 3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 px-4 py-3.5 bg-[#f6f8fa] rounded-[9px] border border-[#e6ebf1]">
          <div className="flex justify-between mb-2.5 text-[12px] text-[#425466] font-[550]">
            <span>Parcours de relance · {transportLabel[quotation.transportType]} (24h / 48h / 72h)</span>
            <span className="font-mono text-[#0a2540]">{quotation.currentReminder} / 3</span>
          </div>
          <div className="flex items-center gap-1">
            {progressSteps.map((s, i, arr) => (
              <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold font-mono"
                    style={{
                      background: s.done ? "#0057ff" : (s as any).active ? "#fff" : "#f6f8fa",
                      color: s.done ? "#fff" : "#8898aa",
                      border: (s as any).active ? "1.5px solid #0057ff" : "none",
                      boxShadow: (s as any).active ? "0 0 0 3px #f2f6ff" : "none",
                    }}
                  >
                    {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : i}
                  </div>
                  <span
                    className="text-[12px]"
                    style={{
                      fontWeight: (s as any).active ? 600 : 500,
                      color: (s as any).active ? "#0a2540" : s.done ? "#425466" : "#8898aa",
                    }}
                  >
                    {s.l}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 rounded-full" style={{ background: s.done ? "#0057ff" : "#e6ebf1" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </SfxCard>

      {/* Two-column: timeline + email preview */}
      <div className="grid grid-cols-[1.1fr_1fr] gap-3.5">
        {/* Timeline */}
        <SfxCard padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
            <div>
              <div className="text-sm font-semibold text-[#0a2540] tracking-tight">Historique complet</div>
              <div className="text-xs text-[#697386] mt-0.5">Chaque évènement est audité et signé</div>
            </div>
            <Pill tone="neutral">{timelineSteps.length} évènements</Pill>
          </div>
          <div className="px-5 py-2 pb-5">
            {timelineSteps.map((ev, i) => {
              const isLast = i === timelineSteps.length - 1;
              const dotColor = ev.status === "done" ? "#0057ff" : ev.status === "error" ? "#cd3d64" : ev.status === "scheduled" ? "#c28b00" : "#e6ebf1";
              return (
                <div key={i} className="flex gap-3.5 relative" style={{ paddingBottom: isLast ? 0 : 18 }}>
                  {/* Dot + line */}
                  <div className="w-[22px] shrink-0 flex flex-col items-center pt-4">
                    <div
                      className="w-3 h-3 rounded-full z-10"
                      style={{
                        background: ev.status === "scheduled" ? "#fff" : dotColor,
                        border: `2px solid ${dotColor}`,
                        boxShadow: ev.status === "scheduled" ? `0 0 0 2px ${dotColor}55` : "none",
                      }}
                    />
                    {!isLast && (
                      <div className="flex-1 w-0.5 mt-1" style={{ background: ev.status === "done" ? "#0057ff" : "#e6ebf1" }} />
                    )}
                  </div>
                  {/* Content */}
                  <div
                    className="flex-1 px-3 py-2.5 rounded-lg"
                    style={{
                      background: ev.status === "scheduled" ? "rgba(194,139,0,0.08)" : "#fafbfc",
                      border: `1px solid ${ev.status === "scheduled" ? "#fff3d6" : "#e6ebf1"}`,
                    }}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[13px] font-semibold text-[#0a2540] tracking-[-0.005em]">{ev.title}</span>
                      <span className="text-[11px] text-[#8898aa] font-mono">
                        {ev.date}
                        {ev.delay && <span className="ml-2 text-[#0057ff] font-semibold">{ev.delay}</span>}
                      </span>
                    </div>
                    <div className="text-[12px] text-[#425466] leading-[1.45]">{ev.body}</div>
                    {ev.errorMessage && (
                      <div className="mt-1.5 text-[11.5px] text-[#cd3d64] font-mono bg-[#ffe1e6] px-2 py-1 rounded">
                        {ev.errorMessage}
                      </div>
                    )}
                    {ev.status === "scheduled" && (
                      <div className="mt-2 flex gap-1.5">
                        <SfxButton variant="secondary" size="sm">Décaler de 24h</SfxButton>
                        <SfxButton variant="ghost" size="sm">Aperçu</SfxButton>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SfxCard>

        {/* Email preview */}
        <SfxCard padding={false} className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
            <div>
              <div className="text-sm font-semibold text-[#0a2540] tracking-tight">Aperçu de la prochaine relance</div>
              <div className="text-xs text-[#697386] mt-0.5">
                Relance #{nextReminderNumber} · {transportLabel[quotation.transportType]}
                {nextTemplate && <span className="ml-1.5 text-[#8898aa]">· {nextTemplate.name}</span>}
              </div>
            </div>
          </div>
          <EmailPreview
            quotationId={quotation.quotationId}
            libelle={quotation.libelle}
            clientEmail={quotation.clientEmail}
            nextReminderNumber={nextReminderNumber}
            nextReminderAt={quotation.nextReminderAt}
            template={nextTemplate}
            smtpFrom={smtpFrom}
          />
        </SfxCard>
      </div>
    </div>
  );
}
