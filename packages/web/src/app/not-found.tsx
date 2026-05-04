import Link from "next/link";
import { SfxButton } from "@/components/sfx-ui";
import { ArrowLeft, FileText } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-[80px] font-bold text-[#e6ebf1] leading-none mb-4 select-none">
          404
        </div>
        <h1 className="text-[22px] font-semibold text-[#0a2540] tracking-[-0.02em] mb-2">
          Page introuvable
        </h1>
        <p className="text-[14px] text-[#697386] leading-[1.6] mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <SfxButton variant="primary" size="md" icon={ArrowLeft}>
              Retour au tableau de bord
            </SfxButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
