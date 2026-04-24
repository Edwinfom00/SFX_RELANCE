"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogsPaginationProps {
  page: number;
  pageCount: number;
  status?: string;
}

export function LogsPagination({ page, pageCount, status }: LogsPaginationProps) {
  const pathname = usePathname();

  function href(p: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `${pathname}?${params.toString()}`;
  }

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
    <div className="flex items-center justify-between px-4.5 py-3 bg-[#fafbfc] border border-[#e6ebf1] rounded-xl">
      <span className="text-[12.5px] text-[#697386]">
        Page <b className="text-[#0a2540]">{page}</b> sur <b className="text-[#0a2540]">{pageCount}</b>
      </span>

      <div className="flex items-center gap-1">
        {/* Précédent */}
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12.5px] font-medium text-[#425466] hover:bg-white hover:border hover:border-[#e6ebf1] transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Précédent
          </Link>
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
            <Link
              key={p}
              href={href(p as number)}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-lg text-[12.5px] font-mono font-medium transition-all",
                p === page
                  ? "bg-[#0057ff] text-white"
                  : "text-[#425466] hover:bg-white hover:border hover:border-[#e6ebf1]"
              )}
            >
              {p}
            </Link>
          )
        )}

        {/* Suivant */}
        {page < pageCount ? (
          <Link
            href={href(page + 1)}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12.5px] font-medium text-[#425466] hover:bg-white hover:border hover:border-[#e6ebf1] transition-all"
          >
            Suivant
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12.5px] font-medium text-[#d8dee6] cursor-not-allowed">
            Suivant
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
