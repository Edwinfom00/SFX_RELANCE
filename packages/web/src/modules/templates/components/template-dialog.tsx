"use client";

import { useState } from "react";
import { Plus, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TemplateForm } from "./template-form";
import type { EmailTemplate } from "../types";

interface TemplateDialogProps {
  template?: EmailTemplate;
}

export function TemplateDialog({ template }: TemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!template;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        isEdit ? (
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" />
        ) : (
          <Button size="sm" className="rounded-md gap-1.5" />
        )
      }>
        {isEdit ? (
          <Edit className="h-4 w-4" />
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Nouveau template
          </>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-md max-w-lg!">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le template" : "Nouveau template"}
          </DialogTitle>
        </DialogHeader>
        <TemplateForm
          template={template}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
