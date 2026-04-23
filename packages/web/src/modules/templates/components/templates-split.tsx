"use client";

import { useState, useTransition, useRef } from "react";
import { Search, Plus, Check, Eye, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TransportBadge, Pill, SfxButton } from "@/components/sfx-ui";
import { Sparkline } from "@/components/sfx-charts";
import { TemplateDialog } from "./template-dialog";
import { DeleteTemplateDialog } from "./delete-template-dialog";
import { updateTemplateAction, toggleTemplateActiveAction } from "../actions";
import type { EmailTemplate } from "../types";

interface TemplateWithStats extends EmailTemplate {
  stats: { sent: number; rate: number };
}

interface TemplatesSplitProps {
  templates: TemplateWithStats[];
}

const reminderLabel: Record<number, string> = {
  1: "1ʳᵉ relance", 2: "2ᵉ relance", 3: "Relance finale",
};

const VARIABLES = [
  { k: "quote.id",      v: "FM1XX250595",       desc: "N° de cotation" },
  { k: "quote.libelle", v: "Transport Douala",   desc: "Libellé du dossier" },
  { k: "quote.client",  v: "FM1C0012",           desc: "Code client" },
  { k: "user.fullName", v: "Service Cotations",  desc: "Expéditeur" },
  { k: "user.phone",    v: "+237....",  desc: "Téléphone" },
];

export function TemplatesSplit({ templates }: TemplatesSplitProps) {
  const [selectedId, setSelectedId] = useState<number | null>(templates[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeLang, setActiveLang] = useState<"fr" | "en">("fr");

  // Édition inline
  const [editSubject, setEditSubject] = useState<string>("");
  const [editSubjectEn, setEditSubjectEn] = useState<string>("");
  const [editBody, setEditBody] = useState<string>("");
  const [editBodyEn, setEditBodyEn] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    { AIR: "aérien", SEA: "maritime", ROAD: "route" }[t.transportType]?.includes(search.toLowerCase())
  );

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  // Quand on change de template sélectionné, on reset l'état d'édition
  function selectTemplate(id: number) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSelectedId(id);
    setEditSubject(t.subject);
    setEditSubjectEn(t.subjectEn ?? "");
    setEditBody(t.body);
    setEditBodyEn(t.bodyEn ?? "");
    setIsDirty(false);
  }

  if (selected && editSubject === "" && editBody === "") {
    setEditSubject(selected.subject);
    setEditSubjectEn(selected.subjectEn ?? "");
    setEditBody(selected.body);
    setEditBodyEn(selected.bodyEn ?? "");
  }

  function handleSave() {
    if (!selected) return;
    startTransition(async () => {
      await updateTemplateAction(selected.id, {
        subject: editSubject,
        subjectEn: editSubjectEn,
        body: editBody,
        bodyEn: editBodyEn,
      });
      toast.success("Template enregistré");
      setIsDirty(false);
    });
  }

  function handleToggleActive() {
    if (!selected) return;
    startTransition(async () => {
      await toggleTemplateActiveAction(selected.id, !selected.isActive);
      toast.success(selected.isActive ? "Template désactivé" : "Template activé");
    });
  }

  function insertVariable(key: string) {
    const tag = `{{${key}}}`;
    const ta = bodyRef.current;
    if (!ta) {
      if (activeLang === "fr") setEditBody((b) => b + tag);
      else setEditBodyEn((b) => b + tag);
      setIsDirty(true);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = activeLang === "fr" ? editBody : editBodyEn;
    const next = current.slice(0, start) + tag + current.slice(end);
    if (activeLang === "fr") setEditBody(next);
    else setEditBodyEn(next);
    setIsDirty(true);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + tag.length;
      ta.focus();
    });
  }

  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100vh - 60px)" }}>
      {/* ── Left: list ─────────────────────────────────────────────────────── */}
      <div className="w-[380px] shrink-0 border-r border-[#e6ebf1] bg-[#fafbfc] flex flex-col">
        <div className="px-4.5 py-4 border-b border-[#e6ebf1]">
          <div className="flex justify-between items-center mb-2.5">
            <div className="text-sm font-semibold text-[#0a2540] tracking-tight">
              Bibliothèque de templates
            </div>
            <TemplateDialog />
          </div>
          <div className="flex items-center gap-1.5 h-7.5 px-2.5 bg-white border border-[#e6ebf1] rounded-lg text-[12.5px] text-[#8898aa]">
            <Search className="h-3.25 w-3.25 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer par nom, transport…"
              className="flex-1 bg-transparent outline-none text-[#0a2540] placeholder:text-[#8898aa]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-2.5 py-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#8898aa]">Aucun template</div>
          ) : (
            filtered.map((t) => {
              const isSelected = t.id === selectedId;
              const { sent, rate } = t.stats;
              const rateColor = rate >= 60 ? "#0e9f6e" : rate >= 45 ? "#c28b00" : "#cd3d64";
              return (
                <div
                  key={t.id}
                  onClick={() => selectTemplate(t.id)}
                  className="px-3 py-3 rounded-lg mb-1 cursor-pointer transition-all"
                  style={{
                    background: isSelected ? "#fff" : "transparent",
                    border: isSelected ? "1px solid #e6ebf1" : "1px solid transparent",
                    boxShadow: isSelected ? "0 1px 2px rgba(10,37,64,0.04)" : "none",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <TransportBadge type={t.transportType} />
                    <span className="w-4.5 h-4.5 rounded bg-[#f6f8fa] flex items-center justify-center text-[10.5px] font-bold text-[#0a2540] font-mono">
                      #{t.reminderNumber}
                    </span>
                    {!t.isActive && <Pill tone="neutral" size="xs">Inactif</Pill>}
                  </div>
                  <div
                    className="text-[13px] text-[#0a2540] tracking-[-0.005em] mb-1 truncate"
                    style={{ fontWeight: isSelected ? 600 : 550 }}
                  >
                    {t.name}
                  </div>
                  <div className="flex items-center gap-3.5 text-[11px] text-[#697386]">
                    <span>
                      <span className="text-[#425466] font-mono font-semibold">{sent}</span> envois
                    </span>
                    {sent > 0 ? (
                      <span className="font-semibold font-mono" style={{ color: rateColor }}>
                        {rate}% réponses
                      </span>
                    ) : (
                      <span className="text-[#8898aa]">Pas encore utilisé</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: inline editor ────────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 overflow-auto bg-white flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#e6ebf1] flex items-center justify-between gap-4 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <TransportBadge type={selected.transportType} />
                <span className="text-[12px] text-[#697386] font-mono">
                  tpl_{selected.transportType.toLowerCase()}_{selected.reminderNumber}
                </span>
                <span className="text-[#d8dee6]">·</span>
                <Pill tone={selected.reminderNumber === 3 ? "purple" : "blue"}>
                  {reminderLabel[selected.reminderNumber]}
                </Pill>
                {isDirty && <Pill tone="amber">Non enregistré</Pill>}
              </div>
              <h2 className="text-[20px] font-semibold text-[#0a2540] m-0 mt-1.5 tracking-[-0.02em]">
                {selected.name}
              </h2>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Toggle actif */}
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isPending}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <div
                  className="w-8 h-[18px] rounded-full p-0.5 transition-colors"
                  style={{ background: selected.isActive ? "#0057ff" : "#e6ebf1" }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full bg-white transition-transform"
                    style={{ transform: selected.isActive ? "translateX(14px)" : "translateX(0)" }}
                  />
                </div>
                <span className="text-[12.5px] text-[#425466] font-[550]">
                  {selected.isActive ? "Actif" : "Inactif"}
                </span>
              </button>
              <div className="w-px h-5 bg-[#e6ebf1] mx-1" />
              <DeleteTemplateDialog id={selected.id} name={selected.name} />
              {isDirty && (
                <SfxButton variant="primary" size="sm" icon={Check} onClick={handleSave} disabled={isPending}>
                  {isPending ? "Enregistrement…" : "Enregistrer"}
                </SfxButton>
              )}
              {!isDirty && (
                <SfxButton variant="secondary" size="sm" icon={Check} disabled>
                  Enregistré
                </SfxButton>
              )}
            </div>
          </div>

          {/* Editor + rail */}
          <div className="flex flex-1 overflow-hidden">
            {/* Editor */}
            <div className="flex-1 overflow-auto px-6 py-5 border-r border-[#e6ebf1]">
              {/* Lang tabs */}
              <div className="flex gap-0.5 border-b border-[#e6ebf1] mb-4">
                {(["fr", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className="px-3 py-2 text-[12.5px] font-[550] transition-colors"
                    style={{
                      color: activeLang === lang ? "#0a2540" : "#697386",
                      marginBottom: -1,
                      background: "transparent",
                      border: "none",
                      borderBottom: activeLang === lang ? "2px solid #0057ff" : "2px solid transparent",
                    }}
                  >
                    {lang === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
                  </button>
                ))}
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-[11.5px] font-semibold text-[#697386] tracking-[0.04em] uppercase mb-1.5">
                  Objet {activeLang === "en" ? "(EN)" : "(FR)"}
                </label>
                <input
                  value={activeLang === "fr" ? editSubject : editSubjectEn}
                  onChange={(e) => {
                    if (activeLang === "fr") setEditSubject(e.target.value);
                    else setEditSubjectEn(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3.5 bg-white border border-[#d8dee6] rounded-lg text-[14px] text-[#0a2540] font-medium outline-none focus:border-[#0057ff] focus:shadow-[0_0_0_3px_#f2f6ff] transition-all"
                  style={{ boxShadow: "0 1px 2px rgba(10,37,64,0.04)" }}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#697386] tracking-[0.04em] uppercase mb-1.5">
                  Corps de l'email {activeLang === "en" ? "(EN)" : "(FR)"}
                </label>
                <textarea
                  ref={bodyRef}
                  value={activeLang === "fr" ? editBody : editBodyEn}
                  onChange={(e) => {
                    if (activeLang === "fr") setEditBody(e.target.value);
                    else setEditBodyEn(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full min-h-[420px] px-4 py-3.5 bg-white border border-[#d8dee6] rounded-lg text-[13.5px] text-[#0a2540] leading-[1.7] font-mono outline-none focus:border-[#0057ff] focus:shadow-[0_0_0_3px_#f2f6ff] transition-all resize-y"
                  style={{ boxShadow: "0 1px 2px rgba(10,37,64,0.04)" }}
                  spellCheck={false}
                />
                <div className="mt-1.5 text-[11px] text-[#8898aa]">
                  {(activeLang === "fr" ? editBody : editBodyEn).split(/\s+/).filter(Boolean).length} mots ·{" "}
                  Cliquez sur une variable pour l'insérer à la position du curseur
                </div>
              </div>
            </div>

            {/* Right rail */}
            <div className="w-[280px] shrink-0 px-5 py-5 bg-[#fafbfc] overflow-auto">
              {/* Variables */}
              <div className="text-[11.5px] font-semibold text-[#697386] tracking-[0.04em] uppercase mb-2.5">
                Variables disponibles
              </div>
              <div className="flex flex-col gap-1 mb-5">
                {VARIABLES.map((v) => (
                  <button
                    key={v.k}
                    type="button"
                    onClick={() => insertVariable(v.k)}
                    className="px-2.5 py-2 rounded-lg bg-white border border-[#e6ebf1] text-left hover:border-[#0057ff] hover:bg-[#f2f6ff] transition-all group"
                  >
                    <div className="text-[11.5px] font-mono text-[#0057ff] font-semibold group-hover:text-[#0047d6]">
                      {`{{${v.k}}}`}
                    </div>
                    <div className="text-[11px] text-[#697386] mt-0.5">
                      {v.desc} · <span className="text-[#425466]">{v.v}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Performance réelle */}
              <div className="pt-4 border-t border-[#e6ebf1]">
                <div className="text-[11.5px] font-semibold text-[#697386] tracking-[0.04em] uppercase mb-3">
                  Performance
                </div>
                {(() => {
                  const { sent, rate } = selected.stats;
                  const rateColor = rate >= 60 ? "#0e9f6e" : rate >= 45 ? "#c28b00" : "#cd3d64";
                  if (sent === 0) {
                    return (
                      <div className="text-[12px] text-[#8898aa]">
                        Aucun envoi enregistré pour ce template.
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[12px] text-[#425466]">Taux de réponse</span>
                        <span className="text-[13px] font-semibold font-mono" style={{ color: rateColor }}>
                          {rate}%
                        </span>
                      </div>
                      <div className="h-1.25 bg-[#e6ebf1] rounded-full overflow-hidden mb-3.5">
                        <div className="h-full rounded-full" style={{ width: `${rate}%`, background: rateColor }} />
                      </div>
                      <div className="text-[11px] text-[#697386]">
                        {sent} envoi{sent > 1 ? "s" : ""} · {Math.round(sent * rate / 100)} réponse{Math.round(sent * rate / 100) > 1 ? "s" : ""}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#8898aa] text-[13px]">
          Sélectionnez un template
        </div>
      )}
    </div>
  );
}
