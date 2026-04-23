"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cancelQuotationAction } from "../actions";
import { toast } from "sonner";

interface CancelDialogProps {
  quotationId: number;
  quotationRef: string;
}

export function CancelDialog({ quotationId, quotationRef }: CancelDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await cancelQuotationAction(quotationId);
      toast.success(`Relance annulée pour la cotation ${quotationRef}`);
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-md"
        />
      }>
        <X className="h-4 w-4" />
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler la relance</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point d'arrêter toutes les relances pour la cotation{" "}
            <span className="font-medium text-foreground">{quotationRef}</span>.
            Cette action ne peut pas être annulée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md">Retour</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Annulation..." : "Confirmer l'annulation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
