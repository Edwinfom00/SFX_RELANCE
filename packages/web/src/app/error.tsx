"use client";

import { useEffect } from "react";
import { SfxButton } from "@/components/sfx-ui";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "#ffe1e6" }}
        >
          <svg className="h-8 w-8 text-[#cd3d64]" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h1 className="text-[22px] font-semibold text-[#0a2540] tracking-[-0.02em] mb-2">
          Une erreur est survenue
        </h1>
        <p className="text-[14px] text-[#697386] leading-[1.6] mb-2">
          Le serveur a rencontré un problème inattendu.
        </p>

        {error.digest && (
          <div className="mb-6 px-3 py-2 bg-[#f6f8fa] border border-[#e6ebf1] rounded-lg">
            <span className="text-[11px] text-[#8898aa] font-mono">
              Code : {error.digest}
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <SfxButton variant="primary" size="md" icon={RefreshCw} onClick={reset}>
            Réessayer
          </SfxButton>
          <Link href="/dashboard">
            <SfxButton variant="secondary" size="md" icon={ArrowLeft}>
              Tableau de bord
            </SfxButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
