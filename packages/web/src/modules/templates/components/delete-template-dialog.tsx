"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
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
import { deleteTemplateAction } from "../actions";
import { toast } from "sonner";

interface DeleteTemplateDialogProps {
  id: number;
  name: string;
}

export function DeleteTemplateDialog({ id, name }: DeleteTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteTemplateAction(id);
      toast.success(`Template "${name}" supprimé`);
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
        <Trash2 className="h-4 w-4" />
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le template</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de supprimer{" "}
            <span className="font-medium text-foreground">"{name}"</span>.
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md">Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
