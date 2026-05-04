"use client";

import { useEffect } from "react";
import { SfxButton } from "@/components/sfx-ui";
import { RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-sm">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "#ffe1e6" }}
        >
          <svg className="h-6 w-6 text-[#cd3d64]" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className="text-[18px] font-semibold text-[#0a2540] tracking-[-0.02em] mb-1.5">
          Erreur de chargement
        </h2>
        <p className="text-[13px] text-[#697386] leading-[1.6] mb-5">
          {error.message || "Une erreur inattendue s'est produite."}
        </p>
        {error.digest && (
          <div className="mb-4 px-3 py-1.5 bg-[#f6f8fa] border border-[#e6ebf1] rounded-lg inline-block">
            <span className="text-[11px] text-[#8898aa] font-mono">
              {error.digest}
            </span>
          </div>
        )}
        <SfxButton variant="primary" size="sm" icon={RefreshCw} onClick={reset}>
          Réessayer
        </SfxButton>
      </div>
    </div>
  );
}
