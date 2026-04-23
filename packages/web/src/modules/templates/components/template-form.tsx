"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TemplateInput } from "../validators";
import { createTemplateAction, updateTemplateAction } from "../actions";
import type { EmailTemplate } from "../types";

interface TemplateFormProps {
  template?: EmailTemplate;
  onSuccess: () => void;
}

export function TemplateForm({ template, onSuccess }: TemplateFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!template;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemplateInput>({
    defaultValues: template
      ? {
          name: template.name,
          transportType: template.transportType,
          reminderNumber: template.reminderNumber,
          subject: template.subject,
          body: template.body,
          isActive: template.isActive,
        }
      : { isActive: true },
  });

  const isActive = watch("isActive");

  function onSubmit(data: TemplateInput) {
    startTransition(async () => {
      if (isEdit) {
        await updateTemplateAction(template.id, data);
        toast.success("Template mis à jour");
      } else {
        await createTemplateAction(data);
        toast.success("Template créé");
      }
      onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nom du template</Label>
        <Input
          id="name"
          placeholder="Ex: Relance 1 Aérien"
          className="rounded-md"
          {...register("name", { required: "Nom requis" })}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type de transport</Label>
          <Select
            value={watch("transportType")}
            onValueChange={(v) => setValue("transportType", v as TemplateInput["transportType"])}
          >
            <SelectTrigger className="rounded-md h-9 w-full">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AIR">Aérien</SelectItem>
              <SelectItem value="SEA">Maritime</SelectItem>
              <SelectItem value="ROAD">Route</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Numéro de relance</Label>
          <Select
            value={String(watch("reminderNumber") ?? "")}
            onValueChange={(v) => setValue("reminderNumber", Number(v) as 1 | 2 | 3)}
          >
            <SelectTrigger className="rounded-md h-9 w-full">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Relance 1</SelectItem>
              <SelectItem value="2">Relance 2</SelectItem>
              <SelectItem value="3">Relance 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject">Sujet de l'email</Label>
        <Input
          id="subject"
          placeholder="Ex: Relance cotation {{quotation_id}}"
          className="rounded-md"
          {...register("subject", { required: "Sujet requis" })}
        />
        {errors.subject && (
          <p className="text-xs text-destructive">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Corps de l'email</Label>
        <Textarea
          id="body"
          placeholder={"Bonjour,\n\nNous vous relançons concernant la cotation {{quotation_id}}..."}
          className="rounded-md min-h-40 font-mono text-sm resize-y"
          {...register("body", { required: "Corps du mail requis" })}
        />
        {errors.body && (
          <p className="text-xs text-destructive">{errors.body.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Variable disponible :{" "}
          <code className="bg-muted px-1 rounded-sm">{"{{quotation_id}}"}</code>
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border px-4 py-3">
        <div className="space-y-0.5">
          <Label htmlFor="isActive" className="cursor-pointer">
            Template actif
          </Label>
          <p className="text-xs text-muted-foreground">
            Seuls les templates actifs sont utilisés pour les envois
          </p>
        </div>
        <Switch
          id="isActive"
          checked={isActive ?? true}
          onCheckedChange={(v) => setValue("isActive", v)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-md"
          onClick={onSuccess}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button type="submit" className="rounded-md" disabled={isPending}>
          {isPending ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </form>
  );
}
