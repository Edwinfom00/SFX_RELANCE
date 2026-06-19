"use client";

import { useState, useEffect, useTransition } from "react";
import { Search, Edit2, Mail, Users, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { SfxButton, Pill } from "@/components/sfx-ui";
import { getClientsAction } from "../actions";
import { EditClientModal } from "./edit-client-modal";
import type { Client } from "../types";
import { cn } from "@/lib/utils";

export function ClientsView() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [, startTransition] = useTransition();

  const pageSize = 15;

  const fetchClients = (query = "", p = 1) => {
    setLoading(true);
    startTransition(async () => {
      const res = await getClientsAction(query, p, pageSize);
      if (res.success && res.data) {
        setClients(res.data as any);
        setPageCount(res.pageCount || 1);
        setTotal(res.total || 0);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    setPage(1);
    fetchClients(search, 1);
  }, [search]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchClients(search, p);
  };

  // Calcul des pages à afficher (max 7 boutons)
  function getPages(): (number | "…")[] {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < pageCount - 2) pages.push("…");
    pages.push(pageCount);
    return pages;
  }

  const pages = getPages();

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2.5 h-8.5 px-3 bg-white border border-[#e6ebf1] rounded-[7px] sfx-shadow-sm">
        <Search className="h-3.5 w-3.5 text-[#8898aa] shrink-0" />
        <input
          type="text"
          placeholder="Rechercher un client par raison sociale, code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-[13px] text-[#0a2540] bg-transparent outline-none placeholder:text-[#8898aa]"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden sfx-shadow-sm">
        <table className="w-full text-left border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#fafbfc] border-b border-[#e6ebf1] text-[#697386] font-semibold">
              <th className="px-5 py-3 w-[150px]">Code Client</th>
              <th className="px-5 py-3 w-[250px]">Raison Sociale / Nom</th>
              <th className="px-5 py-3">E-mails de relance</th>
              <th className="px-5 py-3 w-[100px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6ebf1]">
            {loading ? (
              /* Skeleton Loader */
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-4"><div className="h-4.5 bg-gray-100 rounded w-16" /></td>
                  <td className="px-5 py-4"><div className="h-4.5 bg-gray-100 rounded w-36" /></td>
                  <td className="px-5 py-4"><div className="h-4.5 bg-gray-100 rounded w-52" /></td>
                  <td className="px-5 py-4 text-right"><div className="h-6 bg-gray-100 rounded w-12 ml-auto" /></td>
                </tr>
              ))
            ) : clients.length === 0 ? (
              /* Empty State */
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-[#697386]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-8 w-8 text-[#8898aa] stroke-[1.5]" />
                    <div className="font-semibold text-sm text-[#0a2540]">Aucun client trouvé</div>
                    <div className="text-xs">
                      {search ? "Essayez de modifier votre recherche." : "Lancez la synchronisation pour importer des clients."}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              /* Client Rows */
              clients.map((c) => {
                const emailList = c.emails
                  ? c.emails.split(/[;,]/).map((e) => e.trim()).filter((e) => e !== "")
                  : [];

                return (
                  <tr key={c.id} className="hover:bg-[#fafbfc] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#0057ff] font-semibold">
                      {c.code}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#0a2540]">
                      {c.name || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {emailList.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[#cd3d64] bg-[#fff5f6] border border-[#ffdee3] px-2 py-0.5 rounded-[5px] text-[11px] font-medium">
                          <AlertCircle className="h-3 w-3" />
                          Aucune adresse configurée
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-xl">
                          {emailList.map((email, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-[#f2f6ff] text-[#0057ff] border border-[#0057ff]/10 px-2 py-0.5 rounded-[5px] text-[11px] font-medium font-mono"
                            >
                              <Mail className="h-2.7 w-2.7 stroke-[2]" />
                              {email}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedClient(c)}
                        className="inline-flex items-center justify-center h-7 px-2.5 rounded-[7px] text-[#425466] hover:text-[#0057ff] hover:bg-[#f2f6ff] border border-transparent hover:border-[#0057ff]/10 font-medium transition-all cursor-pointer text-xs"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Modifier
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-4.5 py-3 bg-[#fafbfc] border border-[#e6ebf1] rounded-xl">
          <span className="text-[12.5px] text-[#697386]">
            Page <b className="text-[#0a2540]">{page}</b> sur <b className="text-[#0a2540]">{pageCount}</b> ({total} clients au total)
          </span>

          <div className="flex items-center gap-1">
            {/* Précédent */}
            {page > 1 ? (
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12.5px] font-medium text-[#425466] hover:bg-white hover:border hover:border-[#e6ebf1] transition-all cursor-pointer bg-transparent border border-transparent"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Précédent
              </button>
            ) : (
              <span className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12.5px] font-medium text-[#d8dee6] cursor-not-allowed">
                <ChevronLeft className="h-3.5 w-3.5" />
                Précédent
              </span>
            )}

            {/* Pages */}
            {pages.map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-[12.5px] text-[#8898aa]">
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={p}
                  onClick={() => handlePageChange(p as number)}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-lg text-[12.5px] font-mono font-medium transition-all cursor-pointer border",
                    p === page
                      ? "bg-[#0057ff] text-white border-[#0057ff]"
                      : "text-[#425466] bg-transparent border-transparent hover:bg-white hover:border-[#e6ebf1]"
                  )}
                >
                  {p}
                </button>
              )
            )}

            {/* Suivant */}
            {page < pageCount ? (
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12.5px] font-medium text-[#425466] hover:bg-white hover:border hover:border-[#e6ebf1] transition-all cursor-pointer bg-transparent border border-transparent"
              >
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12.5px] font-medium text-[#d8dee6] cursor-not-allowed">
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedClient && (
        <EditClientModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSuccess={() => fetchClients(search, page)}
        />
      )}
    </div>
  );
}
