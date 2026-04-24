"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, List, X, ArrowRight, Loader } from "lucide-react";
import { TransportBadge, QuotationStatusPill } from "@/components/sfx-ui";

interface SearchResult {
  type: "quotation";
  id: number;
  quotationId: string;
  clientCode: string;
  clientEmail: string;
  transportType: string;
  status: string;
  libelle: string;
}

async function searchQuotations(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

const SHORTCUTS = [
  { label: "Tableau de bord",  href: "/dashboard",  icon: "dashboard" },
  { label: "Cotations",        href: "/quotations",  icon: "list" },
  { label: "Templates email",  href: "/templates",   icon: "mail" },
  { label: "Audit / Logs",     href: "/logs",        icon: "logs" },
  { label: "Worker",           href: "/worker",      icon: "worker" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus input quand ouvert
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Recherche avec debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      startTransition(async () => {
        const r = await searchQuotations(query);
        setResults(r);
        setActiveIdx(0);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const items = query.trim()
    ? results
    : SHORTCUTS.map((s) => ({ type: "shortcut" as const, ...s }));

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIdx];
      if (!item) return;
      if (item.type === "quotation") navigate(`/quotations/${(item as SearchResult).id}`);
      else if (item.type === "shortcut") navigate((item as any).href);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(10,37,64,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-140 bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(10,37,64,0.2), 0 4px 16px rgba(10,37,64,0.1)" }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e6ebf1]">
          {isPending
            ? <Loader className="h-4 w-4 text-[#0057ff] shrink-0 animate-spin" />
            : <Search className="h-4 w-4 text-[#8898aa] shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher cotations, clients, références…"
            className="flex-1 text-[14px] text-[#0a2540] bg-transparent outline-none placeholder:text-[#8898aa]"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#8898aa] hover:text-[#425466]">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center justify-center h-5 px-1.5 bg-[#f6f8fa] border border-[#e6ebf1] rounded text-[11px] text-[#697386] font-mono">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-100 overflow-auto py-1.5">
          {!query.trim() && (
            <div className="px-4 py-1.5 text-[11px] font-semibold text-[#8898aa] uppercase tracking-[0.06em]">
              Navigation rapide
            </div>
          )}

          {query.trim() && results.length === 0 && !isPending && (
            <div className="px-4 py-8 text-center text-[13px] text-[#8898aa]">
              Aucun résultat pour « {query} »
            </div>
          )}

          {query.trim() && results.length > 0 && (
            <div className="px-4 py-1.5 text-[11px] font-semibold text-[#8898aa] uppercase tracking-[0.06em]">
              Cotations ({results.length})
            </div>
          )}

          {items.map((item, i) => {
            const isActive = i === activeIdx;

            if (item.type === "quotation") {
              const q = item as SearchResult;
              return (
                <button
                  key={q.id}
                  onClick={() => navigate(`/quotations/${q.id}`)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ background: isActive ? "#f2f6ff" : "transparent" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#e7efff", color: "#0057ff" }}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#0057ff] font-mono">{q.quotationId}</span>
                      <TransportBadge type={q.transportType} />
                      <QuotationStatusPill status={q.status} />
                    </div>
                    <div className="text-[12px] text-[#697386] truncate mt-0.5">
                      {q.clientCode}
                      {q.libelle && q.libelle !== q.clientCode && ` · ${q.libelle}`}
                      <span className="ml-1.5 text-[#8898aa]">{q.clientEmail}</span>
                    </div>
                  </div>
                  {isActive && <ArrowRight className="h-3.5 w-3.5 text-[#0057ff] shrink-0" />}
                </button>
              );
            }

            // Shortcut
            const s = item as typeof SHORTCUTS[0] & { type: "shortcut" };
            return (
              <button
                key={s.href}
                onClick={() => navigate(s.href)}
                onMouseEnter={() => setActiveIdx(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ background: isActive ? "#f2f6ff" : "transparent" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isActive ? "#e7efff" : "#f6f8fa", color: isActive ? "#0057ff" : "#697386" }}
                >
                  <List className="h-4 w-4" />
                </div>
                <span className="flex-1 text-[13px] font-medium text-[#0a2540]">{s.label}</span>
                {isActive && <ArrowRight className="h-3.5 w-3.5 text-[#0057ff] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#e6ebf1] flex items-center gap-4 text-[11px] text-[#8898aa]">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[#f6f8fa] border border-[#e6ebf1] rounded font-mono">↑↓</kbd>
            naviguer
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[#f6f8fa] border border-[#e6ebf1] rounded font-mono">↵</kbd>
            ouvrir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[#f6f8fa] border border-[#e6ebf1] rounded font-mono">Esc</kbd>
            fermer
          </span>
        </div>
      </div>
    </div>
  );
}


export function useCommandPalette() {
  function open() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  }
  return { open };
}
