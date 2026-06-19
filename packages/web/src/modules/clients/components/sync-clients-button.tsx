"use client";

import { useTransition } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { SfxButton } from "@/components/sfx-ui";
import { triggerClientSyncAction } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SyncClientsButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSync() {
    startTransition(async () => {
      const res = await triggerClientSyncAction();
      if (res.success) {
        toast.success("Synchronisation des clients terminée !");
        router.refresh();
      } else {
        toast.error(res.error || "Erreur de synchronisation.");
      }
    });
  }

  return (
    <SfxButton
      variant="secondary"
      size="sm"
      icon={isPending ? Loader2 : RefreshCw}
      disabled={isPending}
      onClick={handleSync}
      className={isPending ? "cursor-not-allowed" : ""}
    >
      {isPending ? "Synchronisation…" : "Synchroniser les clients"}
    </SfxButton>
  );
}
